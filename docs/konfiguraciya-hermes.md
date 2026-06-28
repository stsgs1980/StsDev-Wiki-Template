---
title: "Конфигурация Hermes Agent"
section: "Конфигурация"
sectionOrder: 30
order: 1
slug: "konfiguraciya-hermes"
---

# Конфигурация Hermes Agent

**Версия документа:** 1.0
**Дата:** 2026-06-28
**Источник:** https://hermes-agent.nousresearch.com/docs/user-guide/configuration

---

## 1. Структура директорий

```
%LOCALAPPDATA%\hermes\
├── config.yaml     # Основные настройки
├── .env            # API ключи и секреты
├── auth.json       # OAuth credentials (Nous Portal)
├── SOUL.md         # Личность агента
├── memories/       # Постоянная память
│   ├── MEMORY.md   # Заметки агента
│   └── USER.md     # Профиль пользователя
├── skills/         # Установленные скиллы
├── cron/           # Запланированные задачи
├── sessions/       # Сессии gateway
└── logs/           # Логи
```

---

## 2. Управление конфигурацией

### 2.1. Базовые команды

```powershell
hermes config              # Показать текущую конфигурацию
hermes config edit         # Открыть config.yaml в редакторе
hermes config set KEY VAL  # Установить значение
hermes config check        # Проверить缺失ные опции (после обновлений)
hermes config migrate      # Интерактивно добавить缺失ные опции
```

### 2.2. Примеры

```powershell
# Выбор модели
hermes config set model anthropic/claude-opus-4

# Выбор терминального backend
hermes config set terminal.backend docker

# Установка API ключа (автоматически в .env)
hermes config set OPENROUTER_API_KEY sk-or-...
```

### 2.3. Приоритет настроек

1. **CLI аргументы** — `hermes chat --model ...`
2. **config.yaml** — основной файл настроек
3. **.env** — для секретов (API ключи)
4. **Встроенные defaults**

---

## 3. Провайдеры и модели

### 3.1. Nous Portal (рекомендуется)

Один OAuth на все:
- 300+ моделей
- Tool Gateway (web search, image gen, TTS, browser)

```powershell
hermes setup --portal
```

### 3.2. Ручная настройка

```powershell
hermes model    # Интерактивный выбор провайдера и модели
```

### 3.3. Поддерживаемые провайдеры

| Провайдер | Ключ в .env |
|---|---|
| Nous Portal | OAuth (auth.json) |
| OpenRouter | `OPENROUTER_API_KEY` |
| Anthropic | `ANTHROPIC_API_KEY` |
| OpenAI | `OPENAI_API_KEY` |
| Google | `GOOGLE_API_KEY` |
| Copilot | `GITHUB_TOKEN` |
| Ollama (local) | Не требуется |
| LM Studio (local) | Не требуется |

### 3.4. Конфигурация провайдера

```yaml
# config.yaml
model: anthropic/claude-opus-4
context_length: 200000

providers:
  anthropic:
    request_timeout_seconds: 300
    models:
      claude-opus-4:
        timeout_seconds: 600
```

---

## 4. Инструменты

### 4.1. Управление через CLI

```powershell
hermes tools    # Интерактивное включение/выключение инструментов
```

### 4.2. Терминальные backend'ы

```yaml
# config.yaml
terminal:
  backend: local  # local | docker | ssh | modal | daytona | singularity
  cwd: "."
  timeout: 180
```

### 4.3. Docker backend

```yaml
terminal:
  backend: docker
  docker_image: "nikolaik/python-nodejs:python3.11-nodejs20"
  container_cpu: 1
  container_memory: 5120
  container_disk: 51200
  container_persistent: true
  docker_forward_env:
    - "GITHUB_TOKEN"
```

### 4.4. SSH backend

```yaml
terminal:
  backend: ssh
  persistent_shell: true
```

```bash
# .env
TERMINAL_SSH_HOST=my-server.example.com
TERMINAL_SSH_USER=ubuntu
TERMINAL_SSH_KEY=~/.ssh/id_rsa
```

### 4.5. Отключение toolsets глобально

```yaml
agent:
  disabled_toolsets:
    - memory
    - web
```

---

## 5. Память

```yaml
memory:
  memory_enabled: true
  user_profile_enabled: true
  memory_char_limit: 2200   # ~800 токенов
  user_char_limit: 1375     # ~500 токенов
  write_approval: false     # true = требовать подтверждение
```

---

## 6. Скиллы

```yaml
skills:
  write_approval: false     # true = требовать подтверждение
  guard_agent_created: false # true = сканировать на опасные паттерны
  config:
    myplugin:
      path: ~/myplugin-data
```

---

## 7. Сжатие контекста

```yaml
compression:
  enabled: true
  threshold: 0.50           # Сжимать при 50% контекста
  target_ratio: 0.20        # Оставлять 20% как recent tail
  protect_last_n: 20        # Минимум recent сообщений
  protect_first_n: 3        # Закреплённые head сообщения

auxiliary:
  compression:
    model: ""               # Пусто = основная модель
    provider: "auto"
```

---

## 8. Контекстные файлы

```yaml
context_file_max_chars: 20000  # Максимум символов из контекстных файлов
```

---

## 9. Чтение файлов

```yaml
file_read_max_chars: 100000  # Максимум для read_file
```

---

## 10. Tool output

```yaml
tool_output:
  max_bytes: 50000        # Лимит terminal output
  max_lines: 2000         # Лимит read_file
  max_line_length: 2000   # Лимит строки
```

---

## 11. Итерационный бюджет

```yaml
agent:
  max_turns: 90            # Максимум итераций за ход
  api_max_retries: 3       # Повторы перед fallback
```

---

## 12. Git worktree

```yaml
worktree: true    # Всегда создавать worktree
worktree_sync: true  # Ветвить от remote tip
```

---

## 13. Переменные окружения

### 13.1. Windows-specific

| Переменная | Эффект |
|---|---|
| `HERMES_GIT_BASH_PATH` | Путь к bash.exe |
| `HERMES_DISABLE_WINDOWS_UTF8` | `1` — отключить UTF-8 |
| `EDITOR` / `VISUAL` | Редактор для `/edit` |
| `HERMES_HOME` | Директория данных |

### 13.2. Terminal backend overrides

| Переменная | Маппинг |
|---|---|
| `TERMINAL_DOCKER_IMAGE` | `docker_image` |
| `TERMINAL_DOCKER_FORWARD_ENV` | `docker_forward_env` |
| `TERMINAL_DOCKER_VOLUMES` | `docker_volumes` |
| `TERMINAL_CONTAINER_CPU` | `container_cpu` |
| `TERMINAL_CONTAINER_MEMORY` | `container_memory` |
| `TERMINAL_SSH_HOST` | SSH host |
| `TERMINAL_SSH_USER` | SSH user |

---

## 14. Подстановка переменных в config.yaml

```yaml
auxiliary:
  vision:
    api_key: ${GOOGLE_API_KEY}
    base_url: ${CUSTOM_VISION_URL}
```

---

## 15. Автообновление

```yaml
updates:
  pre_update_backup: false
  backup_keep: 5
  non_interactive_local_changes: stash  # stash | discard
```

---

## 16. Полный пример config.yaml

```yaml
model: anthropic/claude-opus-4
context_length: 200000

terminal:
  backend: local
  cwd: "."
  timeout: 180

memory:
  memory_enabled: true
  user_profile_enabled: true
  memory_char_limit: 2200
  user_char_limit: 1375
  write_approval: false

skills:
  write_approval: false
  guard_agent_created: false

compression:
  enabled: true
  threshold: 0.50
  target_ratio: 0.20
  protect_last_n: 20

context_file_max_chars: 20000
file_read_max_chars: 100000

tool_output:
  max_bytes: 50000
  max_lines: 2000
  max_line_length: 2000

agent:
  max_turns: 90
  api_max_retries: 3
  disabled_toolsets: []

worktree: false

updates:
  pre_update_backup: false
  backup_keep: 5
```

---

## 17. Ссылки

- **Документация:** https://hermes-agent.nousresearch.com/docs
- **Configuration:** https://hermes-agent.nousresearch.com/docs/user-guide/configuration
- **Providers:** https://hermes-agent.nousresearch.com/docs/integrations/providers
- **Security:** https://hermes-agent.nousresearch.com/docs/user-guide/security
