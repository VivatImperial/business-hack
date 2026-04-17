import * as React from "react";
import { Tabs, TabsList, TabsTrigger } from "@radix-ui/react-tabs";
import { Button } from "@/shared/ui/button";
import { motion, AnimatePresence, fadeUp } from "@/shared/animations/motion";

declare global {
    interface Window {
        dataLayer: unknown[];
    }
}

interface TabContent {
    badge: string;
    title: string;
    description: string;
    buttonText: string;
    buttonLink?: string;
    socialProof?: string;
    imageSrc: string;
    imageAlt: string;
}

interface Tab {
    value: string;
    icon: React.ReactNode;
    label: string;
    content: TabContent;
}

interface Feature108Props {
    badge?: string;
    heading?: string;
    description?: string;
    tabs?: Tab[];
}

/* ── Mobile clickable tabs card ── */
function MobileFeatureSlider({ tabs }: { tabs: Tab[] }) {
    const [current, setCurrent] = React.useState(0);
    const data = tabs[current];

    return (
        <div className="mt-8">
            {/* Tabs List */}
            <div className="flex flex-wrap gap-2 justify-center mb-6">
                {tabs.map((tab, i) => (
                    <button
                        key={i}
                        onClick={() => setCurrent(i)}
                        className={`rounded-xl px-5 py-2.5 text-[15px] font-medium transition-colors border ${
                            i === current
                                ? "bg-slate-900 text-white border-slate-900 shadow-md"
                                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                        }`}
                    >
                        <div className="flex items-center gap-2">
                            <span aria-hidden>{tab.icon}</span>
                            {tab.label}
                        </div>
                    </button>
                ))}
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={current}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -12 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm flex flex-col gap-4"
                >
                    <span className="w-fit rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[13px] font-medium text-muted-foreground">
                        {data.content.badge}
                    </span>

                    <h3 className="font-heading text-2xl font-bold tracking-tight leading-snug text-slate-900">
                        {data.content.title}
                    </h3>

                    <p className="text-[16px] leading-relaxed text-slate-600">
                        {data.content.description}
                    </p>

                    {data.content.socialProof && (
                        <div className="flex items-center gap-2 text-[14px] font-medium text-slate-600">
                            <svg
                                className="h-5 w-5 text-green-500"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 13l4 4L19 7"
                                />
                            </svg>
                            {data.content.socialProof}
                        </div>
                    )}

                    <Button
                        asChild
                        className="mt-2 w-full rounded-xl h-12 text-[15px] bg-slate-900 text-white hover:bg-slate-800"
                        size="lg"
                    >
                        <a href={data.content.buttonLink || "#"}>
                            {data.content.buttonText}
                        </a>
                    </Button>

                    {/* Image — compact */}
                    <div className="mt-4 overflow-hidden rounded-2xl border border-slate-100 bg-slate-50">
                        <motion.img
                            initial={{ opacity: 0, scale: 0.97 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.35, delay: 0.1 }}
                            src={data.content.imageSrc}
                            alt={data.content.imageAlt}
                            className="h-56 w-full object-cover"
                        />
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

/* ── Desktop tabs (unchanged logic) ── */
const Feature108 = ({
    heading = "A Collection of Components Built With Shadcn & Tailwind",
    description = "Join us to build flawless web solutions.",
    tabs = [],
}: Feature108Props) => {
    const [activeTab, setActiveTab] = React.useState(tabs[0]?.value ?? "");
    const activeData = tabs.find((tab) => tab.value === activeTab) ?? tabs[0];

    return (
        <section className="py-12 md:py-32">
            <div className="site-container">
                <motion.div
                    variants={fadeUp}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true }}
                    className="flex flex-col items-center gap-3 px-4 text-center"
                >
                    <h2 className="font-heading max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                        {heading}
                    </h2>
                    <p className="max-w-2xl text-[16px] leading-relaxed text-slate-600 sm:text-lg">
                        {description}
                    </p>
                </motion.div>

                {/* Mobile: swipeable slider */}
                <div className="md:hidden">
                    <MobileFeatureSlider tabs={tabs} />
                </div>

                {/* Desktop: tabs */}
                <Tabs
                    value={activeTab}
                    onValueChange={setActiveTab}
                    className="mt-8 mx-auto hidden max- md:block"
                >
                    <TabsList className="flex items-center justify-start gap-2 -mb-[1px] z-10 relative">
                        {tabs.map((tab) => (
                            <TabsTrigger
                                key={tab.value}
                                value={tab.value}
                                onClick={() => {
                                    if (typeof window !== "undefined") {
                                        window.dataLayer =
                                            window.dataLayer || [];
                                        window.dataLayer.push({
                                            event: "tab_click",
                                            tab_name: tab.label,
                                        });
                                    }
                                }}
                                className="flex items-center gap-2 rounded-t-2xl px-6 py-3 text-sm font-semibold text-muted-foreground opacity-60 transition-all hover:opacity-100 data-[state=active]:bg-white data-[state=active]:text-blue-500 data-[state=active]:opacity-100 data-[state=active]:border-t data-[state=active]:border-x data-[state=active]:border-slate-200 data-[state=active]:border-b-white data-[state=active]:border-b border border-transparent"
                            >
                                <span className="shrink-0 text-sm" aria-hidden>
                                    {tab.icon}
                                </span>{" "}
                                {tab.label}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                    <div className="rounded-2xl rounded-tl-none bg-white p-6 shadow-sm border border-slate-200 lg:p-16 relative z-0">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, x: 12 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -12 }}
                                transition={{ duration: 0.25, ease: "easeInOut" }}
                                className="grid min-h-[480px] place-items-center gap-10 lg:grid-cols-2"
                            >
                                <div className="flex min-h-[420px] w-full max-w-xl flex-col justify-center gap-5">
                                    <span className="w-fit rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-muted-foreground">
                                        {activeData.content.badge}
                                    </span>
                                    <h3 className="font-heading text-2xl font-bold tracking-tight lg:text-3xl">
                                        {activeData.content.title}
                                    </h3>
                                    <p className="text-muted-foreground lg:text-lg">
                                        {activeData.content.description}
                                    </p>
                                    {activeData.content.socialProof && (
                                        <div className="flex items-center gap-2 mt-2 text-sm font-medium text-slate-600">
                                            <svg
                                                className="w-5 h-5 text-green-500"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                                xmlns="http://www.w3.org/2000/svg"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M5 13l4 4L19 7"
                                                />
                                            </svg>
                                            {activeData.content.socialProof}
                                        </div>
                                    )}
                                    <Button
                                        asChild
                                        className="mt-2.5 w-fit gap-2 rounded-xl"
                                        size="lg"
                                        data-track="cta_click"
                                        data-source-section={`feature-${activeData.value}`}
                                    >
                                        <a
                                            href={
                                                activeData.content.buttonLink || "#"
                                            }
                                        >
                                            {activeData.content.buttonText}
                                        </a>
                                    </Button>
                                </div>
                                <div className="w-full">
                                    <motion.img
                                        initial={{ opacity: 0, scale: 0.97 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ duration: 0.35, delay: 0.1 }}
                                        src={activeData.content.imageSrc}
                                        alt={activeData.content.imageAlt}
                                        className="h-[420px] w-full rounded-[24px] object-cover bg-slate-50 border border-slate-100 shadow-sm"
                                    />
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </Tabs>
            </div>
        </section>
    );
};

export { Feature108 };
