---
title: "Checkpoints & Rollback"
section: "Checkpoints & Rollback"
sectionOrder: 170
order: 1
slug: "checkpoints-rollback"
---

# DOC-017: Checkpoints и Rollback

## Обзор

Hermes Agent выполняет автоматический снимок проекта перед **деструктивными операциями** и восстанавливает его одной командой. Начиная с v2 checkpoints **opt-in** по умолчанию -- большинство пользователей не использует `/rollback`, а хранилище снимков создаёт нагрузку на диск, поэтому по умолчанию функция отключена.

Включение checkpoints для текущей сессии:

```
hermes chat --checkpoints
```

Глобальное включение в `~/.hermes/config.yaml`:

```yaml
checkpoints:
  enabled: true
```

Механизм работает через **Checkpoint Manager**, который поддерживает единую общую shadow git-репозиторий в `~/.hermes/checkpoints/store/`. Настоящий `.git` проекта не затрагивается. Все проекты, с которыми работает агент, используют общее хранилище, поэтому git-объекты дедуплицируются через content-addressable объектный database.

## Что вызывает создание checkpoint

Снимки создаются автоматически перед:

- **Файловые инструменты** -- `write_file` и `patch`
- **Деструктивные команды терминала** -- `rm`, `rmdir`, `cp`, `install`, `mv`, `sed -i`, `truncate`, `dd`, `shred`, перенаправления вывода (`>`), а также `git reset`, `git clean`, `git checkout`

Создаётся **не более одного checkpoint на директорию за ход разговора**, поэтому долгие сессии не засоряют хранилище снимками.

## Быстрая команда

### Slash-команды в сессии

| Команда | Описание |
|---|---|
| `/rollback` | Показать все checkpoints со статистикой изменений |
| `/rollback <N>` | Восстановить checkpoint N (также откатывает последний ход разговора) |
| `/rollback diff <N>` | Предварительный просмотр diff между checkpoint N и текущим состоянием |
| `/rollback <N> <file>` | Восстановить один файл из checkpoint N |

### CLI-команды для работы с хранилищем

| Команда | Описание |
|---|---|
| `hermes checkpoints` | Показать общий размер, количество проектов, разбивку по проектам |
| `hermes checkpoints status` | То же, что и `checkpoints` |
| `hermes checkpoints list` | Алиас для `status` |
| `hermes checkpoints prune` | Принудительная очистка: удаление сирот, устаревших данных, GC, ограничение размера |
| `hermes checkpoints clear` | Полная очистка хранилища checkpoints (с подтверждением) |
| `hermes checkpoints clear-legacy` | Удаление только архивов `legacy-*` из миграции v1 |

## Как работают checkpoints

Общий алгоритм:

1. Hermes определяет момент, когда инструменты собираются **изменить файлы** в рабочей директории.
2. Один раз за ход разговора (на директорию):
   - Определяет корень проекта для файла.
   - Инициализирует или переиспользует **общую shadow-стор** в `~/.hermes/checkpoints/store/`.
   - Индексирует файлы в per-project индекс, строит дерево и делает коммит в per-project ref (`refs/hermes/<project-hash>`).
3. Per-project ref-ы формируют историю checkpoints, которую можно просматривать и восстанавливать через `/rollback`.

## Конфигурация

Настройки в `~/.hermes/config.yaml`:

```yaml
checkpoints:
  enabled: false              # главный переключатель (по умолчанию false)
  max_snapshots: 20           # максимум checkpoints на проект
  max_total_size_mb: 500      # жёсткий лимит на общий размер хранилища
  max_file_size_mb: 10        # пропуск файлов крупнее этого размера
  auto_prune: true            # автоматическая очистка при запуске
  retention_days: 7           # срок хранения снимков
  delete_orphans: true        # удаление сирот (проекты с удалёнными директориями)
  min_interval_hours: 24      # интервал между автоматическими очистками
```

Полное отключение:

```yaml
checkpoints:
  enabled: false
  auto_prune: false
```

При `enabled: false` Checkpoint Manager не выполняет никаких git-операций. При `auto_prune: false` хранилище растёт до ручного запуска `hermes checkpoints prune`.

## Просмотр checkpoints

В сессии:

```
/rollback
```

Пример вывода:

```
Checkpoints for /path/to/project:
  1. 4270a8c  2026-03-16 04:36  before patch  (1 file, +1/-0)
  2. eaf4c1f  2026-03-16 04:35  before write_file
  3. b3f9d2e  2026-03-16 04:34  before terminal: sed -i s/old/new/ config.py  (1 file, +1/-1)

  /rollback <N>             восстановить checkpoint N
  /rollback diff <N>        предпросмотр изменений с момента checkpoint N
  /rollback <N> <file>      восстановить один файл из checkpoint N
```

## Просмотр хранилища из терминала

```
hermes checkpoints
```

Пример вывода:

```
Checkpoint base: /home/user/.hermes/checkpoints
Total size:      142.3 MB
  store/         138.1 MB
  legacy-*       4.2 MB

Projects:        12
  WORKDIR                                        COMMITS    LAST TOUCH  STATE
  /home/user/code/hermes-agent                     20       2h ago     live
  /home/user/code/experiments/rl-runner             8       1d ago     live
  /home/user/code/old-prototype                     3       9d ago     orphan

Legacy archives (1):
  legacy-20260506-050616                            4.2 MB

Clear with: hermes checkpoints clear-legacy
```

Принудительная очистка (игнорирует маркер идемпотентности 24ч):

```
hermes checkpoints prune --retention-days 3 --max-size-mb 200
```

## Предпросмотр изменений с /rollback diff

Перед восстановлением можно посмотреть, что изменилось с момента checkpoint:

```
/rollback diff 1
```

Выводит сводку diff-статистики и сам diff.

## Восстановление с /rollback

```
/rollback 1
```

Процесс восстановления:

1. Проверяет наличие целевого коммита в shadow-стор.
2. Создаёт **pre-rollback снимок** текущего состояния для возможности "отменить откат".
3. Восстанавливает отслеживаемые файлы в рабочей директории.
4. **Откатывает последний ход разговора**, чтобы контекст агента соответствовал восстановленной файловой системе.

## Восстановление одного файла

Восстановление одного файла из checkpoint без влияния на остальную директорию:

```
/rollback 1 src/broken_file.py
```

## Защитные ограничения

- **Наличие git** -- если `git` не найден в `PATH`, checkpoints молча отключаются.
- **Область директорий** -- Hermes пропускает слишком широкие директории (корень `/`, домашнюю `$HOME`).
- **Размер репозитория** -- директории с более чем 50 000 файлов пропускаются.
- **Лимит на размер файла** -- файлы крупнее `max_file_size_mb` (по умолчанию 10 МБ) исключаются из снимка. Предотвращает случайное включение датасетов, весов моделей или сгенерированных медиа.
- **Лимит на общий размер хранилища** -- при превышении `max_total_size_mb` (по умолчанию 500 МБ) самый старый коммит на проект удаляется round-robin.
- **Реальная очистка** -- `max_snapshots` реализуется через перезапись per-project ref и запуск `git gc --prune=now`, поэтому loose-объекты не накапливаются.
- **Снимки без изменений** -- если изменений нет, checkpoint пропускается.
- **Нефатальные ошибки** -- все ошибки в Checkpoint Manager логируются на уровне debug; инструменты продолжают работу.

## Структура хранилища checkpoints

```
~/.hermes/checkpoints/
  ├── store/                    # единый общий bare git-репозиторий
  │   ├── HEAD, objects/        # git-внутренности (общие для проектов)
  │   ├── refs/hermes/<hash>    # per-project branch tip
  │   ├── indexes/<hash>        # per-project git index
  │   ├── projects/<hash>.json  # workdir + created_at + last_touch
  │   └── info/exclude
  ├── .last_prune               # маркер идемпотентности auto-prune
  └── legacy-<ts>/              # архивы per-project shadow-репозиториев из v1
```

Каждый `<hash>` вычисляется из абсолютного пути рабочей директории. Ручное редактирование этих файлов не требуется -- используйте `hermes checkpoints status` / `prune` / `clear`.

## Миграция с v1 (legacy-архивы)

До переписывания в v2 каждая рабочая директория получала собственный полный shadow git-репозиторий в `~/.hermes/checkpoints/<hash>/`. Эта схема не поддерживала дедупликацию объектов между проектами, а очистка не работала -- хранилище росло бесконтрольно.

При первом запуске v2 существующие pre-v2 shadow-репозитории перемещаются в `~/.hermes/checkpoints/legacy-<timestamp>/`, чтобы новая схема с общим хранилищем стартовала чисто. Старая история `/rollback` по-прежнему доступна через ручной просмотр legacy-архива с помощью `git`. Когда убедитесь, что данные больше не нужны:

```
hermes checkpoints clear-legacy
```

Legacy-архивы также удаляются `auto_prune` после `retention_days`.

## Рекомендации

- **Включайте checkpoints только когда нужно** -- `hermes chat --checkpoints` или `enabled: true` в профиле.
- **Используйте `/rollback diff` перед восстановлением** --.preview изменений позволяет выбрать правильный checkpoint.
- **Используйте `/rollback` вместо `git reset`** когда нужно отменить только изменения агента.
- **Периодически проверяйте `hermes checkpoints status`** -- покажет активные проекты и стоимость хранилища на диске.
- **Комбинируйте с Git worktrees** для максимальной безопасности -- держите каждую сессию Hermes в отдельном worktree/ветке, checkpoints служат дополнительным слоем защиты.
