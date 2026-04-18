# Admin Frontend

CRM-система для управления лидами, чатами и настройками Telegram-интеграции.

## Стек

- **React 19** + **TypeScript 5**
- **TanStack Start** (SSR, файловый роутинг)
- **TanStack React Query v5** (кеширование, мутации)
- **Tailwind CSS v4** (через Vite плагин)
- **Orval** (кодогенерация API-клиента из OpenAPI)
- **Framer Motion** (анимации)
- **Recharts** (графики)
- **dnd-kit** (drag & drop)

## Команды

```bash
npm run dev            # Запуск dev-сервера
npm run build          # tsc + vite build (продакшн)
npm run preview        # Превью продакшн-сборки
npm run lint           # ESLint
npm run generate:api   # Генерация API-клиента через Orval
```

## Архитектура (FSD-lite)

```text
src/
├── routes/              # Файловый роутинг TanStack Start (НЕ ТРОГАТЬ)
├── lib/
│   ├── api/
│   │   ├── client.ts    # customFetch, BASE_URL
│   │   └── generated/   # Orval output (НЕ РЕДАКТИРОВАТЬ)
│   ├── queries/         # queryOptions + mutations для TanStack Query
│   ├── server-fns/      # createServerFn (серверная логика)
│   ├── constants.ts     # PERIOD_PRESETS и общие константы
│   └── utils.ts
├── hooks/               # Глобальные хуки (auth, device, types)
├── shared/
│   ├── ui/              # 17 shadcn-style примитивов (button, card, input...)
│   ├── layout/          # app-sidebar, mobile-layout, tenant-switcher, popovers
│   ├── animations/      # motion.tsx (ТОЛЬКО тут импорт framer-motion)
│   ├── stories/         # Карусель сторис + данные
│   └── styles/          # globals.css + Tailwind
└── features/            # Фичи по доменам
    ├── auth/            # Логин, регистрация, OAuth
    ├── landing/         # Лендинг + компоненты
    ├── dashboard/       # Дашборд + KPI
    ├── leads/           # Лиды, канбан, фильтры
    ├── chats/           # Управление чатами
    ├── settings/        # Настройки, Telegram, промпты
    ├── balance/         # Баланс, тарифы
    ├── tags/            # Теги, группы
    ├── prompts/         # Редактор промптов
    ├── guide/           # Гайд/онбординг
    └── admin/           # Админка клиентов
```

## Картинки

Все статические изображения в `public/images/`, организованы по модулям:

```text
public/images/
├── common/       # Логотип, иконки менеджера, общие 3D-ассеты
├── landing/      # Изображения лендинга
├── dashboard/    # Баннер дашборда
├── guide/        # Скриншоты для гайда
├── leads/        # Empty state лидов
├── chats/        # Empty state чатов
├── tags/         # Empty state тегов
└── stories/      # Карточки сторис
```

Ссылки на картинки — строковые константы: `"/images/common/logo.png"`, НЕ ES-импорты.
