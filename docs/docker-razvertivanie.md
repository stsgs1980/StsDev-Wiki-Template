---
title: "Docker развертывание"
section: "Docker развертывание"
sectionOrder: 160
order: 1
slug: "docker-razvertivanie"
---

# Hermes Agent -- Docker-развертывание

## Два варианта использования Docker

Docker взаимодействует с Hermes Agent двумя способами:

1. **Hermes запускается Внутри Docker** -- сам агент работает внутри контейнера (основной фокус данной документации)
2. **Docker как терминальный бэкенд** -- агент работает на хосте, но каждая команда выполняется внутри постоянного Docker-песочницы контейнера, который переживает вызовы инструментов, `/new` и субагенты на протяжении всего процесса Hermes (см. [Configuration -> Docker Backend](/docs/user-guide/configuration#docker-backend))

Контейнер хранит все пользовательские данные (конфигурацию, API-ключи, сессии, навыки, воспоминания) в единой директории, смонтированной на хосте по пути `/opt/data`. Сам образ Stateless и может быть обновлен извлечением новой версии без потери конфигурации.

---

## Быстрый старт

Если это первый запуск Hermes Agent, создайте директорию данных на хосте и запустите контейнер интерактивно для прохождения мастера настройки:

```bash
mkdir -p ~/.hermes
docker run -it --rm \
  -v ~/.hermes:/opt/data \
  nousresearch/hermes-agent setup
```

Это запустит мастер настройки, который запросит API-ключи и запишет их в `~/.hermes/.env`. Процедура выполняется один раз. Рекомендуется настроить чат-систему для работы gateway на этом этапе.

Внутри контейнера выполните `hermes setup --portal` -- refresh-токен сохранится в смонтированном volume `~/.hermes`. См. [Nous Portal](/docs/integrations/nous-portal).

> Не используйте браузерные консоли VPS для команд установки. Некоторые провайдеры VPS (Hetzner Cloud и др.) передают специальные символы некорректно -- `:` может прийти как `;`, `@` может быть отображен неправильно. Подключайтесь по SSH (`ssh root@<host>`) для безопасного копирования команд.

---

## Режим Gateway

После настройки запустите контейнер в фоне как постоянный gateway (Telegram, Discord, Slack, WhatsApp и т.д.):

```bash
docker run -d \
  --name hermes \
  --restart unless-stopped \
  -v ~/.hermes:/opt/data \
  -p 8642:8642 \
  nousresearch/hermes-agent gateway run
```

Порт 8642 предоставляет [OpenAI-совместимый API-сервер](/docs/user-guide/features/api-server) и health-эндпоинт gateway. Он не обязателен, если вы используете только чат-платформы (Telegram, Discord и т.д.), но необходим для дашборда или внешних инструментов, обращающихся к gateway.

### Автоматическое восстановление

Внутри официального Docker-образа `gateway run` автоматически контролируется s6-overlay: при падении gateway он перезапускается через несколько секунд без потери контейнера. Дашборд (при `HERMES_DASHBOARD=1`) контролируется параллельно. Сам процесс `gateway run` -- это `sleep infinity`, который поддерживает жизнь контейнера, пока s6 управляет реальным процессом gateway. `docker stop` по-прежнему корректно останавливает всё.

Для отказа от контроля (для CI-тестов, где контейнер должен завершиться с кодом gateway) передайте `--no-supervise` или установите `HERMES_GATEWAY_NO_SUPERVISE=1`. Для продакшн-развертываний рекомендуется значение по умолчанию с контролем.

### Ограничения цикла инструментов

Настройка `tool_loop_guardrails.hard_stop_enabled` по умолчанию `false`. В неизолированных gateway-деплоях рекомендуется явно включить жесткие остановки в `config.yaml` профиля:

```yaml
tool_loop_guardrails:
  hard_stop_enabled: true
  hard_stop_after:
    exact_failure: 5
    idempotent_no_progress: 5
```

### API-сервер

API-сервер требует `API_SERVER_ENABLED=true`. Для доступа извне контейнера также установите `API_SERVER_HOST=0.0.0.0` и `API_SERVER_KEY` (минимум 8 символов):

```bash
docker run -d \
  --name hermes \
  --restart unless-stopped \
  -v ~/.hermes:/opt/data \
  -p 8642:8642 \
  -e API_SERVER_ENABLED=true \
  -e API_SERVER_HOST=0.0.0.0 \
  -e API_SERVER_KEY="$(openssl rand -hex 32)" \
  -e API_SERVER_CORS_ORIGINS='*' \
  nousresearch/hermes-agent gateway run
```

> Открытие портов на интернет-доступной машине -- это риск безопасности. Делайте это только осознанно.

---

## Дашборд в Docker

Встроенный веб-дашборд работает как контролируемый сервис s6-rc рядом с gateway в том же контейнере. Установите `HERMES_DASHBOARD=1` для запуска:

```bash
docker run -d \
  --name hermes \
  --restart unless-stopped \
  -v ~/.hermes:/opt/data \
  -p 8642:8642 \
  -p 9119:9119 \
  -e HERMES_DASHBOARD=1 \
  nousresearch/hermes-agent gateway run
```

Дашборд контролируется s6 -- при падении `s6-supervise` автоматически перезапускает его с небольшой задержкой.

### Переменные окружения дашборда

| Переменная | Описание | Значение по умолчанию |
|---|---|---|
| `HERMES_DASHBOARD` | Установите `1` (или `true` / `yes`) для включения сервиса | *(не установлена -- сервис зарегистрирован, но не запущен)* |
| `HERMES_DASHBOARD_HOST` | Адрес привязки HTTP-сервера дашборда | `0.0.0.0` |
| `HERMES_DASHBOARD_PORT` | Порт HTTP-сервера дашборда | `9119` |

Дашборд по умолчанию привязывается к `0.0.0.0` -- без этого опубликованный порт `9119` будет недоступен с хоста. Для ограничения привязки на loopback (для reverse-proxy) установите `HERMES_DASHBOARD_HOST=127.0.0.1`.

### Аутентификация

Гейт аутентификации дашборда срабатывает автоматически, когда:

1. Хост привязки -- не loopback (например, `0.0.0.0` по умолчанию), **и**
2. Зарегистрирован плагин `DashboardAuthProvider`.

Три встроенных варианта аутентификации:

- **Имя пользователя / пароль** -- простой вариант для self-hosted / homelab: установите `HERMES_DASHBOARD_BASIC_AUTH_USERNAME` + `HERMES_DASHBOARD_BASIC_AUTH_PASSWORD` (и `HERMES_DASHBOARD_BASIC_AUTH_SECRET` для стабильных сессий).
- **OAuth (Nous Portal)** -- для публичных деплоев: провайдер `dashboard_auth/nous` активируется при установке `HERMES_DASHBOARD_OAUTH_CLIENT_ID`.
- **Self-hosted OIDC** -- для аутентификации через собственный identity-провайдер: провайдер `dashboard_auth/self_hosted` активируется при установке `HERMES_DASHBOARD_OIDC_ISSUER` + `HERMES_DASHBOARD_OIDC_CLIENT_ID`.

Если провайдер не установлен и привязка не-loopback, дашборд завершает работу с ошибкой при запуске.

---

## Интерактивный CLI

Для запуска интерактивной сессии чата:

```bash
docker run -it --rm \
  -v ~/.hermes:/opt/data \
  nousresearch/hermes-agent
```

Если уже открыт терминал в запущенном контейнере (например, через Docker Desktop):

```bash
/opt/hermes/.venv/bin/hermes
```

---

## Постоянные volumes

Volume `/opt/data` является единственным источником всех состояний Hermes. Он отображается на директорию `~/.hermes/` на хосте и содержит:

| Путь | Содержимое |
|---|---|
| `.env` | API-ключи и секреты |
| `config.yaml` | Вся конфигурация Hermes |
| `SOUL.md` | Личность/идентификация агента |
| `sessions/` | История разговоров |
| `memories/` | Постоянное хранилище памяти |
| `skills/` | Установленные навыки |
| `home/` | Профильный HOME для подпроцессов Hermes (`git`, `ssh`, `gh`, `npm`) |
| `cron/` | Определения запланированных задач |
| `hooks/` | Хуки событий |
| `logs/` | Логи выполнения |
| `skins/` | Пользовательские скины CLI |

---

## Неизменяемое дерево установки

В опубликованных Docker-образах `/opt/hermes` -- это дерево установленного приложения. Оно принадлежит root и доступно только для чтения для runtime-пользователя `hermes`. Агент, gateway-сессии, действия дашборда и обычные команды `docker exec hermes hermes ...` не могут изменять основной исходный код, `.venv`, `node_modules` или TUI-бандл.

Всё изменяемое состояние Hermes находится в `/opt/data`: конфигурация, `.env`, профили, навыки, воспоминания, сессии, логи, загрузки дашборда, плагины и другие управляемые пользователем файлы.

---

## Мультипрофильная поддержка

Hermes поддерживает [несколько профилей](/docs/reference/profile-commands) -- отдельные поддиректории `~/.hermes/`, позволяющие запускать независимых агентов (разные SOUL, навыки, память, сессии, учетные данные) из одной установки. **Внутри официального Docker-образа дерево контроля s6 обрабатывает каждый профиль как первоклассический контролируемый сервис**, поэтому рекомендуемый деплой -- **один контейнер для всех профилей**.

Каждый профиль, созданный через `hermes profile create <name>`, получает:

- Выделенный слот сервиса s6 в `/run/service/gateway-<name>/`
- Автоматический перезапуск при падении с управлением задержкой через `s6-supervise`
- Профильные ротируемые логи в `${HERMES_HOME}/logs/gateways/<name>/current` (10 архивов по 1 МБ)
- Сохранение состояния при перезапусках контейнера: reconciler при загрузке читает `gateway_state.json` каждого профиля и запускает только те, чье последнее состояние было `running`

### Команды управления профилями

```bash
# Создание профиля -- регистрирует слот gateway-<name>
docker exec hermes hermes profile create coder

# Запуск / остановка / перезапуск
docker exec hermes hermes -p coder gateway start
docker exec hermes hermes -p coder gateway stop
docker exec hermes hermes -p coder gateway restart

# Статус -- показывает "Manager: s6 (container supervisor)"
docker exec hermes hermes -p coder gateway status

# Удаление профиля -- также снимает слот s6
docker exec hermes hermes profile delete coder
```

### Доступ к нескольким профилям извне контейнера

**Hermes Desktop и веб-дашборд.** Desktop-приложение подключается к бэкенду `hermes dashboard` (порт **9119**, включается через `HERMES_DASHBOARD=1`). Один бэкенд дашборда обслуживает **все** размещенные профили -- переключатель профилей в приложении передает целевой профиль с каждым запросом. Одного подключения `:9119` достаточно для всех профилей.

**OpenAI-совместимые API-клиенты** (Open WebUI, LobeChat, `/v1/...`). Они подключаются к API-серверу каждого профиля, который привязывает **порт 8642 для каждого профиля**. Если нужен доступ ко второму профилю, назначьте ему другой порт в его `.env`:

```bash
# Создание профиля
docker exec hermes hermes profile create work

# Назначение другого порта API-сервера
cat >> /opt/data/profiles/work/.env <<'EOF'
API_SERVER_ENABLED=true
API_SERVER_PORT=8643
EOF

docker exec hermes hermes -p work gateway restart
```

> Держите `API_SERVER_PORT` в `.env` каждого профиля, а не в глобальном `environment:` -- глобальное значение заставит все профили использовать один порт и вызовет конфликт.

### Почему один контейнер с многими профилями

| Критерий | Один контейнер, много профилей | Один контейнер на профиль |
|---|---|---|
| Дисковые накладные расходы | Один образ, один venv, один кэш Playwright | N образов / N кэшей |
| Память | Общий кэш интерпретатора Python, общие node_modules | Дублирование на контейнер |
| Создание профиля | `docker exec ... hermes profile create <name>` (секунды) | Новый `docker run` + выделение порта |
| Восстановление после падения | Автоперезапуск через `s6-supervise` | Docker `--restart unless-stopped` (медленнее) |
| Логи | Профильные ротируемые файлы через `s6-log` | `docker logs <name>` на контейнер -- без ротации |
| Резервное копирование | Одна директория `~/.hermes` | N директорий для координации |

### Когда нужен отдельный контейнер

Отдельный контейнер на профиль оправдан при:

- **Изоляция ресурсов** -- например, runaway-сессия браузера в профиле A не должна вызвать OOM в профиле B. Контейнеры дают `--memory` / `--cpus` на профиль.
- **Независимая привязка образов** -- разные теги upstream-образа на workload.
- **Сетевая сегментация** -- отдельные Docker-сети на профиль.
- **Соответствие / область поражения** -- разные учетные данные не разделяют дерево процессов ОС.

```yaml
services:
  hermes-work:
    image: nousresearch/hermes-agent:latest
    container_name: hermes-work
    restart: unless-stopped
    command: gateway run
    ports:
      - "8642:8642"
    volumes:
      - ~/.hermes-work:/opt/data

  hermes-personal:
    image: nousresearch/hermes-agent:latest
    container_name: hermes-personal
    restart: unless-stopped
    command: gateway run
    ports:
      - "8643:8642"
    volumes:
      - ~/.hermes-personal:/opt/data
```

> Никогда не направляйте два контейнера на одну директорию `~/.hermes` одновременно -- файлы сессий и хранилища памяти не предназначены для параллельной записи.

---

## Расположение логов

Контейнер s6 имеет четыре различных лог-интерфейса:

| Источник | Расположение | Как читать |
|---|---|---|
| **Gateway на профиль** | Дублируется в `docker logs <container>` и `${HERMES_HOME}/logs/gateways/<profile>/current` (ротируемый, 10 архивов по 1 МБ) | `docker logs -f hermes` или `tail -F ~/.hermes/logs/gateways/default/current` на хосте |
| **Дашборд** (при `HERMES_DASHBOARD=1`) | `docker logs <container>` (без префикса) | `docker logs -f hermes` -- перемешивается с gateway-строками |
| **Boot reconciler** | `${HERMES_HOME}/logs/container-boot.log` (append-only) | `tail -F ~/.hermes/logs/container-boot.log` |
| **Общие логи Hermes** (`agent.log`, `errors.log`) | `${HERMES_HOME}/logs/` (с учетом профилей) | `docker exec hermes hermes logs --follow [--level WARNING] [--session <id>]` |

Две практические особенности:

- Файловая копия в `logs/gateways/<profile>/current` сохраняется при перезапусках контейнера. `docker logs` хранит вывод только текущего контейнера (и очищается при `docker rm`).
- Формат строки boot reconciler: `<iso-timestamp> profile=<name> prior_state=<state> action=<registered|started>` -- быстрый поиск: `grep profile=coder ~/.hermes/logs/container-boot.log`.

---

## Пересылка переменных окружения

API-keys читаются из `/opt/data/.env` внутри контейнера. Можно также передавать переменные окружения напрямую:

```bash
docker run -it --rm \
  -v ~/.hermes:/opt/data \
  -e ANTHROPIC_API_KEY="sk-ant-..." \
  -e OPENAI_API_KEY="sk-..." \
  nousresearch/hermes-agent
```

Прямые флаги `-e` переопределяют значения из `.env`. Это полезно для CI/CD или интеграций с менеджерами секретов, где ключи не хранятся на диске.

---

## Docker Compose

Для постоянного развёртывания с gateway и дашбордом удобно использовать `docker-compose.yaml`:

```yaml
services:
  hermes:
    image: nousresearch/hermes-agent:latest
    container_name: hermes
    restart: unless-stopped
    command: gateway run
    ports:
      - "8642:8642"
      - "9119:9119"
    volumes:
      - ~/.hermes:/opt/data
    environment:
      - HERMES_DASHBOARD=1
      # Пересылка переменных окружения вместо .env файла:
      # - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      # - OPENAI_API_KEY=${OPENAI_API_KEY}
      # - TELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN}
    deploy:
      resources:
        limits:
          memory: 4G
          cpus: "2.0"
```

Запуск: `docker compose up -d`. Просмотр логов: `docker compose logs -f`.

---

## Опционально: аудио-мост для Linux-рабочего стола

Голосовой режим в Docker требует двух вещей: разрешения Hermes на проверку аудиоустройств внутри контейнера и доступа контейнера к аудиосерверу хоста. Настройка ниже适用于 Linux-рабочих столов с PulseAudio-совместимым сокетом (включая многие конфигурации PipeWire).

Создайте конфиг ALSA рядом с Compose-файлом:

**asound.conf**
```
pcm.!default {
    type pulse
    hint {
        show on
        description "Default ALSA Output (PulseAudio)"
    }
}
pcm.pulse {
    type pulse
}
ctl.!default {
    type pulse
}
```

Соберите производный образ с ALSA PulseAudio-плагином:

**Dockerfile.audio**
```dockerfile
FROM nousresearch/hermes-agent:latest
USER root
RUN apt-get update \
    && apt-get install -y --no-install-recommends libasound2-plugins \
    && rm -rf /var/lib/apt/lists/*
```

Используйте этот образ в Compose и пробросьте PulseAudio-сокет и cookie хоста:

```yaml
services:
  hermes:
    build:
      context: .
      dockerfile: Dockerfile.audio
    image: hermes-agent-audio
    container_name: hermes
    restart: unless-stopped
    command: gateway run
    volumes:
      - ~/.hermes:/opt/data
      - /run/user/${HERMES_UID}/pulse:/run/user/${HERMES_UID}/pulse
      - ~/.config/pulse/cookie:/tmp/pulse-cookie:ro
      - ./asound.conf:/etc/asound.conf:ro
    environment:
      - HERMES_UID=${HERMES_UID}
      - HERMES_GID=${HERMES_GID}
      - XDG_RUNTIME_DIR=/run/user/${HERMES_UID}
      - PULSE_SERVER=unix:/run/user/${HERMES_UID}/pulse/native
      - PULSE_COOKIE=/tmp/pulse-cookie
```

Запуск с UID/GID текущего пользователя:

```bash
export HERMES_UID="$(id -u)"
export HERMES_GID="$(id -g)"
docker compose up -d --build
```

Проверка PortAudio внутри контейнера:

```bash
docker exec hermes /opt/hermes/.venv/bin/python -c "import sounddevice as sd; print(sd.query_devices())"
```

---

## Лимиты ресурсов

Контейнер Hermes требует умеренных ресурсов. Рекомендуемые минимумы:

| Ресурс | Минимум | Рекомендуется |
|---|---|---|
| Память | 1 ГБ | 2-4 ГБ |
| CPU | 1 ядро | 2 ядра |
| Диск (volume данных) | 500 МБ | 2+ ГБ (растет с сессиями/навыками) |

Автоматизация браузера (Playwright/Chromium) -- самый требовательный к памяти компонент. Без инструментов браузера 1 ГБ достаточно. С активными инструментами браузера выделяйте минимум 2 ГБ.

Установка лимитов в Docker:

```bash
docker run -d \
  --name hermes \
  --restart unless-stopped \
  --memory=4g --cpus=2 \
  -v ~/.hermes:/opt/data \
  nousresearch/hermes-agent gateway run
```

---

## Что делает Dockerfile

Официальный образ построен на `debian:13.4` и включает:

- **Python 3.13** с зависимостями из lockfile через `uv sync --frozen --no-install-project` для бандловых экстров (`all`, `messaging`, Anthropic/Bedrock/Azure identity, Hindsight, Matrix), с последующей editable-установкой самого Hermes без зависимостей
- **Node.js 22 + npm** (для автоматизации браузера, WhatsApp-бридж, TUI/Desktop бандлов и workspace-инструментов сборки)
- **Playwright с Chromium** (`npx playwright install --with-deps chromium --only-shell`)
- **ripgrep, ffmpeg, git, xz-utils** как системные утилиты
- **docker-cli** -- чтобы агенты внутри контейнера могли управлять Docker-демоном хоста (монтируйте `/var/run/docker.sock`)
- **openssh-client** -- обеспечивает [SSH-терминальный бэкенд](/docs/user-guide/configuration#ssh-backend) изнутри контейнера
- **WhatsApp-бридж** (`scripts/whatsapp-bridge/`)
- **s6-overlay v3** как PID 1 (заменяет `tini`) -- контролирует дашборд и gateway на профили с автоперезапуском, reap-ит zombie-процессы и пересылает сигналы

### Точка входа контейнера

ENTRYPOINT контейнера -- `/init` (s6-overlay). При загрузке:

1. Запускает `/etc/cont-init.d/01-hermes-setup` от root: опциональный ремап UID/GID, исправление владельца volume,种子 `.env` / `config.yaml` / `SOUL.md` при первом запуске, миграции схемы конфигурации (если `HERMES_SKIP_CONFIG_MIGRATION=1` не установлен), синхронизация встроенных навыков.
2. Запускает `/etc/cont-init.d/02-reconcile-profiles`: обходит `$HERMES_HOME/profiles/<name>/`, пересоздает слот gateway-<profile> под `/run/service/gateway-<profile>/` и автозапускает только те, чье последнее состояние было `running`.
3. Запускает статические сервисы `main-hermes` и `dashboard`.
4. Выполняет CMD контейнера как главную программу (`/opt/hermes/docker/main-wrapper.sh`):
   - Без аргументов -> `hermes` (по умолчанию)
   - Первый аргумент -- исполняемый файл на PATH (например, `sleep`, `bash`) -> прямой exec
   - Всё остальное -> `hermes <args>` (передача подкоманды)

### Привилегиенная модель

`docker exec hermes <cmd>` по умолчанию запускается от root, но образ содержит обертку `/opt/hermes/bin/hermes` (самый первый на PATH), которая обнаруживает root-вызывающих и транспарентно перезапускает через `s6-setuidgid hermes`. Все команды `docker exec hermes login`, `docker exec hermes profile create ...` записывают файлы, принадлежащие UID 10000 -- читаемые контролируемым gateway.

Для `docker exec` с сохранением семантики root:

```bash
docker exec -e HERMES_DOCKER_EXEC_AS_ROOT=1 hermes <cmd>
```

---

## Обновление

Извлеките последний образ и пересоздайте контейнер. Директория данных сохраняется, и контейнер выполняет миграции схемы конфигурации перед запуском gateway.

```bash
docker pull nousresearch/hermes-agent:latest
docker rm -f hermes
docker run -d \
  --name hermes \
  --restart unless-stopped \
  -v ~/.hermes:/opt/data \
  nousresearch/hermes-agent gateway run
```

Или с Docker Compose:

```bash
docker compose pull
docker compose up -d
```

Установите `HERMES_SKIP_CONFIG_MIGRATION=1` только если необходимо вручную проверить или мигрировать сохраненную конфигурацию перед тем, как новый образ перезапишет её.

---

## Подключение к локальным серверам вывода (vLLM, Ollama)

### Docker Compose (рекомендуется)

Поместите оба сервиса в одну Docker-сеть:

```yaml
services:
  vllm:
    image: vllm/vllm-openai:latest
    container_name: vllm
    command: >
      --model Qwen/Qwen2.5-7B-Instruct
      --served-model-name my-model
      --host 0.0.0.0
      --port 8000
    ports:
      - "8000:8000"
    networks:
      - hermes-net
    deploy:
      resources:
        reservations:
          devices:
            - capabilities: [gpu]

  hermes:
    image: nousresearch/hermes-agent:latest
    container_name: hermes
    restart: unless-stopped
    command: gateway run
    ports:
      - "8642:8642"
    volumes:
      - ~/.hermes:/opt/data
    networks:
      - hermes-net

networks:
  hermes-net:
    driver: bridge
```

В `~/.hermes/config.yaml` используйте **имя контейнера** как hostname:

```yaml
model:
  provider: custom
  model: my-model
  base_url: http://vllm:8000/v1
  api_key: "none"
```

Ключевые моменты:

- Используйте **имя контейнера** (`vllm`) как hostname -- не `localhost` или `127.0.0.1`, которые ссылаются на контейнер Hermes.
- Значение `model` должно совпадать с `--served-model-name`, переданным vLLM.
- Установите `api_key` в любую непустую строку (vLLM требует заголовок, но по умолчанию не проверяет его).
- Не включайте trailing slash в `base_url`.

### Автономный Docker run (без Compose)

Если сервер вывода работает на хосте (не в Docker), используйте `host.docker.internal` на macOS/Windows или `--network host` на Linux.

**macOS / Windows:**

```bash
docker run -d \
  --name hermes \
  -v ~/.hermes:/opt/data \
  -p 8642:8642 \
  nousresearch/hermes-agent gateway run
```

```yaml
# config.yaml
model:
  provider: custom
  model: my-model
  base_url: http://host.docker.internal:8000/v1
  api_key: "none"
```

**Linux (сеть хоста):**

```bash
docker run -d \
  --name hermes \
  --network host \
  -v ~/.hermes:/opt/data \
  nousresearch/hermes-agent gateway run
```

```yaml
# config.yaml
model:
  provider: custom
  model: my-model
  base_url: http://127.0.0.1:8000/v1
  api_key: "none"
```

При `--network host` флаг `-p` игнорируется -- все порты контейнера напрямую доступны на хосте.

### Проверка подключения

Изнутри контейнера Hermes:

```bash
docker exec hermes curl -s http://vllm:8000/v1/models
```

Должен вернуть JSON с списком модели. Если не работает, проверьте:

1. Оба контейнера в одной Docker-сети (`docker network inspect hermes-net`)
2. Сервер вывода слушает на `0.0.0.0`, не `127.0.0.1`
3. Номер порта совпадает

### Ollama

Ollama работает аналогично. Если запущена на хосте, используйте `host.docker.internal:11434` (macOS/Windows) или `127.0.0.1:11434` (Linux с `--network host`). Если в отдельном контейнере на той же сети:

```yaml
model:
  provider: custom
  model: llama3
  base_url: http://ollama:11434/v1
  api_key: "none"
```

---

## Устранение неполадок

### Контейнер сразу завершается

Проверьте логи: `docker logs hermes`. Частые причины:

- Отсутствует или невалиден файл `.env` -- запустите интерактивно для завершения настройки
- Конфликты портов при запуске с опубликованными портами

### Ошибки "Permission denied"

Stage2-хук контейнера снижает привилегии до непривилегированного пользователя `hermes` (UID 10000) через `s6-setuidgid`. Если ваш `~/.hermes/` на хосте принадлежит другому UID, установите `HERMES_UID`/`HERMES_GID` (или их алиасы `PUID`/`PGID`) для совпадения с пользователем хоста:

```bash
docker run -d \
  --name hermes \
  -e PUID=1000 -e PGID=10 \
  -v /volume1/docker/hermes:/opt/data \
  nousresearch/hermes-agent gateway run
```

На NAS (UGOS, Synology, unRAID) директория данных обычно является bind mount, принадлежащим UID хоста, который контейнер не может `chown`. Установите `PUID`/`PGID` (или `HERMES_UID`/`HERMES_GID`) на этого пользователя хоста.

### Инструменты браузера не работают

Playwright требует разделяемой памяти. Добавьте `--shm-size=1g`:

```bash
docker run -d \
  --name hermes \
  --shm-size=1g \
  -v ~/.hermes:/opt/data \
  nousresearch/hermes-agent gateway run
```

### Gateway не переподключается после сетевых проблем

Флаг `--restart unless-stopped` обрабатывает большинство временных сбоев. Если gateway застрял, перезапустите контейнер:

```bash
docker restart hermes
```

### Проверка состояния контейнера

```bash
docker logs --tail 50 hermes
docker run -it --rm nousresearch/hermes-agent:latest version
docker stats hermes
```
