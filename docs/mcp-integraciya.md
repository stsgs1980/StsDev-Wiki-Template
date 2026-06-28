---
title: "MCP интеграция (Model Context Protocol)"
section: "MCP интеграция"
sectionOrder: 100
order: 1
slug: "mcp-integraciya"
---

# DOC-010: MCP интеграция (Model Context Protocol)

## Источник
- https://hermes-agent.nousresearch.com/docs/user-guide/features/mcp

---

## 1. Что такое MCP

MCP (Model Context Protocol) позволяет Hermes подключаться к внешним серверам инструментов — GitHub, базы данных, файловые системы, браузеры, внутренние API и т.д.

**Что даёт MCP:**
- Доступ к экосистемам внешних инструментов без написания нативного инструмента Hermes
- Локальные stdio серверы и удалённые HTTP MCP серверы в одном конфиге
- Автоматическое обнаружение и регистрация инструментов при запуске
- Утилиты для MCP ресурсов и промптов (если поддерживается сервером)
- Фильтрация по серверам — показывать только нужные инструменты

---

## 2. Быстрый старт

### 1. MCP уже установлен (входит в стандартную установку)

### 2. Добавление MCP сервера в `config.yaml`:

```yaml
mcp_servers:
  filesystem:
    command: "npx"
    args: ["-y", "@modelcontextprotocol/server-filesystem", "C:\\Users\\user\\projects"]
```

### 3. Запуск:

```powershell
hermes chat
```

### 4. Использование:

```
List the files in C:\Users\user\projects and summarize the repo structure.
```

---

## 3. Каталог: установка Nous-approved MCP

Hermes поставляется с каталогом проверенных MCP серверов:

```powershell
hermes mcp                # интерактивный выбор
hermes mcp catalog        # текстовый список
hermes mcp install n8n    # установка по имени
```

### Статусы в каталоге:
- `available` — доступен для установки
- `enabled` — установлен и включён
- `installed (disabled)` — установлен, но выключен

### Выбор инструментов при установке:

```
Select tools for 'linear' (SPACE toggle, ENTER confirm)
  [x] find_issues       Find issues matching a query
  [x] get_issue         Get a single issue
  [x] create_issue      Create a new issue
  [ ] delete_workspace  Delete a Linear workspace
```

### Обновление выбора инструментов:

```powershell
hermes mcp configure linear
```

---

## 4. Два типа MCP серверов

### Stdio серверы (локальные):

```yaml
mcp_servers:
  github:
    command: "npx"
    args: ["-y", "@modelcontextprotocol/server-github"]
    env:
      GITHUB_PERSONAL_ACCESS_TOKEN: "ghp_..."
```

**Когда использовать:**
- Сервер установлен локально
- Нужен низкозадержечный доступ к локальным ресурсам
- Документация показывает `command`, `args`, `env`

### HTTP серверы (удалённые):

```yaml
mcp_servers:
  remote_api:
    url: "https://mcp.example.com/mcp"
    headers:
      Authorization: "Bearer ***"
```

**Когда использовать:**
- Сервер размещён на другом хосте
- Организация предоставляет внутренние MCP эндпоинты
- Не хотите запускать локальный подпроцесс

---

## 5. OAuth-аутентифицированные HTTP серверы

Большинство хостинговых MCP серверов (Linear, Sentry, Atlassian, Asana, Figma, Stripe) требуют OAuth 2.1:

```yaml
mcp_servers:
  linear:
    url: "https://mcp.linear.app/mcp"
    auth: oauth
```

При первом подключении Hermes:
1. Печатает URL авторизации
2. Открывает браузер
3. Ждёт callback на локальном loopback порте
4. Кэширует токены в `~/.hermes/mcp-tokens/<server>.json`

### Для удалённых/hедлов хостов:

**Вставка URL (без настройки):** Hermes печатает "Or paste the redirect URL here…"

**SSH port forward:**
```powershell
ssh -N -L <port>:127.0.0.1:<port> user@host
```

### OAuth для Google Drive/Atlassian (без автоматической регистрации):

```yaml
mcp_servers:
  googledrive:
    url: "https://drivemcp.googleapis.com/mcp/v1"
    auth: oauth
    oauth:
      client_id: "<your-oauth-client-id>"
      client_secret: "<your-oauth-client-secret>"
```

Затем: `hermes mcp login googledrive`

---

## 6. mTLS / клиентские сертификаты

```yaml
# Комбинированный PEM
mcp_servers:
  internal_api:
    url: "https://mcp.internal.example.com/mcp"
    client_cert: "~/.certs/mcp-client.pem"

# Раздельные cert + key
mcp_servers:
  internal_api:
    url: "https://mcp.internal.example.com/mcp"
    client_cert: ["~/.certs/mcp-client.crt", "~/.certs/mcp-client.key"]

# С паролем
mcp_servers:
  internal_api:
    url: "https://mcp.internal.example.com/mcp"
    client_cert: ["~/.certs/mcp-client.crt", "~/.certs/mcp-client.key", "${MCP_KEY_PASSWORD}"]
```

---

## 7. Справочник ключей конфигурации

| Ключ | Тип | Описание |
|------|-----|----------|
| `command` | string | Исполняемый файл для stdio MCP |
| `args` | list | Аргументы для stdio сервера |
| `env` | mapping | Переменные окружения для stdio сервера |
| `url` | string | HTTP MCP эндпоинт |
| `headers` | mapping | HTTP заголовки |
| `client_cert` | string/list | Клиентский сертификат для mTLS |
| `client_key` | string | Путь к приватному ключу |
| `timeout` | number | Таймаут вызова инструмента |
| `connect_timeout` | number | Таймаут подключения |
| `enabled` | bool | Если `false`, сервер пропускается |
| `supports_parallel_tool_calls` | bool | Разрешить параллельные вызовы |
| `tools` | mapping | Фильтрация инструментов |

---

## 8. Минимальные примеры

### Stdio:
```yaml
mcp_servers:
  filesystem:
    command: "npx"
    args: ["-y", "@modelcontextprotocol/server-filesystem", "/tmp"]
```

### HTTP:
```yaml
mcp_servers:
  company_api:
    url: "https://mcp.internal.example.com"
    headers:
      Authorization: "Bearer ***"
```

---

## 9. Встроенные пресеты

| Пресет | Что настраивает |
|--------|-----------------|
| `codex` | Codex CLI MCP сервер (`codex mcp-server` по stdio) |

```powershell
hermes mcp add codex --preset codex
```

---

## 10. Регистрация MCP инструментов

Hermes добавляет префикс к MCP инструментам для избежания коллизий:

```
mcp_<server_name>_<tool_name>
```

| Сервер | MCP инструмент | Зарегистрированное имя |
|--------|----------------|----------------------|
| `filesystem` | `read_file` | `mcp_filesystem_read_file` |
| `github` | `create-issue` | `mcp_github_create_issue` |
| `my-api` | `query.data` | `mcp_my_api_query_data` |

---

## 11. Утилиты MCP

При поддержке сервером Hermes регистрирует утилиты:

- `list_resources`
- `read_resource`
- `list_prompts`
- `get_prompt`

**Важно:** Утилиты регистрируются только если сервер поддерживает эти операции.

---

## 12. Фильтрация по серверам

### Отключение сервера:
```yaml
mcp_servers:
  legacy:
    url: "https://mcp.legacy.internal"
    enabled: false
```

### Белый список инструментов:
```yaml
mcp_servers:
  github:
    command: "npx"
    args: ["-y", "@modelcontextprotocol/server-github"]
    env:
      GITHUB_PERSONAL_ACCESS_TOKEN: "***"
    tools:
      include: [create_issue, list_issues]
```

### Чёрный список инструментов:
```yaml
mcp_servers:
  stripe:
    url: "https://mcp.stripe.com"
    tools:
      exclude: [delete_customer]
```

### Приоритет: `include` имеет приоритет над `exclude`

### Отключение утилит:
```yaml
mcp_servers:
  docs:
    url: "https://mcp.docs.example.com"
    tools:
      prompts: false
      resources: false
```

### Полный пример:
```yaml
mcp_servers:
  github:
    command: "npx"
    args: ["-y", "@modelcontextprotocol/server-github"]
    env:
      GITHUB_PERSONAL_ACCESS_TOKEN: "***"
    tools:
      include: [create_issue, list_issues, search_code]
      prompts: false
  stripe:
    url: "https://mcp.stripe.com"
    headers:
      Authorization: "Bearer ***"
    tools:
      exclude: [delete_customer]
      resources: false
  legacy:
    url: "https://mcp.legacy.internal"
    enabled: false
```

---

## 13. Поведение во время выполнения

### Обнаружение:
Hermes обнаруживает MCP серверы при запуске и регистрирует их инструменты.

### Динамическое обнаружение инструментов:
Серверы могут уведомлять Hermes об изменении доступных инструментов через `notifications/tools/list_changed`.

### Перезагрузка:
```
/reload-mcp
```

### Toolsets:
Каждый MCP сервер создаёт runtime toolset: `mcp-<server>`

---

## 14. Безопасность MCP

### Фильтрация stdio окружения:
Только настроенные `env` + безопасные системные переменные.

### Контроль на уровне конфига:
- Отключение опасных инструментов
- Минимальный белый список для чувствительных серверов
- Отключение утилит ресурсов/промптов

---

## 15. Параллельные вызовы инструментов

По умолчанию MCP инструменты выполняются **последовательно**. Для параллельного выполнения:

```yaml
mcp_servers:
  docs:
    command: "docs-server"
    supports_parallel_tool_calls: true
```

**Важно:** Включайте только для серверов с инструментами, безопасными для параллельного выполнения.

---

## 16. MCP Sampling

MCP серверы могут запрашивать LLM инференс от Hermes через `sampling/createMessage`:

```yaml
mcp_servers:
  my_server:
    command: "my-mcp-server"
    sampling:
      enabled: true
      model: "openai/gpt-4o"
      max_tokens_cap: 4096
      timeout: 30
      max_rpm: 10
      max_tool_rounds: 5
      allowed_models: []
      log_level: "info"
```

Для отключения:
```yaml
mcp_servers:
  untrusted_server:
    url: "https://mcp.example.com"
    sampling:
      enabled: false
```

---

## 17. Hermes как MCP сервер

Hermes может **быть** MCP сервером для других агентов (Claude Code, Cursor, Codex):

```powershell
hermes mcp serve
```

### Конфигурация MCP клиента:

```json
{
  "mcpServers": {
    "hermes": {
      "command": "hermes",
      "args": ["mcp", "serve"]
    }
  }
}
```

### Доступные инструменты:

| Инструмент | Описание |
|------------|----------|
| `conversations_list` | Список активных conversations |
| `conversation_get` | Информация о conversation |
| `messages_read` | Чтение истории сообщений |
| `attachments_fetch` | Извлечение вложений |
| `events_poll` | Опрос новых событий |
| `events_wait` | Блокирующий ожидание событий |
| `messages_send` | Отправка сообщения |
| `channels_list` | Список доступных целей |
| `permissions_list_open` | Список ожидающих утверждений |
| `permissions_respond` | Утверждение/отклонение запроса |

### Опции:
```powershell
hermes mcp serve              # Обычный режим
hermes mcp serve --verbose    # Отладочное логирование
```

---

## 18. Примеры использования

### GitHub с минимальным набором инструментов:
```yaml
mcp_servers:
  github:
    command: "npx"
    args: ["-y", "@modelcontextprotocol/server-github"]
    env:
      GITHUB_PERSONAL_ACCESS_TOKEN: "***"
    tools:
      include: [list_issues, create_issue, update_issue]
      prompts: false
      resources: false
```

### Stripe без опасных действий:
```yaml
mcp_servers:
  stripe:
    url: "https://mcp.stripe.com"
    headers:
      Authorization: "Bearer ***"
    tools:
      exclude: [delete_customer, refund_payment]
```

### Файловая система для проекта:
```yaml
mcp_servers:
  project_fs:
    command: "npx"
    args: ["-y", "@modelcontextprotocol/server-filesystem", "C:\\Users\\user\\my-project"]
```

---

## 19. Устранение неполадок

### MCP сервер не подключается:

```powershell
# Проверка зависимостей
cd %LOCALAPPDATA%\hermes\hermes-agent
uv pip install -e ".[mcp]"

# Проверка Node.js
node --version
npx --version
```

### Инструменты не появляются:

- Сервер не подключился
- Обнаружение не удалось
- Фильтр исключил инструменты
- Утилита не поддерживается сервером
- Сервер отключён через `enabled: false`

---

## 20. Windows и MCP

| Функция | Статус на Windows |
|---------|-------------------|
| Stdio серверы | Работает |
| HTTP серверы | Работает |
| OAuth | Работает |
| mTLS | Работает |
| Каталог | Работает |
| Hermes как MCP сервер | Работает |
| Parallel tool calls | Работает |
| MCP Sampling | Работает |
