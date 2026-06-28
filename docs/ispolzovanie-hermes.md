---
title: "Использование Hermes Agent"
section: "Использование"
sectionOrder: 40
order: 1
slug: "ispolzovanie-hermes"
---

# Использование Hermes Agent

**Версия документа:** 1.0
**Дата:** 2026-06-28
**Источник:** https://hermes-agent.nousresearch.com/docs/user-guide/cli

---

## 1. CLI интерфейс

### 1.1. Запуск

```powershell
# Интерактивный режим (по умолчанию)
hermes

# Один запрос
hermes chat -q "Привет"

# С конкретной моделью
hermes chat --model "anthropic/claude-sonnet-4"

# С конкретным провайдером
hermes chat --provider nous
hermes chat --provider openrouter

# С набором инструментов
hermes chat --toolsets "web,terminal,skills"

# С предзагруженными скиллами
hermes -s hermes-agent-dev,github-auth
hermes chat -s github-pr-workflow -q "открой PR"

# Продолжить последнюю сессию
hermes --continue
hermes -c

# Продолжить конкретную сессию
hermes --resume 20260225_143052_a1b2c3
hermes -r 20260225_143052_a1b2c3
```

### 1.2. Горячие клавиши

| Клавиша | Действие |
|---|---|
| `Enter` | Отправить сообщение |
| `Alt+Enter` / `Ctrl+J` / `Shift+Enter` | Новая строка |
| `Ctrl+V` | Вставить текст |
| `Alt+V` | Вставить изображение из буфера |
| `Ctrl+B` | Начать/остановить запись голоса |
| `Ctrl+G` | Открыть редактор ($EDITOR) |
| `Ctrl+C` | Прервать агента (2x для выхода) |
| `Ctrl+D` | Выход |
| `Tab` | Автодополнение |

**Windows:** `Ctrl+Enter` вместо `Alt+Enter` (Alt+Enter = fullscreen в Windows Terminal).

### 1.3. Slash-команды

| Команда | Описание |
|---|---|
| `/help` | Справка |
| `/model` | Показать/сменить модель |
| `/tools` | Доступные инструменты |
| `/skills browse` | Просмотр скиллов |
| `/background <prompt>` | Фоновая задача |
| `/skin` | Переключить тему |
| `/voice on` | Включить голос |
| `/reasoning high` | Увеличить reasoning |
| `/title Моя сессия` | Назвать сессию |
| `/status` | Инфо о сессии |
| `/sessions` | Выбор сессии |
| `/compress` | Ручное сжатие |
| `/new` | Новая сессия |
| `/reset` | Сбросить сессию |

### 1.4. Многострочный ввод

1. `Alt+Enter` / `Ctrl+J` / `Shift+Enter` — новая строка
2. Обратный слэш — продолжение строки:
```
Напиши функцию которая:
  1. Принимает список чисел
  2. Возвращает сумму
```

---

## 2. Сессии

### 2.1. Управление сессиями

```powershell
hermes sessions list                    # Список сессий
hermes sessions rename <id> <title>     # Переименовать
```

Внутри чата:
```
/title Моя сессия
/sessions
```

### 2.2. Хранение

Сессии хранятся в SQLite (`%LOCALAPPDATA%\hermes\state.db`):
- Метаданные (ID, название, таймстемпы, токены)
- История сообщений
- Lineage через сжатие
- Полнотекстовый поиск (FTS5)

### 2.3. Сжатие контекста

Длинные разговоры автоматически суммаризируются:
- Порог: 50% контекста (по умолчанию)
- Сохраняются: первые 3 + последние 20 сообщений
- Остальное суммаризируется

---

## 3. Скиллы

### 3.1. Вызов скиллов

```
/gif-search смешные котики
/axolotl помоги дообучить Llama 3
/github-pr-workflow создай PR для auth refactor
```

### 3.2. Просмотр скиллов

```
/hermes skills browse
/hermes skills search kubernetes
/hermes skills install openai/skills/k8s
```

### 3.3. Создание скиллов

```
/learn как я только что развернул staging сервер
/learn REST клиент в ~/projects/acme-sdk, фокус на auth + pagination
```

### 3.4. Бандлы скиллов

```powershell
hermes bundles create backend-dev \
  --skill github-code-review \
  --skill test-driven-development \
  --skill github-pr-workflow
```

```
/backend-dev рефактори auth middleware
```

---

## 4. Память

### 4.1. Автоматическое запоминание

Агент автоматически сохраняет:
- Предпочтения пользователя
- Факты об окружении
- Исправления и уроки
- Завершённую работу

### 4.2. Ручное управление

Через tool `memory`:
```
memory(action="add", target="memory", content="Проект на Rust в ~/code/myapi")
memory(action="replace", target="memory", old_text="dark mode", content="light mode")
memory(action="remove", target="memory", old_text="dark mode")
```

### 4.3. Поиск по сессиям

```
session_search(query="docker deployment")
```

---

## 5. Gateway (мессенджеры)

### 5.1. Установка

```powershell
hermes gateway setup    # Настроить платформы
hermes gateway install  # Автозапуск при входе
hermes gateway start    # Запустить
hermes gateway stop     # Остановить
hermes gateway status   # Статус
```

### 5.2. Подключение платформ

| Платформа | Как настроить |
|---|---|
| Telegram | `hermes gateway setup` → Bot Token |
| Discord | `hermes gateway setup` → Bot Token |
| Slack | `hermes gateway setup` → App Token |
| WhatsApp | `hermes gateway setup` |
| Signal | `hermes gateway setup` |
| Matrix | `hermes gateway setup` |

### 5.3. Использование

После настройки пишете боту в мессенджере — Hermes отвечает. Все сессии, память и скиллы общие с CLI.

---

## 6. Cron (запланированные задачи)

### 6.1. Создание задачи

```
/cron add "0 9 * * *" "Проверь новости AI и отправь дайджест" --platform telegram
```

### 6.2. Управление

```
/cron list
/cron pause <id>
/cron resume <id>
/cron remove <id>
```

---

## 7. Голосовой режим

### 7.1. Включение

```
/voice on
```

### 7.2. Запись

`Ctrl+B` — начать/остановить запись.

### 7.3. Озвучка ответов

```
/voice tts
```

---

## 8. Личности (Personalities)

```
/personality pirate
/personality kawaii
/personality concise
/personality technical
/personality creative
```

Встроенные: `helpful`, `concise`, `technical`, `creative`, `teacher`, `kawaii`, `catgirl`, `pirate`, `shakespeare`, `surfer`, `noir`, `uwu`, `philosopher`, `hype`.

---

## 9. Фоновые задачи

```
/background Проанализируй логи в /var/log и_SUMMARY_и_ошибки_за_сегодня
```

- Изолированная сессия (без контекста текущего чата)
- Та же конфигурация (модель, инструменты)
- Неблокирующий — можно продолжать работу
- Результат появляется панелью в терминале

---

## 10. Quick Commands

```yaml
# config.yaml
quick_commands:
  status:
    type: exec
    command: systemctl status hermes-agent
  gpu:
    type: exec
    command: nvidia-smi --query-gpu=utilization.gpu,memory.used --format=csv,noheader
  restart:
    type: alias
    target: /gateway restart
```

---

## 11. TUI (расширенный интерфейс)

```powershell
hermes --tui
```

- Модальные оверлеи
- Выделение мышью
- Non-blocking ввод

---

## 12. Desktop App

```powershell
hermes desktop
```

GUI-приложение с тем же функционалом.

---

## 13. Ссылки

- **CLI Reference:** https://hermes-agent.nousresearch.com/docs/reference/cli-commands
- **Slash Commands:** https://hermes-agent.nousresearch.com/docs/reference/slash-commands
- **TUI:** https://hermes-agent.nousresearch.com/docs/user-guide/tui
- **Desktop:** https://hermes-agent.nousresearch.com/docs/user-guide/desktop
