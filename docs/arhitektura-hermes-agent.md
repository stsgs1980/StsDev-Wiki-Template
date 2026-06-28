---
title: "Архитектура Hermes Agent"
section: "Архитектура Hermes"
sectionOrder: 10
order: 1
slug: "arhitektura-hermes-agent"
---

# Архитектура Hermes Agent

**Версия документа:** 1.0
**Дата:** 2026-06-28
**Источник:** Исходный код + официальная документация

---

## 1. Обзор

Hermes Agent — это автономный AI-агент с закрытым циклом обучения, созданный Nous Research. Агент создаёт скиллы из опыта, улучшает их во время использования и поддерживает глубокую модель пользователя через сессии.

**Ключевые свойства:**
- Язык: Python 3.11+
- Хранилище: SQLite + FTS5
- Архитектура: Монолит с плагинами
- Лицензия: MIT

---

## 2. Стек технологий

| Компонент | Технология | Источник в коде |
|---|---|---|
| Язык | Python 3.11-3.13 | `pyproject.toml`: `requires-python = ">=3.11,<3.14"` |
| Пакетный менеджер | uv | `hermes_cli/dep_ensure.py` |
| HTTP-клиент | httpx, requests | `pyproject.toml` dependencies |
| Валидация | pydantic 2.13.4 | `pyproject.toml` |
| CLI | fire, prompt_toolkit | `pyproject.toml` |
| Линтер | ruff | `pyproject.toml`: `[tool.ruff]` |
| Тесты | pytest | `pyproject.toml`: `[tool.pytest]` |
| Cron | croniter | `pyproject.toml` |
| CLI-интерфейс | rich | `pyproject.toml` |

---

## 3. Структура репозитория

```
hermes-agent/
├── run_agent.py              # AIAgent — основной цикл агента
├── cli.py                    # CLI интерфейс (hermes chat)
├── model_tools.py            # Обнаружение и диспетчеризация инструментов
├── toolsets.py               # Группировка инструментов
├── hermes_state.py           # SQLite хранилище сессий (FTS5)
├── hermes_constants.py       # Константы, HERMES_HOME
├── batch_runner.py           # Пакетная генерация траекторий
│
├── agent/                    # Внутренности агента
│   ├── prompt_builder.py     # Сборка системного промпта
│   ├── context_engine.py     # ABC для контекстных движков
│   ├── context_compressor.py # Сжатие контекста
│   ├── prompt_caching.py     # Кэширование промптов (Anthropic)
│   ├── auxiliary_client.py   # Вспомогательный LLM
│   ├── memory_manager.py     # Оркестрация провайдеров памяти
│   ├── memory_provider.py    # ABC для провайдеров памяти
│   ├── skill_commands.py     # Slash-команды скиллов
│   └── trajectory.py         # Сохранение траекторий
│
├── hermes_cli/               # CLI подкоманды
│   ├── main.py               # Точка входа所有 hermes подкоманд
│   ├── config.py             # Конфигурация по умолчанию
│   ├── auth.py               # Реестр провайдеров,credentials
│   ├── runtime_provider.py   # Разрешение провайдера → api_mode + credentials
│   ├── setup.py              # Мастер первичной настройки
│   ├── plugins.py            # PluginManager — обнаружение, загрузка
│   └── gateway.py            # hermes gateway start/stop
│
├── tools/                    # Реализации инструментов
│   ├── registry.py           # Центральный реестр инструментов
│   ├── approval.py           # Обнаружение опасных команд
│   ├── terminal_tool.py      # Оркестрация терминала
│   ├── file_tools.py         # read_file, write_file, patch
│   ├── web_tools.py          # web_search, web_extract
│   ├── browser_tool.py       # Browser automation (10 инструментов)
│   ├── code_execution_tool.py # execute_code sandbox
│   ├── delegate_tool.py      # Делегирование подагентам
│   ├── mcp_tool.py           # MCP клиент
│   └── environments/         # Терминальные бэкенды
│       ├── local.py
│       ├── docker.py
│       ├── ssh.py
│       ├── modal.py
│       ├── daytona.py
│       └── singularity.py
│
├── gateway/                  # Шлюз сообщений
│   ├── run.py                # GatewayRunner — диспетчеризация сообщений
│   ├── session.py            # SessionStore — персистентность сессий
│   ├── delivery.py           # Исходящая доставка сообщений
│   ├── pairing.py            # Авторизация DM
│   ├── hooks.py              # Жизненный цикл хуков
│   └── platforms/            # 20+ адаптеров
│       ├── telegram.py
│       ├── discord.py
│       ├── slack.py
│       ├── whatsapp.py
│       ├── signal.py
│       ├── matrix.py
│       └── ... (20+ файлов)
│
├── acp_adapter/              # ACP сервер (VS Code / Zed / JetBrains)
├── cron/                     # Планировщик задач
├── plugins/                  # Плагины
│   ├── memory/               # Провайдеры памяти
│   └── context_engine/       # Движки контекста
├── skills/                   # Встроенные скиллы
├── optional-skills/          # Опциональные скиллы
└── tests/                    # Тестовый suite (~25,000 тестов)
```

---

## 4. Основные подсистемы

### 4.1. Agent Loop (`run_agent.py`)

Синхронный движок оркестрации. Обрабатывает:
- Выбор провайдера
- Сборку промпта
- Выполнение инструментов
- Повторы, fallback, callbacks
- Сжатие контекста
- Персистентность

```python
# Упрощённый цикл
class AIAgent:
    def run_conversation(self, user_message):
        # 1. Построение промпта
        system_prompt = self.prompt_builder.build_system_prompt()
        
        # 2. Выбор провайдера
        provider = self.runtime_provider.resolve()
        
        # 3. Вызов API
        response = provider.chat_completions(messages)
        
        # 4. Обработка tool calls
        if response.tool_calls:
            for call in response.tool_calls:
                result = self.handle_function_call(call.name, call.args)
                # ... loop back to API
        
        # 5. Сохранение в сессию
        self.session_db.append_message(response)
```

### 4.2. Tool System (`tools/registry.py`)

Центральный реестр с автообнаружением инструментов.

**Регистрация:**
```python
# Каждый файл tools/*.py вызывает при импорте
registry.register(
    name="terminal",
    toolset="terminal",
    schema={...},           # OpenAI function-calling schema
    handler=handle_terminal,
    check_fn=check_terminal, # Проверка доступности
    is_async=False,
    description="Run commands",
    emoji="💻",
)
```

**Автообнаружение:**
```python
# tools/registry.py
def discover_builtin_tools():
    # AST-парсинг для поиска registry.register() вызовов
    for path in tools_path.glob("*.py"):
        if _module_registers_tools(path):
            importlib.import_module(f"tools.{path.stem}")
```

**Диспетчеризация:**
```python
registry.dispatch(name, args, **kwargs)
# → Ищет ToolEntry по имени
# → Вызывает handler
# → Ловит исключения, возвращает JSON
```

**Ключевые особенности:**
- `check_fn` — проверка доступности (API ключ, бинарник, сервис)
- TTL-кэширование результатов check_fn (30 секунд)
- `dynamic_schema_overrides` — динамические схемы
- `max_result_size_chars` — ограничение размера ответа

### 4.3. Session Storage (`hermes_state.py`)

SQLite-based хранилище с FTS5 полнотекстовым поиском.

**Схема:**
```sql
-- Основные таблицы
CREATE TABLE sessions (
    id TEXT PRIMARY KEY,
    source TEXT NOT NULL,          -- cli, telegram, discord...
    model TEXT,
    parent_session_id TEXT,       -- lineage через сжатие
    started_at REAL NOT NULL,
    message_count INTEGER DEFAULT 0,
    input_tokens INTEGER DEFAULT 0,
    output_tokens INTEGER DEFAULT 0,
    estimated_cost_usd REAL,
    title TEXT
);

CREATE TABLE messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    role TEXT NOT NULL,            -- user, assistant, system, tool
    content TEXT,
    tool_calls TEXT,              -- JSON
    tool_name TEXT,
    timestamp REAL NOT NULL,
    token_count INTEGER
);

-- FTS5 для полнотекстового поиска
CREATE VIRTUAL TABLE messages_fts USING fts5(content);
CREATE VIRTUAL TABLE messages_fts_trigram USING fts5(content, tokenize='trigram');
```

**Особенности:**
- WAL mode для конкурентных чтений + одна запись
- Session lineage через `parent_session_id` (после сжатия)
- FTS5 + триграмный поиск (CJK/substring)
- Write contention: 1 сек таймаут + retry с jitter

### 4.4. Prompt System

**Сборка промпта (`agent/prompt_builder.py`):**
```
System Prompt = stable → context → volatile

stable:   Идентификация, инструменты, скиллы
context:  Контекстные файлы (SOUL.md, AGENTS.md)
volatile: Память, профиль, таймстемпы
```

**Сжатие контекста (`agent/context_compressor.py`):**
- Суммаризует средние turns при превышении порога
- Паттерн "frozen snapshot" — системный промпт не меняется mid-session
- Кэширование промптов (Anthropic)

### 4.5. Skills System

**Формат скилла (`SKILL.md`):**
```markdown
---
name: my-skill
description: Brief description
version: 1.0.0
platforms: [macos, linux]
metadata:
  hermes:
    tags: [python, automation]
    category: devops
---

# Skill Title

## When to Use
Trigger conditions.

## Procedure
1. Step one
2. Step two

## Pitfalls
- Known failure modes

## Verification
How to confirm it worked.
```

**Progressive disclosure:**
```
Level 0: skills_list()           → [{name, description}, ...]   (~3k tokens)
Level 1: skill_view(name)        → Full content + metadata
Level 2: skill_view(name, path)  → Specific reference file
```

**Хранение:**
```
~/.hermes/skills/
├── mlops/
│   └── axolotl/
│       ├── SKILL.md
│       ├── references/
│       ├── templates/
│       └── scripts/
├── devops/
│   └── deploy-k8s/
│       └── SKILL.md
└── .hub/
    └── lock.json
```

### 4.6. Memory System

**Два хранилища:**

| Файл | Назначение | Лимит |
|---|---|---|
| `MEMORY.md` | Заметки агента (окружение, конвенции, уроки) | 2,200 символов (~800 токенов) |
| `USER.md` | Профиль пользователя (предпочтения, стиль) | 1,375 символов (~500 токенов) |

**Паттерн "frozen snapshot":**
- Память загружается в системный промпт при старте сессии
- Изменения сохраняются на диск, но не появляются до следующей сессии
- Tool responses показывают live-состояние

**Внешние провайдеры (8 плагинов):**
- Honcho — диалектическое моделирование пользователя
- OpenViking, Mem0, Hindsight, Holographic, RetainDB, ByteRover, Supermemory

**Управление:**
```python
memory(action="add", target="memory", content="User prefers dark mode")
memory(action="replace", target="memory", old_text="dark mode", content="light mode")
memory(action="remove", target="memory", old_text="dark mode")
```

### 4.7. Gateway (20+ платформ)

**Архитектура:**
```
Platform event → Adapter.on_message() → MessageEvent
    → GatewayRunner._handle_message()
        → authorize user
        → resolve session key
        → create AIAgent with session history
        → AIAgent.run_conversation()
        → deliver response back through adapter
```

**Поддерживаемые платформы:**
- Telegram, Discord, Slack, WhatsApp, Signal, Matrix
- Mattermost, Email, SMS, DingTalk, Feishu, WeCom
- Weixin, QQ Bot, Yuanbao, BlueBubbles
- Home Assistant, Microsoft Teams, Google Chat
- Webhook, API Server

**Особенности:**
- Unified session routing
- User authorization (allowlists + DM pairing)
- Slash command dispatch
- Hook system (lifecycle events)
- Cron ticking
- Background maintenance

### 4.8. Plugin System

**Три источника обнаружения:**
1. `~/.hermes/plugins/` (пользовательские)
2. `.hermes/plugins/` (проектные)
3. pip entry points

**Типы плагинов:**
- Tools — регистрация новых инструментов
- Hooks — lifecycle events
- CLI commands — новые подкоманды
- Memory providers — внешние хранилища памяти
- Context engines — движки контекста

---

## 5. Потоки данных

### 5.1. CLI сессия

```
User input → HermesCLI.process_input()
    → AIAgent.run_conversation()
        → prompt_builder.build_system_prompt()
        → runtime_provider.resolve_runtime_provider()
        → API call (chat_completions / codex_responses / anthropic_messages)
        → tool_calls? → model_tools.handle_function_call() → loop
        → final response → display → save to SessionDB
```

### 5.2. Gateway сообщение

```
Platform event → Adapter.on_message() → MessageEvent
    → GatewayRunner._handle_message()
        → authorize user
        → resolve session key
        → create AIAgent with session history
        → AIAgent.run_conversation()
        → deliver response back through adapter
```

### 5.3. Cron задача

```
Scheduler tick → load due jobs from jobs.json
    → create fresh AIAgent (no history)
    → inject attached skills as context
    → run job prompt
    → deliver response to target platform
    → update job state and next_run
```

---

## 6. Деплой и backend'ы

### 6.1. Терминальные backend'ы

| Backend | Описание | Использование |
|---|---|---|
| `local` | Локальный терминал | Разработка, доверенные задачи |
| `docker` | Изолированный контейнер | Безопасность, воспроизводимость |
| `ssh` | Удалённый сервер | Сэндбоксинг |
| `singularity` | HPC контейнеры | Кластерные вычисления |
| `modal` | Cloud execution | Serverless, масштабирование |
| `daytona` | Cloud sandbox | Persistent remote dev |

### 6.2. Docker backend

```python
# Один持久ный контейнер на всю сессию
terminal: backend: docker
docker_image: python:3.11-slim
container_persistent: true  # /workspace и /root сохраняются
```

### 6.3. Конфигурация backend'ов

```yaml
# ~/.hermes/config.yaml
terminal:
  backend: local  # or: docker, ssh, singularity, modal, daytona
  cwd: "."
  timeout: 180
  container_cpu: 1
  container_memory: 5120
  container_disk: 51200
```

---

## 7. Безопасность

### 7.1. Command approval

```python
# tools/approval.py
DANGEROUS_PATTERNS = [
    (r'rm\s+-rf', "Recursive delete"),
    (r'mkfs\.', "Filesystem formatting"),
    (r'DROP\s+TABLE', "SQL destructive operation"),
    # ... 50+ паттернов
]
```

### 7.2. Sandboxing

- Docker backend: non-root, readOnlyRootFilesystem, CAP_DROP ALL
- Container security: PID limits (256), namespace isolation
- Persistent workspace via volumes

### 7.3. Supply Chain

- Exact-pinned dependencies (`==X.Y.Z`)
- Lazy-install для optional deps (не в base install)
- Supply chain attack protection (Mini Shai-Hulud response)

---

## 8. Наблюдаемость

### 8.1. Логирование

- JSON Lines (stdout)
- Обязательные поля: timestamp, level, logger, service, version
- PII política: запрет логирования токенов, ПДн

### 8.2. Метрики

- RED Method: Rate, Errors, Duration
- Prometheus Exposition Format (`/metrics` endpoint)
- Инфраструктурные: goroutines, memory, CPU

### 8.3. Трассировка

- W3C Trace Context (`traceparent`, `tracestate`)
- OTLP → Jaeger / Tempo / Zipkin
- Автоинструментация + ручные спаны

---

## 9. Отличия от предыдущей версии документа

| Аспект | Было (неправильно) | Стало (правильно) |
|---|---|---|
| Язык | TypeScript | Python 3.11+ |
| Хранилище | PostgreSQL + Redis | SQLite + FTS5 |
| Архитектура | Микросервисы | Монолит с плагинами |
| Шина | NATS / Kafka | Отсутствует |
| Инструменты | Worker-модули | 70+ self-registering tools |
| Скиллы | Не описаны | SKILL.md, progressive disclosure |
| Память | Не описана | MEMORY.md + USER.md + Honcho |
| Gateway | Абстрактный Ingress | 20+ платформенных адаптеров |
| Деплой | Kubernetes Blue-Green | Local / Docker / SSH / Modal / Daytona |
| Плагины | WASM sandboxing | Python entry points |
| No-Unicode | Кастомный ESLint | Не является частью Hermes |

---

## 10. Ссылки

- **Документация:** https://hermes-agent.nousresearch.com/docs
- **Исходный код:** https://github.com/NousResearch/hermes-agent
- **Skills Hub:** https://agentskills.io
- **Discord:** https://discord.gg/NousResearch
