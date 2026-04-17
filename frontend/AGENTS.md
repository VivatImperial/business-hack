# AGENTS.md — Pulsar Frontend

Правила для React 19 + TanStack Start. Общие принципы — в корневом [`../AGENTS.md`](../AGENTS.md).

---

## 1. Что это

UI CRM-системы Pulsar: дашборд, лиды, чаты, промпты, биллинг, настройки, админка, лендинг. SSR через TanStack Start + React Query, типы и хуки генерируются из backend OpenAPI через Orval.

---

## 2. Стек

| Категория          | Библиотеки                                                           |
| ------------------ | -------------------------------------------------------------------- |
| Фреймворк          | `react@19`, `@tanstack/react-start`, `vite@8`                        |
| Роутинг            | `@tanstack/react-router`, `@tanstack/react-router-with-query`        |
| Данные             | `@tanstack/react-query@5`, `openapi-fetch`, `orval@8`                |
| Формы / валидация  | `react-hook-form`, `@hookform/resolvers`, `zod@4`                    |
| Стили              | `tailwindcss@4`, `tw-animate-css`, `clsx`, `tailwind-merge`, `class-variance-authority` |
| UI-примитивы       | `@radix-ui/*`, `radix-ui`, `@heroui/react`                           |
| Иконки             | `@heroicons/react`, `@gravity-ui/icons`                              |
| Анимации           | `framer-motion` (ТОЛЬКО через `@/shared/animations/motion`)          |
| Графики            | `recharts`                                                           |
| DnD                | `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`           |
| Модалки            | `@ebay/nice-modal-react`                                             |
| Хуки               | `@uidotdev/usehooks`                                                 |
| Даты               | `dayjs`, `react-day-picker`                                          |
| Cookies            | `js-cookie` (client), `vinxi/http` (server)                          |
| Шрифты             | `@fontsource/inter`, `@fontsource/manrope`, `@fontsource/onest`, `@fontsource/geist-sans` |
| Прочее             | `qrcode.react`, `dotted-map`                                         |

---

## 3. Обязательные проверки

```bash
npm run build          # tsc -b && vite build — 0 ошибок
npm run lint           # ESLint — 0 ошибок
npm run generate:api   # Регенерация API-клиента (после изменений бэкенда)
```

Прогнать всё перед каждым коммитом. `lint` / `build` не обходить `// eslint-disable` без причины.

---

## 4. Архитектура (FSD-lite)

```text
src/
├── routes/              # Файловый роутинг (структуру НЕ трогать)
│   ├── __root.tsx
│   ├── _app.*.tsx       # Authenticated layout routes
│   ├── _auth.*.tsx      # Pre-auth layout routes
│   ├── admin/           # /admin/*
│   └── utm/             # /utm/*
├── lib/
│   ├── api/
│   │   ├── client.ts         # openapi-fetch base URL, auth middleware
│   │   └── generated/        # Orval output — НЕ редактировать
│   ├── queries/              # queryOptions + mutations по доменам
│   │   ├── admin.ts
│   │   ├── auth.ts
│   │   ├── balance.ts
│   │   ├── dashboard.ts
│   │   ├── leads.ts
│   │   ├── prompts.ts
│   │   ├── settings.ts
│   │   └── tags.ts
│   └── server-fns/           # createServerFn + middleware
├── hooks/                    # Глобальные хуки (use-mobile, use-device-detect, …)
├── shared/
│   ├── ui/                   # Примитивы (button, card, sheet, table, …)
│   ├── layout/               # Shell (sidebar, mobile-*, banner, profile)
│   ├── animations/           # ЕДИНСТВЕННОЕ место для `framer-motion`
│   ├── stories/              # Карусель сторис
│   ├── config/
│   └── styles/
└── features/                 # Домены
    └── <feature>/
        ├── ui/               # Компоненты
        ├── lib/              # Хелперы фичи
        ├── types.ts          # Локальные типы (расширяют сгенерированные)
        ├── constants.ts      # Константы фичи
        └── index.ts          # Public re-export
```

Домены: `admin`, `auth`, `balance`, `chats`, `dashboard`, `guide`, `landing`, `leads`, `onboarding`, `prompts`, `settings`, `tags`.

---

## 5. TypeScript

- `any` ЗАПРЕЩЁН — ESLint `@typescript-eslint/no-explicit-any: error`.
- `unknown` — только в `catch` и на границе внешних данных; сужай через `zod` или `instanceof`.
- API-типы берутся из `@/lib/api/generated/schemas`. Руками — не пишем.
- Локальные типы фичи — в `features/<feature>/types.ts`. Имя: `<Entity>Item`, `<Entity>ListParams`, `<Entity>Response`.
- `as` допустим ТОЛЬКО на границе query/mutation layer: `res.data as LeadListResponse`. В UI-коде — запрещён.
- `as unknown as X` — только при передаче локальных типов в мутации Orval (он генерирует `Record<string, unknown>`, а наши интерфейсы строже).
- `// @ts-ignore`, `// @ts-expect-error` — запрещены.
- `interface` для форм объектов, `type` для unions / утилит.

---

## 6. Данные (Query Layer)

### 6.1 Клиент

[`lib/api/client.ts`](src/lib/api/client.ts) — единственное место, где определяется base URL и middleware. Переменные:

- client-side: `import.meta.env.VITE_API_URL`
- server-side (SSR): `process.env.INTERNAL_API_URL` / `VITE_API_URL`, fallback `http://backend:8080`

### 6.2 Queries / Mutations

- Все запросы — через `queryOptions()` / `infiniteQueryOptions()` в [`lib/queries/`](src/lib/queries/).
- Один файл = один домен.
- Ключи — строго типизированные массивы: `["leads", params]`.
- Нет прямого `useQuery(fetch(...))` в компонентах — только через экспортированный `queryOptions`.
- Мутации:

```ts
export const leadsMutations = {
  setAction: () => ({
    mutationFn: (input: LeadActionInput) => api.POST("/leads/{id}/action", { ... }),
    onSuccess: (_, vars) => qc.invalidateQueries(leadsQueries.list(vars.params)),
  }),
};
```

### 6.3 SSR loaders

- Предзагрузка данных — в `route.loader()` через `queryClient.ensureQueryData(queryOptions)`.
- Не делать `useEffect(() => fetch())` — это anti-pattern для TanStack Start.
- `beforeLoad` — для redirect-guards (редирект неавторизованных).

### 6.4 Search params

- Всегда через `Route.useSearch()` и `validateSearch: zodSearchValidator(schema)`.
- Никаких `URLSearchParams` вручную.

---

## 7. Компоненты

### 7.1 Структура

- Один экспортируемый компонент = один файл (`react-refresh/only-export-components`).
- Desktop + Mobile — отдельные файлы (`leads-page.tsx` + `mobile-leads-page.tsx`). Общая логика — в хуках `features/<feature>/lib/use-*.ts`.
- Файлы — `kebab-case.tsx`. Компоненты — `PascalCase`.
- Не создавать новые файлы в `shared/ui/` без необходимости — переиспользуй существующие примитивы.

### 7.2 Хуки

- Стандартные утилитарные хуки берём из `@uidotdev/usehooks` (см. skill `frontend-hooks`).
- Глобальные (`use-mobile`, `use-device-detect`, `use-snackbar`) — в [`src/hooks/`](src/hooks/).
- Хуки фичи — в `features/<feature>/lib/`.
- Название — `useSomething`. Возврат — объект или массив явно ограниченный.

### 7.3 Стили

- Tailwind v4 через `@tailwindcss/vite`. Конфиг — в `src/shared/styles/`.
- Classnames — через `clsx` + `tailwind-merge` (`cn` helper).
- CVA (`class-variance-authority`) — для variants примитивов.
- Никаких inline-стилей для layout, только для значений из JS (progress width, drag offset).

### 7.4 Анимации

- `framer-motion` импортируем **только** из [`@/shared/animations/motion`](src/shared/animations/). Любой другой импорт — баг.
- Готовые пресеты живут в той же папке.

### 7.5 Модалки

- Через `@ebay/nice-modal-react`. Не использовать `useState(open)` для модалок, где нужен promise-flow.
- Регистрация модалок — в feature или global registry (см. skill `frontend-best-practices`).

---

## 8. Формы

- `react-hook-form` + `@hookform/resolvers/zod`.
- Zod-schema — рядом с формой: `features/<feature>/lib/schemas.ts`.
- `useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) })`.
- Ошибки — рендерим из `formState.errors`, не из собственного state.

---

## 9. Картинки

- Все файлы — в [`public/images/<module>/`](public/images/) (`common`, `landing`, `dashboard`, `guide`, `leads`, `chats`, `tags`, `stories`).
- В коде — строковые константы: `"/images/common/logo.webp"`. **ES-импорты запрещены**.
- Неиспользуемые файлы удалять.
- Форматы: `.webp` / `.svg` / `.avif`. PNG/JPG — только если внешний ассет без альтернативы.

---

## 10. Импорты

- Только alias `@/`, относительные пути `../../` запрещены.
- `framer-motion` — только из `@/shared/animations/motion`.
- Сгенерированные типы — из `@/lib/api/generated/schemas`.
- Локальные типы фичи — из `@/features/<feature>/types`.
- `import type` когда импортируется только тип.
- Группы разделены пустой строкой: `react/external` → `@tanstack/*` → `@/lib` → `@/features` → `@/shared` → relative.

---

## 11. Auth

- Токен — в **httpOnly cookie**, не в `localStorage`.
- Server functions / middleware работают с куками через `vinxi/http`.
- Клиентский `js-cookie` — только для неприватных флагов (tenant-id, UI-preferences).
- Redirect-логика — в `beforeLoad` соответствующих `_auth.*` / `_app.*` layout routes.

---

## 12. Запрещено

- `any`, `// @ts-ignore`, `// @ts-expect-error`
- Импорт `motion` вне `@/shared/animations/`
- Картинки в `src/` (только `public/images/`)
- Ручное редактирование `lib/api/generated/`
- `'use client'` (TanStack Start — всё клиентское по умолчанию)
- `useEffect` для data-fetching (только route loaders + React Query)
- Auth-токены в localStorage
- Относительные пути `../../` (только alias `@/`)
- `URLSearchParams` вручную вместо `validateSearch`
- `useState` для модалок с promise-flow (используй `@ebay/nice-modal-react`)
- Создание новых примитивов UI без проверки существующих

---

## 13. Команды

```bash
npm run dev            # Dev-сервер (vite)
npm run build          # tsc -b && vite build
npm run preview        # Превью production-бандла
npm run lint           # ESLint
npm run generate:api   # Orval → регенерация types + React Query hooks
```

После изменения backend API — обновить `public/openapi.json` и прогнать `npm run generate:api`.

---

## 14. Skills для фронта

Активно применяй:

| Skill                           | Когда                                                     |
| ------------------------------- | --------------------------------------------------------- |
| `frontend-best-practices`       | Routing, modals, cookies, server-fns, caching             |
| `frontend-data-layer`           | openapi-fetch, queryOptions, mutations, SSR loaders       |
| `frontend-hooks`                | Прежде чем писать custom hook — проверь `@uidotdev/usehooks` |
| `frontend-types`                | Когда создаёшь / регенерируешь типы                       |
| `frontend-view-layer`           | Структура компонентов, Tailwind, анимации                 |
| `tanstack-query`                | Query/mutation паттерны v5                                |
| `tanstack-router`               | Типизированный роутинг, search-params                     |
| `tanstack-start`                | Server functions, middleware, SSR                         |
| `tanstack-start-best-practices` | Архитектурные рекомендации для Start                       |
| `shadcn`                        | Добавление / правка shadcn-примитивов                     |
| `tailwind-design-system`        | Design tokens, responsive паттерны                         |
| `frontend-design`               | Общий вкус к качественному UI                              |
| `typescript-advanced-types`     | Сложные generics / conditional / mapped types              |

Полный список — в корневом [`../AGENTS.md`](../AGENTS.md) §9.

---

## 15. См. также

- [`../AGENTS.md`](../AGENTS.md) — корневые правила
- [`CLAUDE.md`](CLAUDE.md) — зеркало правил для Claude Code
- [`../backend/AGENTS.md`](../backend/AGENTS.md) — бэкенд-специфика
