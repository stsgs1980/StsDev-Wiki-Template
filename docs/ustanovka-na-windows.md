---
title: "Установка Hermes Agent на Windows"
section: "Установка"
sectionOrder: 20
order: 1
slug: "ustanovka-na-windows"
---

# Установка Hermes Agent на Windows

**Версия документа:** 1.1
**Дата:** 2026-06-28
**Источник:** https://hermes-agent.nousresearch.com/docs/getting-started/installation

---

## 1. Обзор

Windows 10/11 — Tier 1 платформа для Hermes Agent. Два варианта установки:

| Вариант | Для кого | Преимущества |
|---|---|---|
| **Desktop Installer** | Начинающие, не-разработчики | GUI, установка одним кликом |
| **PowerShell** | Разработчики | Гибкость, контроль, автоматизация |

WSL2 не требуется — Hermes работает нативно на Windows.

---

## 2. Вариант 1: Desktop Installer (рекомендуется)

### 2.1. Скачивание

1. Перейти на https://hermes-agent.nousresearch.com
2. Скачать Windows Installer (.exe)
3. Запустить установщик

### 2.2. Что делает установщик

Автоматически:
1. Устанавливает `uv` (менеджер Python) в `%USERPROFILE%\.local\bin`
2. Устанавливает Python 3.11 через uv
3. Устанавливает Node.js 22 (для browser tool)
4. Устанавливает PortableGit (~45 MB, без admin прав)
5. Клонирует репозиторий в `%LOCALAPPDATA%\hermes\hermes-agent`
6. Создаёт виртуальное окружение и ставит зависимости
7. Добавляет `hermes` в User PATH
8. Запускает `hermes setup` (мастер настройки)

### 2.3. После установки

```powershell
# Открыть НОВОЕ окно PowerShell
hermes --version    # Проверить установку
hermes setup        # Настроить провайдер и модель
```

---

## 3. Вариант 2: PowerShell

### 3.1. Быстрая установка

Открыть PowerShell и выполнить:

```powershell
iex (irm https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.ps1)
```

### 3.2. Установка с параметрами

```powershell
& ([scriptblock]::Create((irm https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.ps1))) -SkipSetup -Branch main
```

**Параметры:**

| Параметр | По умолчанию | Описание |
|---|---|---|
| `-Branch` | `main` | Ветка для клонирования |
| `-Commit` | - | Конкретный коммит (SHA) |
| `-Tag` | - | Тег (например, `v0.14.0`) |
| `-NoVenv` | off | Пропустить создание venv |
| `-SkipSetup` | off | Пропустить `hermes setup` |
| `-HermesHome` | `%LOCALAPPDATA%\hermes` | Директория данных |
| `-InstallDir` | `%LOCALAPPDATA%\hermes\hermes-agent` | Директория кода |

### 3.3. Что делает установщик (детально)

1. **Bootstrap uv** — быстрый Python менеджер
2. **Python 3.11** — через uv, без существующего Python
3. **Node.js 22** — winget или portable tarball
4. **PortableGit** — если git не найден в PATH
5. **Клонирование** — `git clone` в `%LOCALAPPDATA%\hermes\hermes-agent`
6. **Tiered pip install** — `.[all]` → fallback на меньшие наборы
7. **Auto-install messaging SDKs** — если найдены токены в .env
8. **HERMES_GIT_BASH_PATH** — путь к bash.exe
9. **User PATH** — добавление `venv\Scripts`
10. **hermes setup** — первый запуск мастера

---

## 4. Структура файлов

### 4.1. Где что лежит

| Путь | Содержимое |
|---|---|
| `%LOCALAPPDATA%\hermes\hermes-agent\` | Git checkout + venv |
| `%LOCALAPPDATA%\hermes\git\` | PortableGit (если установлен) |
| `%LOCALAPPDATA%\hermes\node\` | Portable Node.js (если установлен) |
| `%LOCALAPPDATA%\hermes\bin\` | uv.exe |
| `%LOCALAPPDATA%\hermes\` (корень) | Конфиг, сессии, скиллы, логи |

### 4.2. Директория данных (HERMES_HOME)

```
%LOCALAPPDATA%\hermes\
├── config.yaml          # Конфигурация
├── .env                 # API ключи
├── state.db             # SQLite хранилище сессий
├── memories/
│   ├── MEMORY.md        # Память агента
│   └── USER.md          # Профиль пользователя
├── skills/              # Установленные скиллы
├── sessions/            # Сессии (legacy)
├── plugins/             # Плагины
├── skill-bundles/       # Бандлы скиллов
├── logs/                # Логи
└── pending/             # Ожидающие записи (memory, skills)
```

### 4.3. Важно

- **Не удаляйте** `%LOCALAPPDATA%\hermes` целиком — только `hermes-agent\` поддиректорию
- Данные выживают при переустановке (config, skills, sessions)
- Директория данных идентична Linux `~/.hermes`

---

## 5. PATH и переменные окружения

### 5.1. PATH после установки

Установщик добавляет в User PATH:
```
%LOCALAPPDATA%\hermes\hermes-agent\venv\Scripts
```

**Проверка:**
```powershell
Get-Command hermes
# Должно вывести: C:\Users\<you>\AppData\Local\hermes\hermes-agent\venv\Scripts\hermes.exe
```

**Важно:** Открыть НОВОЕ окно PowerShell после установки.

### 5.2. Windows-specific env variables

| Переменная | Эффект |
|---|---|
| `HERMES_GIT_BASH_PATH` | Путь к bash.exe (устанавливается автоматически) |
| `HERMES_DISABLE_WINDOWS_UTF8` | `1` — отключить UTF-8 shim |
| `EDITOR` / `VISUAL` | Редактор для `/edit` (по умолчанию: notepad) |
| `HERMES_HOME` | Директория данных (по умолчанию: `%LOCALAPPDATA%\hermes`) |

### 5.3. API ключи

Хранятся в `%LOCALAPPDATA%\hermes\.env`:

```bash
OPENROUTER_API_KEY=sk-or-...
TELEGRAM_BOT_TOKEN=...
DISCORD_BOT_TOKEN=...
```

**Не используйте** User environment variables для секретов — они видны всем процессам Windows.

---

## 6. Feature Matrix

| Функция | Native Windows |
|---|---|
| CLI (`hermes chat`, `hermes setup`, `hermes gateway`) | Да |
| Interactive TUI (`hermes --tui`) | Да |
| Messaging gateway (Telegram, Discord...) | Да |
| Cron scheduler | Да |
| Browser tool (Chromium via Node) | Да |
| MCP servers (stdio и HTTP) | Да |
| Local Ollama / LM Studio | Да |
| Web dashboard | Да |
| Dashboard `/chat` terminal pane | Нет (требует POSIX PTY) |
| Auto-start at login | Да (schtasks) |

---

## 7. Browser Tool

### 7.1. Установка

Browser tool использует `agent-browser` (Node helper) для управления Chromium.

```powershell
# Автоматически устанавливается при первом использовании
# Или вручную:
npx playwright install chromium
```

### 7.2. Проверка

```powershell
hermes doctor
# Покажет статус browser tool и исправления
```

### 7.3. Проблемы

| Проблема | Решение |
|---|---|
| Chromium не установлен | `npx playwright install chromium` |
| Старый Node.js в PATH | Удалить или переместить Hermes node выше |
| Timeout при запуске | Проверить `hermes doctor` |

---

## 8. Gateway на Windows

### 8.1. Установка автозапуска

```powershell
hermes gateway install
```

**Что происходит:**
1. `schtasks /Create /SC ONLOGON /RL LIMITED /TN HermesGateway`
2. Fallback: ярлык в `%APPDATA%\...\Startup`
3. Gateway запускается через `pythonw.exe` (без консоли)

### 8.2. Управление

```powershell
hermes gateway status     # Статус
hermes gateway start      # Запустить
hermes gateway stop       # Остановить
hermes gateway restart    # Перезапустить
hermes gateway uninstall  # Удалить автозапуск
```

### 8.3. Почему не Windows Service

- Services требуют admin прав
- Привязаны к boot, а не к login
- Scheduled Tasks: login → gateway available, logout → gateway gone

---

## 9. Консоль и кодировка

### 9.1. UTF-8

Hermes автоматически переключает консоль на UTF-8:
1. `SetConsoleCP(65001)` / `SetConsoleOutputCP(65001)`
2. `sys.stdout`/`sys.stderr` → UTF-8 с `errors='replace'`
3. `PYTHONIOENCODING=utf-8`, `PYTHONUTF8=1`

**Отключение:** `HERMES_DISABLE_WINDOWS_UTF8=1`

### 9.2. Редактор

По умолчанию `notepad`. Настройка:

```powershell
# VS Code
$env:EDITOR = "code --wait"

# Notepad++
$env:EDITOR = "'C:\Program Files\Notepad++\notepad++.exe' -multiInst -nosession"

# Neovim
$env:EDITOR = "nvim"
```

### 9.3. Многострочный ввод

- `Ctrl+Enter` — новая строка (Windows Terminal)
- `Esc Enter` — новая строка (legacy cmd.exe)

---

## 10. Обновление и удаление

### 10.1. Обновление

```powershell
hermes update
```

### 10.2. Удаление

```powershell
# Чистое удаление
hermes uninstall

# Полное удаление (включая данные)
hermes uninstall
Remove-Item -Recurse -Force "$env:LOCALAPPDATA\hermes"
```

---

## 11. Ссылки

- **Документация:** https://hermes-agent.nousresearch.com/docs
- **Windows Guide:** https://hermes-agent.nousresearch.com/docs/user-guide/windows-native
- **Troubleshooting:** https://hermes-agent.nousresearch.com/docs/reference/faq
