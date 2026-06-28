---
title: "Skills система"
section: "Skills"
sectionOrder: 110
order: 1
slug: "skills-sistema"
---

# DOC-011: Skills-система Hermes Agent

## Обзор

Skills — это документы с выборочной загрузкой знаний, которые агент подключает по мере необходимости. Skills используют паттерн **постепенного раскрытия** (progressive disclosure) для минимизации потребления токенов и совместимы со спецификацией [agentskills.io](https://agentskills.io/specification).

Все skills хранятся в **`~/.hermes/skills/`** — основной директории и источнике истины. При установке bundled skills копируются из репозитория. Skills, установленные через Hub и созданные агентом, также попадают сюда. Агент может изменять или удалять любой skill.

---

## Прогрессивное раскрытие (Progressive Disclosure)

Skills используют трёхуровневую загрузку:

```
Level 0: skills_list()           -> [{name, description, category}, ...]   (~3k токенов)
Level 1: skill_view(name)        -> Полный контент + метаданные            (размер варьируется)
Level 2: skill_view(name, path)  -> Конкретный справочный файл             (размер варьируется)
```

Агент загружает полное содержимое skill только когда оно действительно необходимо.

---

## Формат SKILL.md

Каждый skill — это директория с файлом `SKILL.md`, содержащим YAML-фронтматер:

```yaml
---
name: my-skill
description: Краткое описание того, что делает skill (до 60 символов)
version: 1.0.0
platforms: [macos, linux]
metadata:
  hermes:
    tags: [python, automation]
    category: devops
    fallback_for_toolsets: [web]
    requires_toolsets: [terminal]
    config:
      - key: my.setting
        description: "Что регулирует эта настройка"
        default: "value"
        prompt: "Запрос при настройке"
---
# Название Skill

## Когда использовать
Условия активации.

## Процедура
1. Шаг первый
2. Шаг второй

## Подводные камни
- Известные сбои и решения

## Проверка
Как убедиться, что всё работает.
```

---

## Структура директорий

```
~/.hermes/skills/                    # Единый источник истины
|-- mlops/                           # Директория категории
|   |-- axolotl/
|   |   |-- SKILL.md                 # Основные инструкции (обязательно)
|   |   |-- references/             # Дополнительные документы
|   |   |-- templates/              # Форматы вывода
|   |   |-- scripts/                # Вспомогательные скрипты
|   |   +-- assets/                 # Дополнительные файлы
|   +-- vllm/
|       +-- SKILL.md
|-- devops/
|   +-- deploy-k8s/
|       +-- SKILL.md
|-- .hub/                            # Состояние Skills Hub
|   |-- lock.json
|   |-- quarantine/
|   +-- audit.log
+-- .bundled_manifest                # Манифест bundled skills
```

---

## Использование Skills

### Slash-команды

Каждый установленный skill доступен как slash-команда:

```
/gif-search funny cats
/axolotl help me fine-tune Llama 3 on my dataset
/github-pr-workflow create a PR for the auth refactor
/plan design a rollout for migrating our auth provider
```

### Естественный язык

```
hermes chat --toolsets skills -q "What skills do you have?"
hermes chat --toolsets skills -q "Show me the axolotl skill"
```

### Команда /learn

Превращает существующие знания в reusable skill без ручного написания SKILL.md:

```
# Локальная директория с документацией
/learn the REST client in ~/projects/acme-sdk, focus on auth + pagination

# Онлайн-страница
/learn https://docs.example.com/api/quickstart

# Рабочий процесс из текущего разговора
/learn how I just deployed the staging server

# Описание процедуры
/learn filing an expense: open the portal, New > Expense, attach the receipt, submit
```

---

## Специфичные для платформы Skills

Поле `platforms` ограничивает skill определёнными ОС:

| Значение   | Совпадение        |
|------------|-------------------|
| `macos`    | macOS (Darwin)    |
| `linux`    | Linux             |
| `windows`  | Windows           |

```yaml
platforms: [macos]            # Только macOS
platforms: [macos, linux]     # macOS и Linux
```

При установленном поле skill автоматически скрывается на несовместимых платформах.

---

## Условная активация (Fallback Skills)

Skills могут автоматически скрываться/показываться в зависимости от доступных инструментов:

```yaml
metadata:
  hermes:
    fallback_for_toolsets: [web]       # Скрыть, когда эти toolsets ДОСТУПНЫ
    requires_toolsets: [terminal]      # Показать, когда эти toolsets ДОСТУПНЫ
    fallback_for_tools: [web_search]   # Скрыть, когда эти инструменты ДОСТУПНЫ
    requires_tools: [terminal]         # Показать, когда эти инструменты ДОСТУПНЫ
```

| Поле                        | Поведение                                                              |
|-----------------------------|------------------------------------------------------------------------|
| `fallback_for_toolsets`     | Skill скрыт, когда перечисленные toolsets доступны                      |
| `fallback_for_tools`        | То же, но проверяет отдельные инструменты                              |
| `requires_toolsets`         | Skill скрыт, когда перечисленные toolsets недоступны                    |
| `requires_tools`            | То же, но проверяет отдельные инструменты                              |

**Пример:** Bundled skill `duckduckgo-search` использует `fallback_for_toolsets: [web]`. Когда переменная `FIRECRAWL_API_KEY` установлена, web toolset доступен и агент использует `web_search` — skill DuckDuckGo остаётся скрытым. Если ключ отсутствует, web toolset недоступен и skill автоматически появляется как fallback.

---

## Безопасная настройка при загрузке

Skills могут объявлять обязательные переменные окружения:

```yaml
required_environment_variables:
  - name: TENOR_API_KEY
    prompt: Tenor API key
    help: Получить ключ на https://developers.google.com/tenor
    required_for: полная функциональность
```

При отсутствии значения Hermes запрашивает его только при загрузке skill в локальном CLI. Мессенджеры никогда не запрашивают секреты в чате — они рекомендуют использовать `hermes setup` или `~/.hermes/.env`.

Объявленные env-переменные автоматически передаются в песочницы `execute_code` и `terminal`.

---

## Настройки конфигурации Skills

Skills могут объявлять несекретные настройки в `config.yaml`:

```yaml
metadata:
  hermes:
    config:
      - key: myplugin.path
        description: Путь к директории данных плагина
        default: "~/myplugin-data"
        prompt: Путь к директории данных
```

Настройки хранятся в `skills.config` конфигурационного файла. Команда `hermes config migrate` запрашивает ненастроенные параметры, `hermes config show` отображает их.

---

## Внешние директории Skills

Если skills хранятся за пределами Hermes (например, общий каталог `~/.agents/skills/`), Hermes может сканировать их тоже:

```yaml
# ~/.hermes/config.yaml
skills:
  external_dirs:
    - ~/.agents/skills
    - /home/shared/team-skills
    - ${SKILLS_REPO}/skills
```

Правила:
- Новые skills создаются в `~/.hermes/skills/`
- Существующие skills изменяются в месте обнаружения, включая внешние директории
- **Локальный приоритет**: при совпадении имён локальная версия побеждает
- Внешние skills полностью интегрированы (system prompt, skills_list, slash-команды)
- Несуществующие директории пропускаются без ошибок

---

## Skill Bundles

Bundles — это YAML-файлы, группирующие несколько skills под одной slash-командой.

### YAML-схема

Файл `~/.hermes/skill-bundles/<slug>.yaml`:

```yaml
name: backend-dev
description: Backend feature work — review, test, PR workflow
skills:
  - github-code-review
  - test-driven-development
  - github-pr-workflow
instruction: |
  Всегда начинай с написания падающих тестов, затем реализуй.
  Открывай PR через стандартный workflow с co-author тегами.
```

### Управление

```bash
# Создание bundle
hermes bundles create backend-dev \
  --skill github-code-review \
  --skill test-driven-development \
  --skill github-pr-workflow \
  -d "Backend feature work"

# Использование в CLI
/backend-dev refactor the auth middleware

# Другие команды
hermes bundles list              # Список всех bundles
hermes bundles show backend-dev  # Просмотр bundle
hermes bundles delete backend-dev
hermes bundles reload            # Пересканировать директорию
```

### Поведение

- Bundles имеют приоритет над отдельными skills при совпадении slug
- Отсутствующие skills пропускаются, не вызывают ошибку
- Работают на всех платформах (CLI, TUI, dashboard, мессенджеры)
- Не инвалидируют кеш промпта

---

## Управляемые Агентом Skills (skill_manage)

Агент создаёт, обновляет и удаляет свои skills через инструмент `skill_manage` — это процедурная память агента.

### Когда агент создаёт skills

- После успешного выполнения сложной задачи (5+ вызовов инструментов)
- Когда нашёл рабочий путь после ошибок
- Когда пользователь скорректировал подход
- Когда обнаружил нетривиальный рабочий процесс

### Действия

| Действие     | Назначение                          | Ключевые параметры                        |
|--------------|--------------------------------------|-------------------------------------------|
| `create`     | Новый skill с нуля                   | `name`, `content`, необязательно `category` |
| `patch`      | Точечные правки (предпочтительно)   | `name`, `old_string`, `new_string`        |
| `edit`       | Структурная перезапись               | `name`, `content` (полная замена)         |
| `delete`     | Удаление skill                       | `name`                                    |
| `write_file` | Добавление/обновление файлов         | `name`, `file_path`, `file_content`       |
| `remove_file`| Удаление файла                       | `name`, `file_path`                       |

Действие `patch` предпочтительнее `edit` — оно потребляет меньше токенов, так как в вызове инструмента появляется только изменённый текст.

---

## Контроль записи: skills.write_approval

По умолчанию агент записывает skills свободно. Если нужен контроль:

```yaml
skills:
  write_approval: false    # false = свободная запись (по умолчанию) | true = требуется одобрение
```

При `write_approval: true` каждая запись через `skill_manage` **стагируется** вместо фиксации:

```
/skills pending             # Список стагированных записей
/skills diff <id>           # Unified diff
/skills approve <id>        # Применить (или 'all')
/skills reject <id>         # Отклонить (или 'all')
/skills approval on         # Включить/выключить контроль
```

Staged-записи сохраняются после перезапуска в `~/.hermes/pending/skills/`.

---

## Skills Hub

Просмотр, поиск, установка и управление skills из онлайн-реестров.

### Основные команды

```bash
hermes skills browse                              # Просмотр всех hub skills
hermes skills browse --source official            # Только официальные
hermes skills search kubernetes                   # Поиск по всем источникам
hermes skills search react --source skills-sh     # Поиск в skills.sh
hermes skills inspect openai/skills/k8s           # Просмотр перед установкой
hermes skills install openai/skills/k8s           # Установка с проверкой безопасности
hermes skills install official/security/1password
hermes skills install https://sharethis.chat/SKILL.md              # Прямой URL
hermes skills list --source hub                   # Список hub-installed skills
hermes skills check                               # Проверка обновлений
hermes skills update                              # Установка обновлений
hermes skills audit                               # Повторное сканирование безопасности
hermes skills uninstall k8s                       # Удаление
hermes skills publish skills/my-skill --to github --repo owner/repo
```

### Источники (Hub Sources)

| Источник              | Пример                                                        | Описание                                    |
|-----------------------|---------------------------------------------------------------|---------------------------------------------|
| `official`            | `official/security/1password`                                 | Официальные optional skills Hermes          |
| `skills-sh`           | `skills-sh/vercel-labs/agent-skills/vercel-react-best-practices` | Публичный каталог Vercel                    |
| `well-known`          | `well-known:https://mintlify.com/docs/.well-known/skills/mintlify` | URL-based discovery через `/.well-known/skills/index.json` |
| `url`                 | `https://sharethis.chat/SKILL.md`                             | Прямой URL на одиночный SKILL.md           |
| `github`              | `openai/skills/k8s`                                           | Установка из GitHub-репозитория             |
| `clawhub`             | Идентификатор ClawHub                                         | Сообщество / маркетплейс                    |
| `lobehub`             | Идентификатор LobeHub                                         | Конвертация агентов из каталога LobeHub     |
| `browse-sh`           | `browse-sh/airbnb.com/search-listings-ddgioa`                | Каталог browser-automation skills           |

### Уровни доверия

| Уровень       | Источник                                          | Политика                                            |
|---------------|---------------------------------------------------|-----------------------------------------------------|
| `builtin`     | В комплекте с Hermes                              | Всегда доверенный                                   |
| `official`    | `optional-skills/` в репозитории                  | Встроенный уровень доверия                           |
| `trusted`     | Проверенные реестры (openai, anthropics, NVIDIA)  | Более свободная политика                            |
| `community`   | Все остальное                                      | Ненужные находки можно переопределить через `--force` |

### Проверка безопасности и --force

Все hub-installed skills проходят проверку на data exfiltration, prompt injection, destructive commands и другие угрозы.

```bash
hermes skills install skills-sh/anthropics/skills/pdf --force
```

`--force` переопределяет policy blocks для caution/warn находок, но **не** переопределяет `dangerous` verdict.

---

## Жизненный цикл обновлений

```bash
hermes skills check          # Проверить, какие hub skills обновились
hermes skills update         # Переустановить skills с доступными обновлениями
hermes skills update react   # Обновить конкретный skill
```

Официальные bundled skills при `hermes update` копируются в `~/.hermes/skills/`. Если локальная версия не изменена, она обновляется. Если изменена — пропускается (защита от перезаписи).

---

## Пользовательские Tap-источники

Публикуйте наборы skills как GitHub-репозиторий:

```bash
# Добавление tap
hermes skills tap add my-org/hermes-skills

# Установка конкретного skill из tap
hermes skills install my-org/hermes-skills/deploy-runbook

# Управление
hermes skills tap list
hermes skills tap remove my-org/hermes-skills
```

Структура репозитория tap:

```
owner/repo/
+-- skills/
    +-- my-workflow/
        +-- SKILL.md
```

### Сброс bundled skills: hermes skills reset

```bash
# Сбросить запись в манифесте (локальная копия сохраняется)
hermes skills reset google-workspace

# Полная переустановка bundled версии
hermes skills reset google-workspace --restore

# Без подтверждения
hermes skills reset google-workspace --restore --yes
```

В чате:

```
/skills reset google-workspace
/skills reset google-workspace --restore
```

---

## Установка с чистого листа

```bash
# При установке (профиль по умолчанию)
curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash -s -- --no-skills

# При создании именованного профиля
hermes profile create research --no-skills

# На существующем профиле
hermes skills opt-out            # Остановить будущую сидингу
hermes skills opt-out --remove   # Также удалить неизменённые bundled skills
hermes skills opt-in --sync      # Отменить: удалить маркер и пересидировать
```

---

## Практические примеры

### Создание skill с нуля

```yaml
---
name: deploy-k8s
description: Развертывание сервисов в Kubernetes
version: 1.0.0
platforms: [linux, macos]
metadata:
  hermes:
    tags: [kubernetes, deployment, devops]
    category: devops
    requires_toolsets: [terminal]
---
# Deploy Kubernetes

## Когда использовать
Когда необходимо развернуть или обновить сервис в Kubernetes-кластере.

## Процедура
1. Проверить текущее состояние: `kubectl get pods -n <namespace>`
2. Применить манифесты: `kubectl apply -f k8s/`
3. Дождаться готовности: `kubectl rollout status deployment/<name>`
4. Проверить логи на ошибки

## Подводные камни
- Убедиться, что контекст kubectl указывает на нужный кластер
- Для production использовать canary или blue-green деплой
```

### Запуск bundle

```bash
hermes bundles create incident-response \
  --skill oncall-runbook \
  --skill log-analysis \
  --skill slack-notify \
  -d "Инцидент-реакция: диагностика, логи, уведомления"
```

```
/incident-response проблема с latency на API в production
```

### Установка из разных источников

```bash
# Официальный skill
hermes skills install official/security/1password

# Из skills.sh
hermes skills search react --source skills-sh
hermes skills install skills-sh/vercel-labs/json-render/json-render-react

# Из GitHub
hermes skills install openai/skills/k8s

# Прямой URL
hermes skills install https://example.com/my-skill/SKILL.md --name my-skill

# Из пользовательского tap
hermes skills tap add myorg/skills-repo
hermes skills install myorg/skills-repo/my-workflow
```
