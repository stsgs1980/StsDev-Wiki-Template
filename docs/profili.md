---
title: "Профили — запуск нескольких агентов"
section: "Профили"
sectionOrder: 80
order: 1
slug: "profili"
---

# DOC-008: Профили — запуск нескольких агентов

## Источник
- https://hermes-agent.nousresearch.com/docs/user-guide/profiles

---

## 1. Что такое профиль

Профиль — это **отдельный домашний каталог Hermes** со своей конфигурацией, ключами API, памятью, сессиями, скиллами и состоянием шлюза.

**Каждый профиль получает:**
- Свой `config.yaml`
- Свой `.env` (API-ключи, токены ботов)
- Свой `SOUL.md` (личность)
- Свою память (memories)
- Свои сессии
- Свои скиллы
- Свои задачи cron
- Свою БД состояния (`state.db`)

**Команда:** При создании профиля `coder` автоматически появляется команда:
```
coder chat
coder setup
coder gateway start
coder doctor
coder skills list
```

---

## 2. Быстрый старт

```powershell
hermes profile create coder       # создаёт профиль и алиас команды
coder setup                       # настройка API-ключей и модели
coder chat                        # начало диалога
```

---

## 3. Создание профиля

### Пустой профиль:
```powershell
hermes profile create mybot
```

### С описанием (для kanban-оркестратора):
```powershell
hermes profile create researcher --description "Reads source code and external docs, writes findings."
```

### Клонирование только конфигурации (`--clone`):
```powershell
hermes profile create work --clone
```
Копирует: `config.yaml`, `.env`, `SOUL.md`, скиллы. Новые сессии и память — чистые.

### Клонирование всего (`--clone-all`):
```powershell
hermes profile create backup --clone-all
```
Копирует **всё**: конфигурацию, ключи, личность, всю память, скиллы, задачи cron, плагины.

### Клонирование из конкретного профиля:
```powershell
hermes profile create work --clone-from coder
hermes profile create work-backup --clone-from coder --clone-all
```

---

## 4. Использование профилей

### Алиасы команд:
```powershell
coder chat                    # чат с(coder)
coder setup                   # настройка (coder)'s settings
coder gateway start           # запуск шлюза (coder)
coder doctor                  # проверка здоровья (coder)
```

### Флаг `-p`:
```powershell
hermes -p coder chat
hermes --profile=coder doctor
hermes chat -p coder -q "hello"
```

### Привязка по умолчанию (`hermes profile use`):
```powershell
hermes profile use coder
hermes chat                   # теперь работает с (coder)
hermes profile use default    # переключение обратно
```

### Индикация текущего профиля:
- **Промпт:** `coder >` вместо `>`
- **Баннер:** показывает `Profile: coder` при запуске
- **`hermes profile`:** показывает имя, путь, модель, статус шлюза

---

## 5. Профили vs рабочие пространства vs песочница

| Понятие | Что делает | Управление |
|---------|------------|------------|
| **Профиль** | Своя директория состояния Hermes | `HERMES_HOME` |
| **Рабочая директория** | Откуда запускаются терминальные команды | `terminal.cwd` |
| **Песочница** | Ограничение доступа к файловой системе | **Не входит в профиль** |

**Важно:** Профиль **НЕ** песочница. Агент по-прежнему имеет доступ к файловой системе как ваш пользователь ОС.

### Задание начальной директории:
```yaml
terminal:
  backend: local
  cwd: C:\Projects\my-project
```

**Примечание:** `cwd: "."` на локальном бэкенде означает "директория запуска Hermes", а не "директория профиля".

---

## 6. Запуск шлюзов

Каждый профиль запускает **собственный шлюз** как отдельный процесс с собственным токеном:

```powershell
coder gateway start            # запуск шлюза (coder)
assistant gateway start        # запуск шлюза (assistant) (отдельный процесс)
```

### Разные токены ботов:
```powershell
# Настройка токенов (coder)
notepad %LOCALAPPDATA%\hermes\profiles\coder\.env

# Настройка токенов (assistant)
notepad %LOCALAPPDATA%\hermes\profiles\assistant\.env
```

### Защита от конфликта токенов:
Если два профиля используют один токен, второй шлюз блокируется с ошибкой, указывающей конфликтующий профиль.

### Постоянные сервисы:
```powershell
coder gateway install          # создаёт сервис hermes-gateway-coder
assistant gateway install      # создаёт сервис hermes-gateway-assistant
```

---

## 7. Настройка профилей

```powershell
# Смена модели
coder config set model.default anthropic/claude-sonnet-4

# Смена личности
echo "You are a focused coding assistant." > %LOCALAPPDATA%\hermes\profiles\coder\SOUL.md

# Задание начальной директории
coder config set terminal.cwd C:\Projects\my-project
```

### Через веб-дашборд:
```powershell
coder dashboard                # открывает дашборд с выбранным профилем
```

---

## 8. Обновление

```powershell
hermes update
```
Код обновляется **один раз** (общий), скиллы синхронизируются **по всем профилям**.

---

## 9. Управление профилями

```powershell
hermes profile list            # список всех профилей
hermes profile show coder      # подробная информация
hermes profile rename coder dev-bot  # переименование (обновляет алиас + сервис)
hermes profile export coder    # экспорт в coder.tar.gz
hermes profile import coder.tar.gz   # импорт из архива
```

---

## 10. Удаление профиля

```powershell
hermes profile delete coder
```

**Что делает:**
- Останавливает шлюз
- Удаляет сервис systemd/launchd
- Удаляет алиас команды
- Удаляет все данные профиля

**Подтверждение:** потребуется ввести имя профиля.

**Пропуск подтверждения:**
```powershell
hermes profile delete coder --yes
```

**Ограничение:** Нельзя удалить профиль по умолчанию (`%LOCALAPPDATA%\hermes`). Для полного удаления используйте `hermes uninstall`.

---

## 11. Tab completion

```powershell
# PowerShell
hermes completion powershell | Invoke-Expression
```

Добавьте в `$PROFILE` для постоянного использования.

---

## 12. Как это работает

Профили используют переменную окружения `HERMES_HOME`. При запуске `coder chat` обёрочка устанавливает:
```
HERMES_HOME=%LOCALAPPDATA%\hermes\profiles\coder
```

119+ файлов в коде используют `get_hermes_home()` для определения путей — конфигурация, сессии, память, скиллы, БД состояния, PID шлюза, логи и cron автоматически привязываются к профилю.

**Важно:**
- `HERMES_HOME` — граница профиля (конфиг, .env, память, сессии, скиллы, логи, cron, шлюз)
- `HOME` — домашний каталог ОС (внешние CLI: git, ssh, gh, az, npm)

По умолчанию на хосте `HOME` **не изменяется** — внешние инструменты используют ваши текущие учётные данные.

Для строгой изоляции:
```yaml
terminal:
  home_mode: profile
```
В этом случае `HOME={HERMES_HOME}/home` — потребуется настроить `~/.ssh`, `~/.gitconfig` и т.д. внутри профиля.

---

## 13. Дистрибуции профилей

Профиль можно упаковать как **git-репозиторий** и установить одной командой:

```powershell
# Установка агента из git
hermes profile install github.com/you/research-bot --alias

# Обновление
hermes profile update research-bot
```

**Что входит в дистрибутив:**
- SOUL
- конфигурация
- скиллы
- cron задачи
- MCP подключения

**Что НЕ входит (остаётся на машине):**
- учётные данные
- память
- сессии

---

## 14. Пример структуры профилей

```
%LOCALAPPDATA%\hermes\
├── .env                        # основной профиль
├── config.yaml
├── SOUL.md
├── state.db
└── profiles\
    ├── coder\
    │   ├── .env
    │   ├── config.yaml
    │   ├── SOUL.md
    │   ├── state.db
    │   └── ...
    └── assistant\
        ├── .env
        ├── config.yaml
        ├── SOUL.md
        ├── state.db
        └── ...
```
