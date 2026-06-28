---
title: "Личность агента (SOUL.md) и контекстные файлы"
section: "Личность агента"
sectionOrder: 70
order: 1
slug: "lichnost-agenta"
---

# DOC-007: Личность агента (SOUL.md) и контекстные файлы

## Источник
- https://hermes-agent.nousresearch.com/docs/user-guide/features/personality
- https://hermes-agent.nousresearch.com/docs/user-guide/features/context-files

---

## 1. SOUL.md — основа личности агента

`SOUL.md` — файл, определяющий базовую личность, тон и стиль общения Hermes.

**Расположение:**
```
%LOCALAPPDATA%\hermes\SOUL.md
```
Windows: `%LOCALAPPDATA%\hermes\SOUL.md`
Linux: `~/.hermes/SOUL.md`

**Как работает:**
- Hermes автоматически создаёт `SOUL.md` при первом запуске (если не существует)
- Существующий файл **никогда не перезаписывается**
- Загружается **только** из `HERMES_HOME` (не из текущей директории)
- Если файл пустой или не читается — используется встроенная личность по умолчанию

---

## 2. Порядок инъекции в системный промпт

SOUL.md занимает **слот #1** в системном промпте — это первое, что видит модель:

1. **SOUL.md** (личность агента)
2. Поведение, связанное с инструментами
3. Контекст памяти/пользователя
4. Руководство по скиллам
5. Контекстные файлы (AGENTS.md, .cursorrules)
6. Временная метка
7. Подсказки форматирования платформы
8. Опциональные наложения (/personality)

**Важно:** SOUL.md не дублируется в секции контекстных файлов — появляется только один раз как личность.

---

## 3. Что писать в SOUL.md

### Подходит для SOUL.md:
- Тон общения
- Стиль коммуникации
- Уровень прямоты
- Стиль взаимодействия по умолчанию
- Чего избегать стилистически
- Как обрабатывать неопределённость, разногласия, двусмысленность

### Не подходит для SOUL.md:
- Инструкции для конкретного проекта
- Пути к файлам
- Конвенции репозитория
- Временные детали рабочего процесса

### Пример SOUL.md:

```markdown
# Personality

You are a pragmatic senior engineer with strong taste.
You optimize for truth, clarity, and usefulness over politeness theater.

## Style
- Be direct without being cold
- Prefer substance over filler
- Push back when something is a bad idea
- Admit uncertainty plainly
- Keep explanations compact unless depth is useful

## What to avoid
- Sycophancy
- Hype language
- Repeating the user's framing if it's wrong
- Overexplaining obvious things

## Technical posture
- Prefer simple systems over clever systems
- Care about operational reality, not idealized architecture
- Treat edge cases as part of the design, not cleanup
```

---

## 4. SOUL.md vs AGENTS.md

| Аспект | SOUL.md | AGENTS.md |
|--------|---------|-----------|
| Назначение | Личность, тон, стиль | Архитектура проекта, конвенции |
| Скоуп | Глобальный (все проекты) | Проектный |
| Примеры | "Будь прямым", "Избегай пустых слов" | "Используй TypeScript strict" |
| Где хранить | `%LOCALAPPDATA%\hermes\SOUL.md` | В корне проекта |

**Правило:** Если должно следовать за вами везде — в SOUL.md. Если принадлежит проекту — в AGENTS.md.

---

## 5. Встроенные личности (/personality)

Hermes поставляется с набором встроенных личностей для переключения:

| Название | Описание |
|----------|----------|
| `helpful` | Дружелюбный, универсальный ассистент |
| `concise` | Краткий, по делу |
| `technical` | Детальный технический эксперт |
| `creative` | Креативное мышление за рамками |
| `teacher` | Терпеливый преподаватель с примерами |
| `kawaii` | Милые выражения, блёстки и энтузиазм ★ |
| `catgirl` | Неко-тян с кошачьими выражениями, nya~ |
| `pirate` | Капитан Hermes, технически подкованный пират |
| `shakespeare` | Бардовская проза с драматическим напором |
| `surfer` | Спокойный, дружеский стиль |
| `noir` | Детективная подача в стиле нуар |
| `uwu` | Максимальная милота с uwu-речью |
| `philosopher` | Глубокие размышления на каждый запрос |
| `hype` | МАКСИМАЛЬНАЯ ЭНЕРГИЯ И ЭНТУЗИАЗМ!!! |

---

## 6. Смена личности

### В CLI:
```
/personality concise
/personality technical
/personality teacher
```

### В мессенджерах:
```
/personality teacher
```

### Кастомные личности в конфиге:

```yaml
agent:
  personalities:
    codereviewer: >
      You are a meticulous code reviewer. Identify bugs, security issues,
      performance concerns, and unclear design choices. Be precise and constructive.
    devops: >
      You are a senior DevOps engineer. Focus on infrastructure, deployment,
      monitoring, and operational reliability.
```

Использование: `/personality codereviewer`

---

## 7. SOUL.md vs /personality

| Аспект | SOUL.md | /personality |
|--------|---------|--------------|
| Длительность | Постоянная | Сессионная |
| Назначение | Базовая личность | Временная смена режима |
| Пример | "Я прямой инженер" | "/personality teacher" для обучения |

**Рекомендуемый workflow:**
1. Поддерживайте осмысленный глобальный `SOUL.md`
2. Проектные инструкции в `AGENTS.md`
3. `/personality` только для временных режимов

---

## 8. Контекстные файлы

### Приоритет загрузки (только один тип за сессию):

1. `.hermes.md` (наивысший приоритет)
2. `AGENTS.md`
3. `CLAUDE.md`
4. `.cursorrules`

**SOUL.md** загружается **всегда** независимо от остальных.

### Поддерживаемые файлы:

| Файл | Назначение | Обнаружение |
|------|------------|-------------|
| `.hermes.md` / `HERMES.md` | Инструкции проекта (наивысший приоритет) | Поиск до git root |
| `AGENTS.md` | Инструкции, конвенции, архитектура | CWD + поддиректории |
| `CLAUDE.md` | Контекст Claude Code | CWD + поддиректории |
| `SOUL.md` | Глобальная личность | Только HERMES_HOME |
| `.cursorrules` | Конвенции Cursor IDE | Только CWD |

---

## 9. AGENTS.md — контекст проекта

### Пример AGENTS.md:

```markdown
# Project Context

This is a Next.js 14 web application with a Python FastAPI backend.

## Architecture
- Frontend: Next.js 14 with App Router in `/frontend`
- Backend: FastAPI in `/backend`, uses SQLAlchemy ORM
- Database: PostgreSQL 16
- Deployment: Docker Compose on a Hetzner VPS

## Conventions
- Use TypeScript strict mode for all frontend code
- Python code follows PEP 8, use type hints everywhere
- All API endpoints return JSON with `{data, error, meta}` shape
- Tests go in `__tests__/` directories (frontend) or `tests/` (backend)

## Important Notes
- Never modify migration files directly — use Alembic commands
- The `.env.local` file has real API keys, don't commit it
- Frontend port is 3000, backend is 8000, DB is 5432
```

---

## 10. Прогрессивное обнаружение поддиректорий

Hermes обнаруживает контекстные файлы **по мере навигации** по проекту:

```
my-project/
├── AGENTS.md              ← Загружается при старте (системный промпт)
├── frontend/
│   └── AGENTS.md          ← Обнаруживается при чтении файлов из frontend/
├── backend/
│   └── AGENTS.md          ← Обнаруживается при чтении файлов из backend/
└── shared/
    └── AGENTS.md          ← Обнаруживается при чтении файлов из shared/
```

**Преимущества:**
- Нет раздутия системного промпта
- Сохраняется кеш промпта

Каждая поддиректория проверяется не более одного раза за сессию.

---

## 11. Безопасность: защита от prompt injection

Все контекстные файлы сканируются перед включением. Обнаруживаются:

- Попытки переопределения инструкций
- Паттерны обмана
- Скрытые HTML-комментарии
- Скрытые div-элементы
- Эксплуатация учётных данных

При обнаружении угрозы файл блокируется:

```
[BLOCKED: AGENTS.md contained potential prompt injection (prompt_injection). Content not loaded.]
```

---

## 12. Лимиты размеров

| Параметр | Значение |
|----------|----------|
| Макс. символов на файл | `context_file_max_chars` (по умолчанию 20,000, ~7,000 токенов) |
| Сtruncate начала | 70% |
| Сtruncate конца | 20% |
| Маркер транкации | 10% (показывает количество символов) |

При превышении лимита:

```
[...truncated AGENTS.md: kept 14000+4000 of 25000 chars. Use file tools to read the full file.]
```

---

## 13. Внешний вид CLI vs разговорная личность

Это **разные вещи:**

| Аспект | Управление |
|--------|------------|
| Разговорная личность | `SOUL.md`, `agent.system_prompt`, `/personality` |
| Внешний вид терминала | `display.skin`, `/skin` |

Для внешнего вида терминала см. раздел "Skins & Themes".

---

## 14. Рекомендуемая структура файлов

```
%LOCALAPPDATA%\hermes\
├── SOUL.md              ← Глобальная личность
├── config.yaml          ← Конфигурация
├── state.db             ← База данных
└── ...

Проект/
├── AGENTS.md            ← Контекст проекта
├── frontend/
│   └── AGENTS.md        ← Контекст фронтенда
└── backend/
    └── AGENTS.md        ← Контекст бэкенда
```
