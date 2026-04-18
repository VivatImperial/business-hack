# CLAUDE.md — Admin Frontend

## Сборка и проверка

```bash
npm run build          # tsc -b && vite build — ДОЛЖЕН проходить без ошибок
npm run lint           # ESLint — ДОЛЖЕН проходить без ошибок
npm run generate:api   # Orval — перегенерация API после изменений бэкенда
```

**Перед каждым коммитом** убедись, что `npm run build` проходит чисто.

## Строгие правила кода

### TypeScript

- **`any` ЗАПРЕЩЁН** — ESLint правило `@typescript-eslint/no-explicit-any: error`
- **`unknown`** — допустим только в catch-блоках (`err: unknown`)
- **Типы из Orval** — все API-типы берём из `@/lib/api/generated/schemas`
- **Локальные типы** — расширения/адаптеры в `features/*/types.ts` (не дублируют, а дополняют сгенерированные)
- **Cast `as`** — допустим ТОЛЬКО на границе query/mutation layer (`res.data as SomeType`), в UI-коде — нет
- **`as unknown as`** — допустим при передаче локальных типов в API-мутации (orval генерирует `{ [key: string]: unknown }`, наши интерфейсы строже)

### Архитектура (FSD-lite)

```text
src/
├── routes/              # Файловый роутинг (НЕ ТРОГАТЬ структуру)
├── lib/
│   ├── api/generated/   # Orval output (НЕ РЕДАКТИРОВАТЬ вручную)
│   ├── queries/         # queryOptions + mutations
│   └── server-fns/      # createServerFn
├── hooks/               # Глобальные хуки
├── shared/
│   ├── ui/              # Примитивы (button, card, input, sheet...)
│   ├── layout/          # Shell-компоненты (sidebar, mobile-layout, tenant-switcher)
│   ├── animations/      # ЕДИНСТВЕННОЕ место для импорта framer-motion
│   └── stories/         # Карусель сторис
└── features/            # Фичи по доменам (auth, leads, chats, settings...)
    └── <feature>/
        ├── ui/          # Компоненты страницы
        ├── types.ts     # Локальные типы (расширяют сгенерированные)
        ├── lib/         # Утилиты фичи
        └── constants.ts # Константы фичи
```

### Компоненты

- **Один компонент = один файл** — ESLint `react-refresh/only-export-components: warn`
- **Не создавать** файлы в `shared/ui/` без необходимости — используй существующие примитивы
- **Desktop + Mobile** — отдельные файлы (`leads-page.tsx` + `mobile-leads-page.tsx`), общая логика в хуках

### Картинки

- Все в `public/images/<module>/` (common, landing, dashboard, guide, leads, chats, tags, stories)
- Ссылки — строковые константы: `"/images/common/logo.png"`, НЕ ES-импорты
- Неиспользуемые картинки удалять, не накапливать

### Импорты

- Всегда через alias `@/` — никогда `../../`
- `framer-motion` — ТОЛЬКО через `@/shared/animations/motion`
- Сгенерированные типы — из `@/lib/api/generated/schemas`
- Локальные типы фичи — из `@/features/<feature>/types`

## Чего НЕ делать

- Не использовать `any`, `// @ts-ignore`, `// @ts-expect-error`
- Не импортировать `motion` вне `shared/animations/`
- Не класть картинки в `src/` — только `public/images/`
- Не редактировать `lib/api/generated/` вручную — только через `npm run generate:api`
- Не создавать `'use client'` — в TanStack Start все компоненты клиентские
- Не использовать `useEffect` для загрузки данных — только route loaders + React Query
- Не хранить auth-токены в localStorage — только httpOnly cookies
