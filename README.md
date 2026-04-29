# S.T.A.L.K.E.R. 2 — Трекер Колекційних Карт

Веб-застосунок для відстеження колекції карток S.T.A.L.K.E.R. 2 × ATB (2026).
Підтримує кількох користувачів — кожен веде свою колекцію, можна дивитись що є у друзів і порівнювати зайві/відсутні карти для обміну.

## Можливості

- Відстеження 48 карток по 5 категоріях
- Мета на кількість копій (1–10), статистика і прогрес-бар
- Фільтрація: всі / відсутні / зібрано / зайві / рідкісні
- Копіювання списку відсутніх у буфер
- Перегляд колекцій друзів і порівняння для обміну
- Авторизація (реєстрація + логін, JWT)

## Вимоги

- [Docker](https://docs.docker.com/get-docker/) + [Docker Compose](https://docs.docker.com/compose/)

## Швидкий старт

```bash
git clone <repo-url>
cd <repo-folder>

# Створити .env
cp .env.example .env
# Відредагуй .env — встав свої значення JWT_SECRET і DB_PASSWORD

docker compose up -d --build
# Застосунок: http://localhost:7575
```

## Змінні середовища (`.env`)

| Змінна | Обов'язкова | Опис |
|---|---|---|
| `JWT_SECRET` | ✓ | Секрет для JWT. Генерувати: `openssl rand -hex 32` |
| `DB_PASSWORD` | ✓ | Пароль PostgreSQL |
| `DB_NAME` | — | Назва БД (default: `cards`) |
| `DB_USER` | — | Юзер PostgreSQL (default: `postgres`) |

## Бекап та відновлення

```bash
# Дамп
docker compose exec postgres pg_dump -U postgres cards > backup.sql

# Відновлення (увага: перезаписує поточну БД)
docker compose exec -T postgres psql -U postgres cards < backup.sql

# Або у стиснутому форматі
docker compose exec postgres pg_dump -U postgres -Fc cards > backup.dump
docker compose exec -T postgres pg_restore -U postgres -d cards < backup.dump
```

## Перенос на інший сервер

```bash
# На старому сервері — зробити дамп
docker compose exec postgres pg_dump -U postgres cards > backup.sql

# На новому сервері — запустити та відновити
docker compose up -d postgres
docker compose exec -T postgres psql -U postgres cards < backup.sql
docker compose up -d
```

## Структура

```
backend/   NestJS API  (порт 3001 всередині Docker)
frontend/  Next.js UI  (порт 7575 назовні)
```

## API

| Метод | Шлях | Авторизація | Опис |
|---|---|---|---|
| `POST` | `/auth/register` | — | Реєстрація |
| `POST` | `/auth/login` | — | Логін → JWT |
| `GET` | `/cards` | JWT | Моя колекція |
| `PATCH` | `/cards/:id` | JWT | Оновити кількість |
| `PATCH` | `/cards/:id/name` | JWT | Перейменувати |
| `GET` | `/cards/user/:id` | JWT | Колекція іншого гравця |
| `GET` | `/users` | JWT | Список гравців зі статистикою |

## Ліцензія

MIT
