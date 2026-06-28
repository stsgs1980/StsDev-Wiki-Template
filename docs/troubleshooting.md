---
title: "Troubleshooting Hermes Agent"
section: "Troubleshooting"
sectionOrder: 50
order: 1
slug: "troubleshooting"
---

# Troubleshooting Hermes Agent

**Версия документа:** 1.0
**Дата:** 2026-06-28
**Источник:** https://hermes-agent.nousresearch.com/docs/reference/faq

---

## 1. Диагностика

### 1.1. Базовая проверка

```powershell
hermes doctor    # Проверить систему и найти проблемы
hermes --version # Проверить версию
hermes config    # Показать конфигурацию
```

### 1.2. Логи

```
%LOCALAPPDATA%\hermes\logs\
├── errors.log      # Ошибки
├── gateway.log     # Лог gateway
└── agent.log       # Лог агента
```

---

## 2. Установка и PATH

### 2.1. `hermes: command not found`

**Причина:** PATH не обновился после установки.

**Решение:**
```powershell
# Открыть НОВОЕ окно PowerShell
# Или проверить:
Get-Command hermes

# Если не найден — добавить в PATH вручную:
$env:PATH += ";$env:LOCALAPPDATA\hermes\hermes-agent\venv\Scripts"
```

### 2.2. `WinError 193: %1 is not a valid Win32 application`

**Причина:** Обращение к shebang-скрипту вместо .cmd shim.

**Решение:** Использовать `.cmd` варианты:
```powershell
npx.cmd install chromium    # Вместо npx install chromium
```

### 2.3. `[scriptblock]::Create(...)` fails

**Причина:** UTF-8 BOM в скачанном install.ps1.

**Решение:** Использовать простую форму:
```powershell
iex (irm https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.ps1)
```

---

## 3. Конфигурация

### 3.1. `API key not set`

**Причина:** Не настроен провайдер.

**Решение:**
```powershell
hermes setup --portal    # Быстрая настройка через Nous Portal
# Или вручную:
hermes config set OPENROUTER_API_KEY sk-or-...
```

### 3.2. `Missing config after update`

**Решение:**
```powershell
hermes config check
hermes config migrate
```

### 3.3. Модель не работает

**Проверка:**
```powershell
hermes model    # Проверить выбранную модель
hermes config   # Проверить конфигурацию
```

---

## 4. Терминал и кодировка

### 4.1. `UnicodeEncodeError: 'charmap' codec can't encode character`

**Причина:** Консоль не поддерживает UTF-8.

**Решение:** Использовать Windows Terminal (не legacy cmd.exe).

Проверка:
```powershell
# Проверить что UTF-8 включён
[Console]::OutputEncoding.EncodingName
# Должно быть: Unicode (UTF-8)
```

### 4.2. Китайские/японские символы отображаются как `?`

**Причина:** UTF-8 shim не активировался.

**Решение:**
```powershell
# Проверить что HERMES_DISABLE_WINDOWS_UTF8 НЕ установлен
Get-ChildItem env:HERMES_DISABLE_WINDOWS_UTF8
```

### 4.3. `/edit` не работает

**Причина:** Не установлен редактор.

**Решение:**
```powershell
# PowerShell (временно)
$env:EDITOR = "code --wait"

# Или permaneнtно в System Properties → Environment Variables
```

---

## 5. Browser Tool

### 5.1. Browser tool не запускается

**Причина:** Chromium не установлен.

**Решение:**
```powershell
hermes doctor    # Покажет проблему и решение
npx.cmd playwright install chromium
```

### 5.2. Browser tool timeout

**Причина:** Chromium не установлен или старый Node.js в PATH.

**Решение:**
```powershell
# Проверить Node.js версию
node --version    # Должно быть 22+

# Если старый — удалить или переместить Hermes node выше в PATH
```

### 5.3. `agent-browser` fails with Node version error

**Причина:** Системный Node.js 18 вместо Hermes Node.js 22.

**Решение:** Удалить системный Node или переместить `%LOCALAPPDATA%\hermes\node` выше в PATH.

---

## 6. Gateway

### 6.1. Gateway не запускается

```powershell
hermes gateway status    # Проверить статус
hermes gateway start     # Запустить
```

### 6.2. Gateway падает после перезагрузки

**Причина:** schtasks может быть заблокирован group policy.

**Решение:**
```powershell
# Проверить задачу
schtasks /Query /TN HermesGateway /V /FO LIST

# Переустановить с startup folder fallback
hermes gateway uninstall
$env:HERMES_GATEWAY_FORCE_STARTUP=1
hermes gateway install
```

### 6.3. Gateway не отправляет фото в Telegram

**Причина:** Некорректные пути в JSON.

**Решение:** Убедиться что пути нормализованы (не raw Windows paths).

---

## 7. Docker backend

### 7.1. Docker не найден

```powershell
docker version    # Проверить Docker
```

**Решение:** Установить Docker Desktop или переключиться на local backend:
```powershell
hermes config set terminal.backend local
```

### 7.2. Контейнер не создается

**Проверка:**
```powershell
docker ps -a    # Посмотреть все контейнеры
docker logs <container_id>    # Логи контейнера
```

### 7.3. Файлы принадлежат root

**Решение:** Включить `docker_run_as_host_user`:
```yaml
terminal:
  docker_run_as_host_user: true
```

---

## 8. SSH backend

### 8.1. SSH подключение не работает

**Проверка:**
```powershell
# Обязательные переменные
$env:TERMINAL_SSH_HOST = "my-server.example.com"
$env:TERMINAL_SSH_USER = "ubuntu"

# Тест подключения
ssh $env:TERMINAL_SSH_USER@$env:TERMINAL_SSH_HOST
```

### 8.2. Persistent shell не работает

**Решение:**
```yaml
terminal:
  persistent_shell: true
```

---

## 9. Скиллы

### 9.1. Скиллы не загружаются

**Проверка:**
```powershell
hermes skills list    # Список установленных скиллов
```

### 9.2. Skills Hub недоступен

**Причина:** GitHub rate limit.

**Решение:** Установить `GITHUB_TOKEN` в `.env`:
```bash
GITHUB_TOKEN=ghp_...
```

---

## 10. Память

### 10.1. Память не работает

**Проверка:**
```yaml
memory:
  memory_enabled: true
  user_profile_enabled: true
```

### 10.2. Записи не сохраняются

**Причина:** Включён `write_approval`.

**Решение:**
```powershell
/memory pending    # Проверить ожидающие записи
/memory approve <id>    # Подтвердить
```

---

## 11. Производительность

### 11.1. Медленные ответы

**Причины:**
- Длинный контекст → `/compress`
- Медленная модель → сменить модель
- Сетевые проблемы → проверить подключение

### 11.2. Много токенов

**Причины:**
- Длинные tool outputs → настроить `tool_output.max_bytes`
- Много скиллов → отключить неиспользуемые
- Длинные контекстные файлы → уменьшить `context_file_max_chars`

---

## 12. Обновление

### 12.1. `hermes update` не работает

**Решение:**
```powershell
hermes config check
hermes config migrate
```

### 12.2. Проблемы после обновления

**Решение:**
```powershell
hermes config check    # Проверить缺失ные опции
hermes config migrate  # Интерактивно добавить
```

---

## 13. Полезные команды

```powershell
# Диагностика
hermes doctor
hermes --version
hermes config

# Конфигурация
hermes setup
hermes model
hermes tools

# Сессии
hermes sessions list
hermes -c    # Продолжить последнюю

# Gateway
hermes gateway status
hermes gateway start
hermes gateway stop

# Скиллы
hermes skills list
hermes skills browse

# Обновление
hermes update

# Удаление
hermes uninstall
```

---

## 14. Ссылки

- **FAQ:** https://hermes-agent.nousresearch.com/docs/reference/faq
- **Windows Guide:** https://hermes-agent.nousresearch.com/docs/user-guide/windows-native
- **Discord:** https://discord.gg/NousResearch
- **GitHub Issues:** https://github.com/NousResearch/hermes-agent/issues
