---
title: "Безопасность Hermes Agent"
section: "Безопасность"
sectionOrder: 90
order: 1
slug: "bezopasnost"
---

# DOC-009: Безопасность Hermes Agent

## Источник
- https://hermes-agent.nousresearch.com/docs/user-guide/security

---

## 1. Обзор модели безопасности

Модель безопасности Hermes основана на **принципе защиты углублением** (defense-in-depth) и включает **7 слоёв:**

1. **Авторизация пользователей** — кто может общаться с агентом
2. **Утверждение опасных команд** — человек в цикле для деструктивных операций
3. **Изоляция контейнеров** — Docker/Singularity/Modal песочница
4. **Фильтрация учётных данных MCP** — изоляция переменных окружения
5. **Сканирование контекстных файлов** — обнаружение prompt injection
6. **Изоляция между сессиями** — сессии не могут обращаться к данным друг друга
7. **Санитизация ввода** — валидация рабочей директории для предотвращения shell injection

---

## 2. Утверждение опасных команд

### Режимы утверждения:

```yaml
approvals:
  mode: manual          # manual | smart | off
  timeout: 60           # секунд до таймаута
  cron_mode: deny       # deny | approve (для cron задач)
```

| Режим | Поведение |
|-------|-----------|
| **manual** | Всегда запрашивает подтверждение |
| **smart** | Вспомогательная LLM оценивает риск. Низкий риск — автоматически, высокий — блокирует, неопределённый — ручное подтверждение |
| **off** | Все проверки отключены (эквивалент `--yolo`) |

---

## 3. YOLO режим

Отключает **все** запросы подтверждения опасных команд на текущую сессию.

### Активация:
```powershell
hermes --yolo
hermes chat --yolo
/yolo                    # во время сессии
$env:HERMES_YOLO_MODE=1  # переменная окружения
```

### Визуальные напоминания:
- Красный баннер при запуске: `⚠ YOLO mode — all approval prompts bypassed`
- `⚠ YOLO` в строке состояния

**Важно:** В YOLO режиме **все** паттерны из списка опасных команд пропускаются без запроса подтверждения. Единственное ограничение — паттерны, которые Hermes считает полностью деструктивными и блокирует даже в YOLO (такие как `rm -rf /`), но в текущей реализации это те же паттерны из `DANGEROUS_PATTERNS`.

---

## 4. Паттерны, вызывающие утверждение

Все опасные команды определены в `DANGEROUS_PATTERNS` в `tools/approval.py`. При обнаружении任何 из них пользователю предлагается подтверждение:

---

## 5. Паттерны, вызывающие утверждение

| Паттерн | Описание |
|---------|----------|
| `rm -r` / `rm --recursive` | Рекурсивное удаление |
| `rm ... /` | Удаление в корне |
| `chmod 777/666` | Мир/все записи |
| `chown -R root` | Рекурсивная смена владельца на root |
| `mkfs` | Форматирование файловой системы |
| `dd if=` | Копирование диска |
| `DROP TABLE/DATABASE` | SQL DROP |
| `DELETE FROM` (без WHERE) | SQL DELETE без условия |
| `TRUNCATE TABLE` | SQL TRUNCATE |
| `> /etc/` | Перезапись системного конфига |
| `systemctl stop/restart/disable/mask` | Остановка системных сервисов |
| `kill -9 -1` | Убийство всех процессов |
| `curl ... \| sh` / `wget ... \| sh` | Пайп удалённого контента в shell |
| ``bash <(curl ...)`` | Выполнение удалённого скрипта |
| `tee` в `/etc/`, `~/.ssh/`, `~/.hermes/.env` | Запись в чувствительные файлы |
| `sed -i` на `/etc/` | Редактирование системных файлов |
| `pkill`/`killall` hermes/gateway | Самоубийство процесса |

**Примечание:** В контейнерах (Docker, Singularity, Modal) проверки опасных команд **пропускаются** — сам контейнер является границей безопасности.

---

## 6. Поток утверждения (CLI)

```
  ⚠️  DANGEROUS COMMAND: recursive delete
      rm -rf /tmp/old-project

      [o]nce  |  [s]ession  |  [a]lways  |  [d]eny

      Choice [o/s/a/D]:
```

| Опция | Действие |
|-------|----------|
| **once** | Разрешить одно выполнение |
| **session** | Разрешить этот паттерн до конца сессии |
| **always** | Добавить в постоянный список разрешений |
| **deny** | Заблокировать команду (по умолчанию) |

---

## 7. Поток утверждения (Gateway/Мессенджеры)

Ответные сообщения:
- `yes`, `y`, `approve`, `ok`, `go` — одобрить
- `no`, `n`, `deny`, `cancel` — отклонить

---

## 8. Постоянный список разрешений

Команды, одобренные через "always", сохраняются в `config.yaml`:

```yaml
command_allowlist:
  - rm
  - systemctl
```

Просмотр и редактирование: `hermes config edit`

---

## 9. Авторизация пользователей (Gateway)

### Порядок проверки:
1. Флаг `*_ALLOW_ALL_USERS` для платформы
2. Список утверждённых через pairing
3. Списки конкретных платформ (`TELEGRAM_ALLOWED_USERS` и т.д.)
4. Глобальный список (`GATEWAY_ALLOWED_USERS`)
5. Глобальный флаг `GATEWAY_ALLOW_ALL_USERS`
6. **По умолчанию: запрет**

### Списки платформ:

```bash
# ~/.hermes/.env
TELEGRAM_ALLOWED_USERS=123456789,987654321
DISCORD_ALLOWED_USERS=111222333444555666
WHATSAPP_ALLOWED_USERS=15551234567
SLACK_ALLOWED_USERS=U01ABC123

# Кроссплатформенный список
GATEWAY_ALLOWED_USERS=123456789

# Разрешить всем (осторожно!)
GATEWAY_ALLOW_ALL_USERS=true
```

**Важно:** Если списки не настроены и `GATEWAY_ALLOW_ALL_USERS` не установлен, **все пользователи блокируются**.

---

## 10. Система DM Pairing

Для гибкой авторизации Hermes использует систему кодов на основе одноразовых кодов.

### Как работает:
1. Неизвестный пользователь отправляет DM боту
2. Бот отвечает 8-символьным кодом pairing
3. Владелец выполняет `hermes pairing approve <platform> <code>`
4. Пользователь утверждается навсегда

### Настройка поведения:

```yaml
unauthorized_dm_behavior: pair     # pair | ignore
whatsapp:
  unauthorized_dm_behavior: ignore
```

### CLI команды:

```powershell
hermes pairing list                         # список ожидающих и утверждённых
hermes pairing approve telegram ABC12DEF    # утверждение кода
hermes pairing revoke telegram 123456789    # отзыв доступа
hermes pairing clear-pending                # очистка ожидающих кодов
```

### Хранение:
- `%LOCALAPPDATA%\hermes\pairing\{platform}-pending.json`
- `%LOCALAPPDATA%\hermes\pairing\{platform}-approved.json`
- `%LOCALAPPDATA%\hermes\pairing\_rate_limits.json`

---

## 11. Изоляция контейнеров (Docker)

### Флаги безопасности:

```
--cap-drop ALL              # Сброс ВСЕХ Linux capability
--cap-add DAC_OVERRIDE      # Запись в bind-монтируемые директории
--cap-add CHOWN             # Смена владельца файлов
--cap-add FOWNER            # Управление правами
--security-opt no-new-privileges  # Блокировка эскалации привилегий
--pids-limit 256            # Лимит процессов
--tmpfs /tmp:rw,nosuid,size=512m    # Размер /tmp
--tmpfs /var/tmp:rw,noexec,nosuid,size=256m  # /var/tmp без exec
```

### Лимиты ресурсов:

```yaml
terminal:
  backend: docker
  docker_image: "nikolaik/python-nodejs:python3.11-nodejs20"
  container_cpu: 1
  container_memory: 5120     # MB
  container_disk: 51200      # MB
  container_persistent: true
```

---

## 12. Сравнение безопасности терминальных бэкендов

| Бэкенд | Изоляция | Проверка опасных команд | Назначение |
|--------|----------|------------------------|------------|
| **local** | Нет | Да | Разработка, доверенные пользователи |
| **ssh** | Удалённая машина | Да | Запуск на отдельном сервере |
| **docker** | Контейнер | Нет (контейнер — граница) | Продакшн |
| **singularity** | Контейнер | Нет | HPC окружения |
| **modal** | Облачная песочница | Нет | Масштабируемая облачная изоляция |
| **daytona** | Облачная песочница | Нет | Постоянные облачные рабочие пространства |

---

## 13. Проброс переменных окружения

### Фильтрация по умолчанию:

| Песочница | Фильтр по умолчанию | Переопределение |
|-----------|---------------------|-----------------|
| **execute_code** | Блокирует переменные с `KEY`, `TOKEN`, `SECRET`, `PASSWORD` и т.д. | ✅ Passthrough |
| **terminal** (local) | Блокирует инфраструктурные переменные Hermes | ✅ Passthrough |
| **terminal** (Docker) | Без переменных хоста по умолчанию | ✅ Passthrough + `docker_forward_env` |
| **terminal** (Modal) | Без переменных/файлов хоста | ✅ Credential files + env passthrough |
| **MCP** | Всё заблокировано кроме безопасных системных переменных | ❌ Используйте `env` конфиг |

### Проброс переменных для скиллов:

```yaml
# В SKILL.md
required_environment_variables:
  - name: TENOR_API_KEY
    prompt: Tenor API key
```

### Ручной проброс:

```yaml
terminal:
  env_passthrough:
    - MY_CUSTOM_KEY
    - ANOTHER_TOKEN
```

---

## 14. Безопасность MCP

### Безопасные переменные окружения для MCP:
```
PATH, HOME, USER, LANG, LC_ALL, TERM, SHELL, TMPDIR
```
+ переменные `XDG_*`.

### Конфигурация MCP серверов:

```yaml
mcp_servers:
  github:
    command: "npx"
    args: ["-y", "@modelcontextprotocol/server-github"]
    env:
      GITHUB_PERSONAL_ACCESS_TOKEN: "ghp_..."
```

### Маскировка учётных данных:
- GitHub PATs (`ghp_...`)
- OpenAI ключи (`sk-...`)
- Bearer токены
- `token=`, `key=`, `API_KEY=`, `password=`, `secret=`

---

## 15. Блокировка веб-сайтов

```yaml
security:
  website_blocklist:
    enabled: true
    domains:
      - "*.internal.company.com"
      - "admin.example.com"
    shared_files:
      - "/etc/hermes/blocked-sites.txt"
```

---

## 16. SSRF защита

Все инструменты с URL проверяют адреса перед загрузкой. Блокируются:
- Приватные сети (RFC 1918): `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`
- Loopback: `127.0.0.0/8`, `::1`
- Link-local: `169.254.0.0/16` (включая облачные метаданные `169.254.169.254`)
- CGNAT: `100.64.0.0/10` (Tailscale, WireGuard)
- Облачные метаданные: `metadata.google.internal`, `metadata.goog`

Для разрешения приватных URL:
```yaml
security:
  allow_private_urls: true   # по умолчанию: false
```

---

## 17. Tirith — предварительное сканирование

Интеграция с [tirith](https://github.com/sheeki03/tirith) для обнаружения:
- Homograph URL атак
- Пайпинг интерпретаторов (`curl | bash`)
- Terminal injection атак

```yaml
security:
  tirith_enabled: true
  tirith_path: "tirith"
  tirith_timeout: 5
  tirith_fail_open: true     # продолжать, если tirith недоступен
```

**Примечание:** На Windows tirith пропускается (используйте WSL).

---

## 18. Защита контекстных файлов от injection

Паттерны обнаружения:
- Инструкции игнорировать предыдущие указания
- Скрытые HTML-комментарии
- Попытки чтения секретов (`.env`, `credentials`, `.netrc`)
- Эксплуатация учётных данных через `curl`
- Невидимые Unicode символы (zero-width spaces, bidirectional overrides)

При обнаружении:
```
[BLOCKED: AGENTS.md contained potential prompt injection (prompt_injection). Content not loaded.]
```

---

## 19. Ленивая установка зависимостей

Hermes устанавливает опциональные пакеты **при первом использовании**, а не все сразу.

### Отключение:
```yaml
security:
  allow_lazy_installs: false
```

---

## 20. Чеклист безопасности для продакшна

1. **Явные списки разрешений** — никогда не используйте `GATEWAY_ALLOW_ALL_USERS=true`
2. **Контейнерный бэкенд** — `terminal.backend: docker`
3. **Лимиты ресурсов** — CPU, память, диск
4. **Хранение секретов** — API ключи в `.env` с правами 600
5. **DM Pairing** — используйте коды вместо хардкода ID
6. **Аудит `command_allowlist`** — периодически проверяйте
7. **Задайте `terminal.cwd`** — не позволяйте агенту работать из чувствительных директорий
8. **Запуск от не-root** — никогда не запускайте gateway от root
9. **Мониторинг логов** — проверяйте `%LOCALAPPDATA%\hermes\logs\`
10. **Обновления** — выполняйте `hermes update` регулярно

### Безопасность API ключей:

```powershell
icacls %LOCALAPPDATA%\hermes\.env /inheritance:r /grant:r "%USERNAME%:F"
```

---

## 21. Сетевая изоляция

Для максимальной безопасности запускайте gateway на отдельной машине:

```yaml
terminal:
  backend: ssh
```

```bash
# ~/.hermes/.env
TERMINAL_SSH_HOST=agent-worker.local
TERMINAL_SSH_USER=hermes
TERMINAL_SSH_KEY=~/.ssh/hermes_agent_key
```

---

## 22. Проверка цепочки поставок

Hermes проверяет Python пакеты на наличие известных скомпрометированных версий.

```powershell
hermes doctor                          # проверка текущих advisory
hermes doctor --ack <advisory-id>      # подтверждение ознакомления
```

---

## 23. Windows и безопасность

| Функция | Статус на Windows |
|---------|-------------------|
| Dangerous command approval | Работает |
| YOLO режим | Работает |
| Hardline blocklist | Работает |
| Docker изоляция | Работает (Docker Desktop) |
| Tirith сканирование | **Пропускается** (нет бинарника) |
| SSRF защита | Работает |
| Context file injection | Работает |
