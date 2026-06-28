---
title: "Memory провайдеры"
section: "Memory провайдеры"
sectionOrder: 120
order: 1
slug: "memory-provaidery"
---

# DOC-012 Memory Providers

## Быстрый старт

```bash
hermes memory setup      # интерактивный выбор и настройка провайдера
hermes memory status     # проверка активного провайдера
hermes memory off        # отключение внешнего провайдера
```

Также можно выбрать провайдер через `hermes plugins` -> Provider Plugins -> Memory Provider.

Ручная настройка в `~/.hermes/config.yaml`:

```yaml
memory:
  provider: openviking   # honcho, mem0, hindsight, holographic, retaindb, byterover, supermemory, memori
```

## Принцип работы

При активном memory-провайдере Hermes автоматически:

1. **Инжектит контекст провайдера** в системный промпт
2. **Предзагружает релевантные воспоминания** перед каждым ходом (фоновый, неблокирующий режим)
3. **Синхронизирует ходы разговора** с провайдером после каждого ответа
4. **Извлекает воспоминания** при завершении сессии (для провайдеров с поддержкой)
5. **Зеркалит записи** встроенной памяти (MEMORY.md / USER.md) во внешний провайдер
6. **Добавляет инструменты** провайдера для поиска, хранения и управления памятью

Встроенная память продолжает работать как раньше. Внешний провайдер работает как дополнение.

**Важно:** Одновременно может быть активен только ОДИН внешний провайдер. Встроенная память всегда активна параллельно.

## Доступные провайдеры

### Honcho

AI-native модель кросс-сессионного моделирования пользователей с диалектическим рассуждением, контекстной инъекцией на уровне сессий, семантическим поиском и персистентными выводами.

**Лучше всего подходит:** Мультиагентные системы с кросс-сессионным контекстом, выравнивание user-agent.

**Зависимости:** `pip install honcho-ai` + API-ключ или self-hosted инстанс.

**Хранилище данных:** Honcho Cloud или self-hosted.

**Стоимость:** платно (cloud) / бесплатно (self-hosted).

**Инструменты (5):**
- `honcho_profile` -- чтение/обновление peer card
- `honcho_search` -- семантический поиск
- `honcho_context` -- контекст сессии (сводка, репрезентация, карта, сообщения)
- `honcho_reasoning` -- LLM-синтезированное рассуждение
- `honcho_conclude` -- создание/удаление выводов

**Архитектура:** Двухслойная контекстная инъекция. Базовый слой (сводка сессии + репрезентация + peer card) обновляется по `contextCadence`. Диалектический слой (LLM-рассуждение) обновляется по `dialecticCadence`. Диалектика автоматически выбирает cold-start промпты (общие факты о пользователе) или warm-промпты (контекст сессии) в зависимости от наличия базового контекста.

**Три независимых параметра конфигурации:**

- `contextCadence` -- частота обновления базового слоя
- `dialecticCadence` -- частота вызова диалектического LLM
- `dialecticDepth` -- количество проходов `.chat()` за вызов (1-3)

**Настройка:**

```bash
hermes memory setup        # выбор "honcho" -- запускает мастер настройки
```

**Конфигурация:** `$HERMES_HOME/honcho.json` (профиль-локальный) или `~/.honcho/config.json` (глобальный).

Минимальный `honcho.json` (облачный):

```json
{
  "apiKey": "your-key-from-app.honcho.dev",
  "hosts": {
    "hermes": {
      "enabled": true,
      "aiPeer": "hermes",
      "peerName": "your-name",
      "workspace": "hermes"
    }
  }
}
```

Минимальный `honcho.json` (self-hosted):

```json
{
  "baseUrl": "http://localhost:8000",
  "hosts": {
    "hermes": {
      "enabled": true,
      "aiPeer": "hermes",
      "peerName": "your-name",
      "workspace": "hermes"
    }
  }
}
```

**Мультипрофильная настройка:**

Honcho моделирует разговоры как обмен сообщениями между peer'ами -- один user peer и один AI peer на каждый Hermes-профиль, разделяющие workspace. Workspace -- это общий環境. Каждый AI peer строит независимую репрезентацию из собственных наблюдений.

Создание нового профиля с Honcho peer:

```bash
hermes profile create coder --clone
```

`--clone` создаёт блок `hermes.coder` в `honcho.json` с `aiPeer: "coder"`, разделяемым `workspace` и унаследованными настройками.

Для существующих профилей:

```bash
hermes honcho sync
```

### OpenViking

Контекстная база данных от Volcengine (ByteDance) с иерархией знаний в стиле файловой системы, многоуровневым извлечением и автоматической категоризацией памяти в 6 категорий.

**Лучше всего подходит:** Self-hosted управление знаниями со структурированным просмотром.

**Зависимости:** `pip install openviking` + запущенный сервер.

**Хранилище данных:** Self-hosted (локально или в облаке).

**Стоимость:** бесплатно (open-source, AGPL-3.0).

**Инструменты (5):**
- `viking_search` -- семантический поиск
- `viking_read` -- многоуровневое чтение (abstract/overview/full)
- `viking_browse` -- навигация по файловой системе знаний
- `viking_remember` -- сохранение фактов
- `viking_add_resource` -- загрузка URL/документов

**Настройка:**

```bash
pip install openviking
openviking-server

hermes memory setup    # выбор "openviking"
# Или вручную:
hermes config set memory.provider openviking
echo "OPENVIKING_ENDPOINT=http://localhost:1933" >> ~/.hermes/.env
```

**Ключевые особенности:**
- Многоуровневая загрузка контекста: L0 (~100 токенов) -> L1 (~2k) -> L2 (полный)
- Автоматическое извлечение памяти при коммите сессии
- Схема URI `viking://` для иерархической навигации

### Mem0

Серверное LLM-извлечение фактов с семантическим поиском, переранжированием и автоматической дедупликацией. Поддерживает Mem0 Platform (облако) и OSS (self-hosted).

**Лучше всего подходит:** Автоматическое управление памятью без ручной настройки.

**Зависимости:** `pip install mem0ai` + API-ключ (platform) или LLM/векторное хранилище (OSS).

**Хранилище данных:** Mem0 Cloud (platform) или self-hosted (OSS).

**Стоимость:** платно (platform) / бесплатно (OSS).

**Инструменты (5):**
- `mem0_list` -- список всех воспоминаний (с пагинацией)
- `mem0_search` -- семантический поиск с переранжированием
- `mem0_add` -- сохранение фактов
- `mem0_update` -- обновление по ID
- `mem0_delete` -- удаление по ID

**Настройка (Platform):**

```bash
hermes memory setup    # выбор "mem0" -> "Platform"
# Или вручную:
hermes config set memory.provider mem0
echo "MEM0_API_KEY=your-key" >> ~/.hermes/.env
```

**Настройка (OSS):**

```bash
hermes memory setup    # выбор "mem0" -> "Open Source (self-hosted)"
# Или через флаги:
hermes memory setup mem0 --mode oss --oss-llm openai --oss-llm-key sk-... --oss-vector qdrant
```

**Конфигурация:** `$HERMES_HOME/mem0.json`.

Ключевые параметры:
- `mode` -- `platform` или `oss`
- `user_id` -- идентификатор пользователя (по умолчанию `hermes-user`)
- `agent_id` -- идентификатор агента (по умолчанию `hermes`)
- `rerank` -- переранжирование результатов (только platform)

### Hindsight

Долгосрочная память с графом знаний, резолюцией сущностей и мультистратегическим извлечением. Инструмент `hindsight_reflect` обеспечивает кросс-синтез памяти. Автоматически сохраняет полные ходы разговора (включая вызовы инструментов).

**Лучше всего подходит:** Извлечение на основе графа знаний с связями между сущностями.

**Зависимости:** API-ключ (cloud) или LLM API-ключ (local).

**Хранилище данных:** Hindsight Cloud или локальная embedded PostgreSQL.

**Стоимость:** платно (cloud) / бесплатно (local).

**Инструменты (3):**
- `hindsight_retain` -- сохранение с извлечением сущностей
- `hindsight_recall` -- мультистратегический поиск
- `hindsight_reflect` -- кросс-синтез памяти

**Настройка:**

```bash
hermes memory setup    # выбор "hindsight"
# Или вручную:
hermes config set memory.provider hindsight
echo "HINDSIGHT_API_KEY=your-key" >> ~/.hermes/.env
```

**Конфигурация:** `$HERMES_HOME/hindsight/config.json`.

Ключевые параметры:
- `mode` -- `cloud` или `local`
- `bank_id` -- идентификатор хранилища памяти
- `recall_budget` -- тщательность извлечения: `low` / `mid` / `high`
- `memory_mode` -- `hybrid`, `context` или `tools`
- `auto_retain` -- автоматическое сохранение ходов
- `auto_recall` -- автоматическое извлечение перед каждым ходом

### Holographic

Локальное хранилище фактов на SQLite с полнотекстовым поиском FTS5, системой доверия и HRR (Holographic Reduced Representations) для композиционных алгебраических запросов.

**Лучше всего подходит:** Локальная память с продвинутым извлечением, без внешних зависимостей.

**Зависимости:** нет (SQLite доступен всегда). NumPy опционально для HRR.

**Хранилище данных:** локальная SQLite.

**Стоимость:** бесплатно.

**Инструменты (2):**
- `fact_store` -- 9 действий: add, search, probe, related, reason, contradict, update, remove, list
- `fact_feedback` -- оценка helpful/unhelpful для обучения системы доверия

**Настройка:**

```bash
hermes memory setup    # выбор "holographic"
# Или вручную:
hermes config set memory.provider holographic
```

**Конфигурация:** `config.yaml` в секции `plugins.hermes-memory-store`.

Ключевые параметры:
- `db_path` -- путь к SQLite базе
- `auto_extract` -- автоизвлечение фактов при завершении сессии
- `default_trust` -- оценка доверия по умолчанию (0.0-1.0)

**Уникальные возможности:**
- `probe` -- алгебраическое извлечение по конкретной сущности
- `reason` -- композиционные AND-запросы по нескольким сущностям
- `contradict` -- автоматическое обнаружение противоречивых фактов
- Система доверия с асимметричной обратной связью (+0.05 helpful / -0.10 unhelpful)

### RetainDB

Облачный API памяти с гибридным поиском (Vector + BM25 + Reranking), 7 типами памяти и дельта-компрессией.

**Лучше всего подходит:** Команды, уже использующие инфраструктуру RetainDB.

**Зависимости:** аккаунт RetainDB + API-ключ.

**Хранилище данных:** RetainDB Cloud.

**Стоимость:** $20/мес.

**Инструменты (7):**
- `retaindb_profile` -- профиль пользователя
- `retaindb_search` -- семантический поиск
- `retaindb_context` -- контекст задачи
- `retaindb_remember` -- сохранение с типом и важностью
- `retaindb_forget` -- удаление воспоминаний

**Настройка:**

```bash
hermes memory setup    # выбор "retaindb"
# Или вручную:
hermes config set memory.provider retaindb
echo "RETAINDB_API_KEY=your-key" >> ~/.hermes/.env
```

### ByteRover

Персистентная память через CLI `brv` -- иерархическое дерево знаний с многоуровневым извлечением (нечёткий текст -> LLM-управляемый поиск). Локально-ориентированный с опциональной облачной синхронизацией.

**Лучше всего подходит:** Разработчики, которым нужна портативная локальная память с CLI.

**Зависимости:** ByteRover CLI (`npm install -g byterover-cli`).

**Хранилище данных:** локально (по умолчанию) или ByteRover Cloud (опционально).

**Стоимость:** бесплатно (локально) / платно (cloud).

**Инструменты (3):**
- `brv_query` -- поиск по дереву знаний
- `brv_curate` -- сохранение фактов/решений/паттернов
- `brv_status` -- версия CLI и статистика дерева

**Настройка:**

```bash
curl -fsSL https://byterover.dev/install.sh | sh

hermes memory setup    # выбор "byterover"
# Или вручную:
hermes config set memory.provider byterover
```

**Ключевые особенности:**
- Автоматическое извлечение перед сжатием контекста
- Дерево знаний хранится в `$HERMES_HOME/byterover/` (изолировано по профилям)
- SOC2 Type II облачная синхронизация (опционально)

### Supermemory

Семантическая долгосрочная память с профильным извлечением, семантическим поиском, инструментами явного управления и графовой загрузкой сессий через Supermemory graph API.

**Лучше всего подходит:** Семантическое извлечение с профилированием пользователей и построением графа на уровне сессий.

**Зависимости:** `pip install supermemory` + API-ключ.

**Хранилище данных:** Supermemory Cloud.

**Стоимость:** платно.

**Инструменты (4):**
- `supermemory_store` -- сохранение явных воспоминаний
- `supermemory_search` -- семантический поиск
- `supermemory_forget` -- удаление по ID или запросу
- `supermemory_profile` -- персистентный профиль и недавний контекст

**Настройка:**

```bash
hermes memory setup    # выбор "supermemory"
# Или вручную:
hermes config set memory.provider supermemory
echo 'SUPERMEMORY_API_KEY=***' >> ~/.hermes/.env
```

**Конфигурация:** `$HERMES_HOME/supermemory.json`.

Ключевые параметры:
- `container_tag` -- тег контейнера (поддерживает шаблон `{identity}` для изоляции по профилям)
- `auto_recall` -- автоматическое извлечение перед ходами
- `auto_capture` -- автоматическое сохранение ходов
- `search_mode` -- `hybrid`, `memories` или `documents`

**Ключевые особенности:**
- Автоматическая изоляция контекста -- удаление извлеченных воспоминаний из захваченных ходов
- Полноценная загрузка сессии при завершении
- Мульти-контейнерный режим с `enable_custom_container_tags`

### Memori

Структурированная долгосрочная память через Memori Cloud с фоновым захватом завершённых ходов, контекстом, осведомлённым об инструментах, и инструментами явного извлечения для фактов, сводок, квот, регистрации и обратной связи.

**Лучше всего подходит:** Агент-управляемое извлечение со структурированным отнесением к проектам и сессиям.

**Зависимости:** `pip install hermes-memori` + `hermes-memori install` + API-ключ.

**Хранилище данных:** Memori Cloud.

**Стоимость:** платно.

**Инструменты (5):**
- `memori_recall` -- поиск долгосрочной памяти
- `memori_recall_summary` -- обобщённый контекст
- `memori_quota` -- использование/квота
- `memori_signup` -- запрос email для регистрации
- `memori_feedback` -- отправка обратной связи

**Настройка:**

```bash
pip install hermes-memori
hermes-memori install
hermes config set memory.provider memori
hermes memory setup
```

## Сравнительная таблица провайдеров

| Провайдер | Хранилище | Стоимость | Инструменты | Зависимости | Уникальная особенность |
|-----------|-----------|-----------|-------------|-------------|----------------------|
| Honcho | Облако | Платно | 5 | `honcho-ai` | Диалектическое моделирование + кросс-сессионный контекст |
| OpenViking | Self-hosted | Бесплатно | 5 | `openviking` + сервер | Файловая иерархия + многоуровневая загрузка |
| Mem0 | Облако/Self-hosted | Бесплатно/Платно | 5 | `mem0ai` | Серверное LLM-извлечение + OSS-режим |
| Hindsight | Облако/Локально | Бесплатно/Платно | 3 | `hindsight-client` | Граф знаний + reflect-синтез |
| Holographic | Локально | Бесплатно | 2 | нет | HRR-алгебра + система доверия |
| RetainDB | Облако | $20/мес | 5 | `requests` | Дельта-компрессия |
| ByteRover | Локально/Облако | Бесплатно/Платно | 3 | `brv` CLI | Извлечение перед сжатием |
| Supermemory | Облако | Платно | 4 | `supermemory` | Изоляция контекста + граф сессий + мульти-контейнер |
| Memori | Облако | Бесплатно/Платно | 5 | `hermes-memori` | Осведомлённость об инструментах + структурированное извлечение |

## Изоляция по профилям

Данные каждого провайдера изолированы по [профилям](/docs/user-guide/profiles):

- **Локальные провайдеры** (Holographic, ByteRover) используют пути `$HERMES_HOME/`, различающиеся для каждого профиля.
- **Провайдеры с конфигурационными файлами** (Honcho, Mem0, Hindsight, Supermemory) хранят конфигурацию в `$HERMES_HOME/`, поэтому каждый профиль имеет собственные учётные данные.
- **Облачные провайдеры** (RetainDB) автоматически формируют имена проектов, изолированные по профилям.
- **Провайдеры с переменными окружения** (OpenViking) настраиваются через `.env` файл каждого профиля.

## Примеры

### Быстрый выбор провайдера

```bash
# Интерактивный мастер настройки
hermes memory setup

# Проверка статуса
hermes memory status

# Переключение на другой провайдер
hermes memory setup  # выбрать новый провайдер
```

### Ручная настройка OpenViking

```bash
pip install openviking
openviking-server

hermes config set memory.provider openviking
echo "OPENVIKING_ENDPOINT=http://localhost:1933" >> ~/.hermes/.env

# Проверка
hermes memory status
```

### Использование Mem0 OSS

```bash
hermes memory setup mem0 --mode oss --oss-llm openai --oss-llm-key sk-... --oss-vector qdrant

# Превью без записи файлов
hermes memory setup mem0 --mode oss --oss-llm-key sk-... --dry-run
```

### Мультипрофиль с Honcho

```bash
# Создание нового профиля с Honcho peer
hermes profile create coder --clone

# Синхронизация существующих профилей
hermes honcho sync
```

### Отключение memory-провайдера

```bash
hermes memory off
```
