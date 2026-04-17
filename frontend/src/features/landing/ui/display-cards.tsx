import { cn } from "@/lib/utils";

export interface DisplayCardProps {
  className?: string;
  title?: string;
  description?: string;
  date?: string;
}

function DisplayCard({
  className,
  title = "Новый лид",
  description = "Нужен подрядчик по внедрению CRM",
  date = "Только что",
}: DisplayCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200 bg-white p-5 ring-1 ring-slate-100 transition-shadow hover:shadow-md",
        className
      )}
    >
      <div className="mb-3 flex items-center gap-2">
        <span className="inline-flex size-7 items-center justify-center rounded-full bg-blue-50 text-sm text-blue-600" aria-hidden>
          ✦
        </span>
        <span className="text-sm font-medium text-blue-600">{title}</span>
      </div>
      <p className="text-sm leading-relaxed text-slate-700">{description}</p>
      <p className="mt-3 text-xs text-muted-foreground">{date}</p>
    </div>
  );
}

interface DisplayCardsProps {
  cards?: DisplayCardProps[];
}

export default function DisplayCards({ cards }: DisplayCardsProps) {
  const defaultCards: DisplayCardProps[] = [
    {
      title: "Лид: CRM для продаж",
      description:
        "Ищем внедрение amoCRM для команды из 12 менеджеров. Бюджет согласован, старт в этом месяце.",
      date: "2 мин назад",
    },
    {
      title: "Лид: интеграция Битрикс24",
      description:
        "Нужен подрядчик для настройки Битрикс24 под отдел продаж. Готовы начать на этой неделе.",
      date: "5 мин назад",
    },
    {
      title: "Лид: сквозная аналитика",
      description:
        "Ищем команду для связки CRM + рекламных каналов. Хотим видеть ROI по каждому источнику.",
      date: "9 мин назад",
    },
  ];

  const displayCards = cards || defaultCards;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {displayCards.map((cardProps, index) => (
        <DisplayCard key={index} {...cardProps} />
      ))}
    </div>
  );
}
