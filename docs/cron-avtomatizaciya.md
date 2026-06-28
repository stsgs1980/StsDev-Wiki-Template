---
title: "Cron автоматизация"
section: "Cron автоматизация"
sectionOrder: 140
order: 1
slug: "cron-avtomatizaciya"
---

# Hermes Agent: Cron-автоматизация

**Версия документа:** 1.0  
**Дата:** 2026-06-28  
**Источник:** Официальная документация Hermes Agent

---

## 1. Обзор

Cron-подсистема Hermes Agent позволяет запускать задачи по расписанию в изолированных сессиях агента. Задачи могут быть одноразовыми или повторяющимися, запускаться с привязкой к скиллам и доставлять результаты на различные платформы.

**Ключевые возможности:**
- Одноразовые и повторяющиеся задачи
- Пауза, возобновление, редактирование, принудительный запуск и удаление
- Привязка скиллов (одного или нескольких)
- Доставка результатов на платформы (Telegram, Discord, Slack, Email и др.)
- Режим без агента (только выполнение скриптов)
- Цепочки задач с передачей контекста

---

## 2. Создание задач

### 2.1. Через slash-команду

```
/cron add "Ежедневно в 9:00 проверяй статус деплоя и отчитывайся в Telegram"
```

### 2.2. Через CLI

```bash
hermes cron create --prompt "Каждый час проверяй использование CPU" --schedule "every 1h"
hermes cron create --prompt "Отправь отчёт каждую пятницу" --schedule "0 17 * * 5" --delivery telegram
```

### 2.3. Естественный язык в чате

```
Настрой cron: каждые 30 минут проверяй логи на ошибки и присылай отчёт, если ошибки найдены
```

---

## 3. Привязка скиллов

### 3.1. Один скилл

```bash
hermes cron create --prompt "Выполни мониторинг" --skill monitoring --schedule "every 15m"
```

### 3.2. Несколько скиллов

```bash
hermes cron create --prompt "Сгенерируй отчёт" --skill git-stats --skill code-quality --schedule "daily"
```

При запуске задачи все привязанные скиллы автоматически загружаются в контекст сессии агента.

---

## 4. Рабочая директория

Флаг `--workdir` задаёт директорию, в которой выполняется задача:

```bash
hermes cron create --prompt "Запусти тесты" --schedule "0 8 * * 1-5" --workdir "/home/user/project"
```

По умолчанию используется домашняя директория пользователя.

---

## 5. Редактирование задач

### 5.1. Через slash-команду

```
/cron edit <job-id> --prompt "Новый промпт задачи"
/cron edit <job-id> --schedule "every 2h"
/cron edit <job-id> --delivery discord
```

### 5.2. Через CLI

```bash
hermes cron edit <job-id> --prompt "Обновлённая инструкция" --schedule "0 */3 * * *"
hermes cron edit <job-id> --no-delivery  # отключить доставку
```

---

## 6. Управление жизненным циклом

### 6.1. Список задач

```
/cron list
```

```bash
hermes cron list
hermes cron list --active    # только активные
hermes cron list --paused    # только на паузе
```

### 6.2. Пауза

```
/cron pause <job-id>
```

```bash
hermes cron pause <job-id>
```

### 6.3. Возобновление

```
/cron resume <job-id>
```

```bash
hermes cron resume <job-id>
```

### 6.4. Принудительный запуск

```
/cron run <job-id>
```

```bash
hermes cron run <job-id>
```

### 6.5. Удаление

```
/cron remove <job-id>
```

```bash
hermes cron remove <job-id>
```

---

## 7. Как работает планировщик

### 7.1. Архитектура

```
Gateway тик → планировщик проверяет jobs.json
    → создание новой сессии агента (без истории)
    → инжект прикреплённых скиллов
    → выполнение промпта задачи
    → доставка ответа на целевую платформу
    → обновление состояния задачи и next_run
```

### 7.2. Механизм

- **Gateway тик:** каждые 60 секунд планировщик проверяет список задач
- **Изолированные сессии:** каждое выполнение создаёт новый экземпляр агента без истории предыдущих запусков
- **Состояние:** задачи хранятся в `~/.hermes/cron/jobs.json`
- **Вывод:** результаты выполнения сохраняются в `~/.hermes/cron/output/`

---

## 8. Доставка результатов

### 8.1. Платформы доставки

| Платформа | Описание |
|---|---|
| `origin` | Отправить в ту же платформу, откуда была создана задача |
| `local` | Сохранить локально (в stdout/файл) |
| `telegram` | Telegram |
| `discord` | Discord |
| `slack` | Slack |
| `email` | Email |
| `all` | Все подключённые платформы |

### 8.2. Примеры

```bash
hermes cron create --prompt "Отчёт" --schedule "daily" --delivery telegram
hermes cron create --prompt "Логи" --schedule "every 1h" --delivery email
hermes cron create --prompt "Статус" --schedule "*/30 * * * *" --delivery origin
```

### 8.3. Настройка доставки

```bash
hermes cron edit <job-id> --delivery slack
hermes cron edit <job-id> --no-delivery  # отключить доставку
```

---

## 9. Обёртка ответов и подавление тишины

### 9.1. Обёртка ответов

Ответы cron-задач автоматически оборачиваются в заголовок с информацией о задаче и времени выполнения:

```
[Cron: <job-name>]
[Выполнено: 2026-06-28 10:00:00]

<содержимое ответа>
```

### 9.2. Подавление тишины

Если ответ агента содержит маркер `[SILENT]`, задача не отправляет уведомление:

```
Проверка логов завершена. Ошибок не найдено.
[SILENT]
```

Это полезно для задач, которые должны уведомлять только при наличии проблем.

---

## 10. Continuable jobs (mirror_delivery)

Флаг `--mirror_delivery` позволяет создавать задачи, которые продолжают диалог в той же сессии платформы:

```bash
hermes cron create --prompt "Продолжи анализ кода" --schedule "0 10 * * 1" --mirror_delivery
```

Задача будет отправлять сообщения в ту же беседу, из которой была создана, поддерживая контекст диалога.

---

## 11. Режим без агента (script-only jobs)

Для задач, которые не требуют LLM, используется флаг `--no-agent`:

### 11.1. Простой скрипт

```bash
hermes cron create --no-agent --script "python /scripts/backup.py" --schedule "0 2 * * *"
```

### 11.2. Агент с пробуждением

```bash
hermes cron create --no-agent --script "check_disk_space.sh" --wakeAgent --schedule "every 6h"
```

Параметр `--wakeAgent` активирует агента только если скрипт обнаружил проблему (нестандартный выходной код).

---

## 12. Цепочки задач (context_from)

Задачи могут использовать результат предыдущей задачи как входные данные:

```bash
# Задача 1: сбор данных
hermes cron create --prompt "Собери статистику за день" --name "collect-stats" --schedule "0 23 * * *"

# Задача 2: формирование отчёта на основе данных из задачи 1
hermes cron create --prompt "Сформируй отчёт на основе полученных данных" --name "daily-report" --schedule "0 0 * * *" --context_from "collect-stats"
```

---

## 13. Восстановление провайдеров (provider recovery)

### 13.1. Fallback-провайдеры

Cron-задачи поддерживают автоматическое переключение между провайдерами при сбоях:

```yaml
# ~/.hermes/config.yaml
cron:
  providers:
    - name: openai
      priority: 1
    - name: anthropic
      priority: 2
    - name: local
      priority: 3
```

### 13.2. Пулы учётных данных

Для одного провайдера можно настроить несколько учётных записей:

```yaml
cron:
  credential_pools:
    openai:
      - api_key: "sk-1..."
        weight: 1
      - api_key: "sk-2..."
        weight: 1
```

---

## 14. Форматы расписания

### 14.1. Относительные задержки

```bash
--schedule "in 30 minutes"
--schedule "in 2 hours"
--schedule "tomorrow at 9am"
```

### 14.2. Интервалы

```bash
--schedule "every 15 minutes"
--schedule "every 2 hours"
--schedule "every day"
--schedule "every monday"
```

### 14.3. Cron-выражения

```bash
--schedule "0 9 * * 1-5"        # Будни в 9:00
--schedule "0 */3 * * *"        # Каждые 3 часа
--schedule "0 0 1 * *"          # Первое число каждого месяца
--schedule "30 18 * * 5"        # Пятница в 18:30
```

### 14.4. ISO-таймстемпы

```bash
--schedule "2026-07-01T10:00:00Z"
--schedule "2026-12-31T23:59:59+03:00"
```

---

## 15. Поведение повторений

### 15.1. One-shot задачи

Одноразовые задачи удаляются после выполнения:

```bash
hermes cron create --prompt "Отправь напоминание" --schedule "in 1 hour" --once
```

### 15.2. Recurring задачи

Повторяющиеся задачи остаются в системе и перезапускаются по расписанию:

```bash
hermes cron create --prompt "Проверь статус" --schedule "every 6h"
```

### 15.3. Ограничение повторений

```bash
hermes cron create --prompt "Проверка" --schedule "every 5m" --max-runs 10
```

---

## 16. Инструменты доступные cron-задачам

Cron-задачи имеют доступ к тем же инструментам, что и обычные сессии агента:

| Инструмент | Описание |
|---|---|
| `terminal` | Выполнение команд ОС |
| `read_file` / `write_file` | Работа с файлами |
| `web_search` / `web_extract` | Веб-поиск и извлечение данных |
| `memory` | Управление памятью агента |
| `skill_view` | Просмотр скиллов |
| MCP-инструменты | Подключённые MCP-серверы |

**Ограничения:**
- Нет доступа к интерактивному вводу
- Ограниченное время выполнения (по умолчанию 300 секунд)
- Результат автоматически доставляется на платформу

---

## 17. Хранение задач

### 17.1. Структура файлов

```
~/.hermes/cron/
├── jobs.json          # Реестр всех задач
├── output/            # Результаты выполнения
│   ├── <job-id>/
│   │   ├── <timestamp>.json
│   │   └── <timestamp>.json
│   └── ...
└── logs/              # Логи выполнения
```

### 17.2. Формат jobs.json

```json
{
  "jobs": {
    "abc123": {
      "id": "abc123",
      "name": "daily-report",
      "prompt": "Сформируй ежедневный отчёт",
      "schedule": "0 9 * * *",
      "next_run": "2026-06-29T09:00:00Z",
      "delivery": "telegram",
      "skills": ["git-stats"],
      "workdir": "/home/user/project",
      "active": true,
      "created_at": "2026-06-28T10:00:00Z",
      "last_run": "2026-06-28T09:00:00Z",
      "run_count": 5
    }
  }
}
```

### 17.3. Ручное редактирование

Файл `jobs.json` можно редактировать вручную при остановленном gateway:

```bash
hermes gateway stop
# Редактирование ~/.hermes/cron/jobs.json
hermes gateway start
```

---

## 18. Практические примеры

### 18.1. Мониторинг сервера

```bash
hermes cron create \
  --prompt "Проверь использование CPU, RAM и диска. Если CPU > 90% или RAM > 85%, отправь алерт." \
  --schedule "every 5m" \
  --delivery telegram \
  --workdir "/var/log"
```

### 18.2. Автоматический бэкап

```bash
hermes cron create \
  --no-agent \
  --script "tar -czf /backups/db-$(date +%Y%m%d).sql.gz /data/db && aws s3 cp /backups/db-$(date +%Y%m%d).sql.gz s3://my-bucket/backups/" \
  --schedule "0 3 * * *" \
  --delivery email
```

### 18.3. Генерация еженедельного отчёта

```bash
hermes cron create \
  --prompt "Проанализируй git-коммиты за неделю, собери статистику по авторам и файлам, сформируй markdown-отчёт." \
  --skill git-stats \
  --schedule "0 18 * * 5" \
  --delivery slack \
  --workdir "/home/user/project"
```

### 18.4. Цепочка задач

```bash
# Шаг 1: Сбор данных
hermes cron create \
  --prompt "Собери метрики из Prometheus за последний час" \
  --name "collect-metrics" \
  --schedule "every 1h"

# Шаг 2: Анализ на основе собранных данных
hermes cron create \
  --prompt "Проанализируй собранные метрики, выяви аномалии, сформируй отчёт." \
  --name "analyze-metrics" \
  --schedule "every 1h" \
  --context_from "collect-metrics" \
  --delivery telegram
```

---

## 19. Диагностика

### 19.1. Просмотр логов

```bash
hermes cron logs <job-id>
hermes cron logs <job-id> --last 10  # последние 10 запусков
```

### 19.2. Проверка состояния

```bash
hermes cron status <job-id>
```

### 19.3. Тестовый запуск

```bash
hermes cron run <job-id> --dry-run  # проверка без реального выполнения
```

---

## 20. Ограничения

| Параметр | Значение по умолчанию | Описание |
|---|---|---|
| `max_concurrent` | 3 | Максимальное количество одновременных задач |
| `timeout` | 300 сек | Время выполнения одной задачи |
| `tick_interval` | 60 сек | Интервал проверки планировщиком |
| `max_output_size` | 10 КБ | Максимальный размер вывода задачи |
| `max_jobs` | 100 | Максимальное количество задач |

Настройка параметров:

```yaml
# ~/.hermes/config.yaml
cron:
  max_concurrent: 5
  timeout: 600
  tick_interval: 30
  max_output_size: 51200
  max_jobs: 200
```

---

## 21. Ссылки

- **Документация:** https://hermes-agent.nousresearch.com/docs/user-guide/features/cron
- **Исходный код:** https://github.com/NousResearch/hermes-agent/tree/main/cron
- **Discord:** https://discord.gg/NousResearch