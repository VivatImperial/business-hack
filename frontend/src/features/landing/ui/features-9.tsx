"use client";
import { motion } from "@/shared/animations/motion";
import { ChartBarIcon, CpuChipIcon, ChatBubbleOvalLeftIcon } from "@heroicons/react/24/solid";
import DottedMap from "dotted-map";
import { Area, AreaChart, CartesianGrid } from "recharts";
import {
    type ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/shared/ui/chart";

export function Features() {
    return (
        <section className="px-4 py-16 md:py-24">
            <div className="mx-auto mb-10 max-w-3xl text-center">
                <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl">
                    Почему Пульсар окупается быстрее
                </h2>
                <p className="mt-4 text-muted-foreground">
                    Не просто мониторинг: вы получаете сообщения, из которых
                    можно делать сделку уже сегодня.
                </p>
            </div>
            <motion.div
                className="mx-auto grid max- overflow-hidden rounded-3xl border border-blue-100 bg-white md:grid-cols-2"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.55, ease: "easeOut" }}
            >
                <motion.div
                    whileHover={{ y: -3 }}
                    transition={{ duration: 0.25 }}
                >
                    <div className="p-6 sm:p-10">
                        <span className="text-muted-foreground flex items-center gap-2">
                            <CpuChipIcon className="size-4" />
                            Поток лидов в реальном времени
                        </span>

                        <p className="font-heading mt-6 text-2xl">
                            Система находит целевые запросы в тематических чатах
                            каждую минуту.
                        </p>
                    </div>

                    <div aria-hidden className="relative">
                        <div className="absolute inset-0 z-10 m-auto size-fit">
                            <div className="rounded-[--radius] bg-background z-[1] dark:bg-muted relative flex size-fit w-fit items-center gap-2 border px-3 py-1 text-xs font-medium shadow-md shadow-black/5">
                                <span className="text-lg">🔥</span> Новый лид:
                                внедрение CRM, бюджет согласован
                            </div>
                            <div className="rounded-[--radius] bg-background absolute inset-2 -bottom-2 mx-auto border px-3 py-4 text-xs font-medium shadow-md shadow-black/5 dark:bg-zinc-900"></div>
                        </div>

                        <div className="relative overflow-hidden">
                            <div className="[background-image:radial-gradient(var(--tw-gradient-stops))] z-1 to-background absolute inset-0 from-transparent to-75%"></div>
                            <Map />
                        </div>
                    </div>
                </motion.div>
                <motion.div
                    className="overflow-hidden border-t bg-zinc-50 p-6 sm:p-10 md:border-0 md:border-l dark:bg-transparent"
                    whileHover={{ y: -3 }}
                    transition={{ duration: 0.25 }}
                >
                    <div className="relative z-10">
                        <span className="text-muted-foreground flex items-center gap-2">
                            <ChatBubbleOvalLeftIcon className="size-4" />
                            Очередь сообщений для менеджера
                        </span>

                        <p className="font-heading my-6 text-2xl">
                            Вместо холодного поиска менеджер получает только
                            релевантные обращения.
                        </p>
                    </div>
                    <div aria-hidden className="flex flex-col gap-8">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="flex justify-center items-center size-5 rounded-full border">
                                    <span className="size-3 rounded-full bg-blue-500" />
                                </span>
                                <span className="text-muted-foreground text-xs">
                                    Сегодня, 11:48
                                </span>
                            </div>
                            <div className="rounded-[--radius] bg-background mt-1.5 w-4/5 border p-3 text-xs">
                                Нужна CRM для отдела продаж. Планируем запуск в
                                этом месяце.
                            </div>
                        </div>

                        <div>
                            <div className="rounded-[--radius] mb-1 ml-auto w-4/5 bg-blue-600 p-3 text-xs text-white">
                                Бюджет есть, ищем команду под ключ. Напишите,
                                пожалуйста, детали.
                            </div>
                            <span className="text-muted-foreground block text-right text-xs">
                                Только что
                            </span>
                        </div>
                    </div>
                </motion.div>
                <div className="col-span-full border-y p-12">
                    <p className="font-heading text-center text-4xl lg:text-6xl">
                        Пропуски меньше 0.5% по внутренним замерам
                    </p>
                </div>
                <div className="relative col-span-full">
                    <div className="absolute z-10 max-w-lg px-6 pr-12 pt-6 md:px-12 md:pt-12">
                        <span className="text-muted-foreground flex items-center gap-2">
                            <ChartBarIcon className="size-4" />
                            Динамика полезных находок
                        </span>

                        <p className="font-heading my-6 text-2xl">
                            Видно, как растет поток релевантных сообщений.{" "}
                            <span className="text-muted-foreground">
                                Вы управляете качеством поиска, а не гадаете,
                                где лиды.
                            </span>
                        </p>
                    </div>
                    <MonitoringChart />
                </div>
            </motion.div>
        </section>
    );
}

const map = new DottedMap({ height: 55, grid: "diagonal" });

const points = map.getPoints();

const svgOptions = {
    backgroundColor: "var(--color-background)",
    color: "currentColor",
    radius: 0.15,
};

const Map = () => {
    const viewBox = `0 0 120 60`;
    return (
        <svg
            viewBox={viewBox}
            style={{ background: svgOptions.backgroundColor }}
        >
            {points.map((point: { x: number; y: number }, index: number) => (
                <circle
                    key={index}
                    cx={point.x}
                    cy={point.y}
                    r={svgOptions.radius}
                    fill={svgOptions.color}
                />
            ))}
        </svg>
    );
};

const chartConfig = {
    desktop: {
        label: "Desktop",
        color: "#2563eb",
    },
    mobile: {
        label: "Mobile",
        color: "#60a5fa",
    },
} satisfies ChartConfig;

const chartData = [
    { month: "May", desktop: 56, mobile: 224 },
    { month: "June", desktop: 56, mobile: 224 },
    { month: "January", desktop: 126, mobile: 252 },
    { month: "February", desktop: 205, mobile: 410 },
    { month: "March", desktop: 200, mobile: 126 },
    { month: "April", desktop: 400, mobile: 800 },
];

const MonitoringChart = () => {
    return (
        <ChartContainer
            className="h-120 aspect-auto md:h-96"
            config={chartConfig}
        >
            <AreaChart
                accessibilityLayer
                data={chartData}
                margin={{
                    left: 0,
                    right: 0,
                }}
            >
                <defs>
                    <linearGradient
                        id="fillDesktop"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                    >
                        <stop
                            offset="0%"
                            stopColor="var(--color-desktop)"
                            stopOpacity={0.8}
                        />
                        <stop
                            offset="55%"
                            stopColor="var(--color-desktop)"
                            stopOpacity={0.1}
                        />
                    </linearGradient>
                    <linearGradient id="fillMobile" x1="0" y1="0" x2="0" y2="1">
                        <stop
                            offset="0%"
                            stopColor="var(--color-mobile)"
                            stopOpacity={0.8}
                        />
                        <stop
                            offset="55%"
                            stopColor="var(--color-mobile)"
                            stopOpacity={0.1}
                        />
                    </linearGradient>
                </defs>
                <CartesianGrid vertical={false} />
                <ChartTooltip
                    active
                    cursor={false}
                    content={<ChartTooltipContent className="dark:bg-muted" />}
                />
                <Area
                    strokeWidth={2}
                    dataKey="mobile"
                    type="stepBefore"
                    fill="url(#fillMobile)"
                    fillOpacity={0.1}
                    stroke="var(--color-mobile)"
                    stackId="a"
                />
                <Area
                    strokeWidth={2}
                    dataKey="desktop"
                    type="stepBefore"
                    fill="url(#fillDesktop)"
                    fillOpacity={0.1}
                    stroke="var(--color-desktop)"
                    stackId="a"
                />
            </AreaChart>
        </ChartContainer>
    );
};
