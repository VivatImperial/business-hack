import { Button } from "@/shared/ui/button";
import { cn } from "@/lib/utils";
import type { PricingPlanConfig } from "@/shared/config/pricing-plans";
import { motion, blurFadeUp, staggerContainerFast } from "@/shared/animations/motion";

export interface PricingModuleProps {
    title?: string;
    subtitle?: string;
    plans: PricingPlanConfig[];
    className?: string;
}

export function PricingModule({
    title = "Тарифы",
    subtitle,
    plans,
    className,
}: PricingModuleProps) {
    const fmt = (n: number) => new Intl.NumberFormat("ru-RU").format(n);

    return (
        <section
            className={cn(
                "w-full py-12 md:py-24",
                className,
            )}
        >
            <div className="site-container max-w-5xl">
                {/* Heading */}
                <div className="mx-auto mb-10 max-w-2xl text-center md:mb-14">
                    <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                        {title}
                    </h2>
                    {subtitle && (
                        <p className="mt-3 text-[17px] text-black sm:text-[18px]">
                            {subtitle}
                        </p>
                    )}
                </div>

                {/* Cards */}
                <motion.div 
                    variants={staggerContainerFast(0.1)}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, margin: "-50px" }}
                    className="grid grid-cols-1 gap-6 lg:grid-cols-3"
                >
                    {plans.map((plan) => (
                        <motion.div
                            variants={blurFadeUp}
                            whileHover={{ scale: plan.recommended ? 1.03 : 1.02 }}
                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                            key={plan.id}
                            className={cn(
                                "relative flex flex-col rounded-[24px] border p-7 sm:p-8 transition-all shadow-sm hover:shadow-xl",
                                plan.recommended
                                    ? "border-2 border-blue-500"
                                    : "border-slate-200",
                            )}
                        >
                            {plan.recommended && (
                                <div className="absolute -top-3.5 left-0 right-0 mx-auto w-fit rounded-xl bg-blue-500 px-4 py-1 text-[13px] font-bold text-white">
                                    Популярный
                                </div>
                            )}

                            {/* Name + description */}
                            <h3 className="font-heading text-[22px] font-bold text-black sm:text-[24px]">
                                {plan.name}
                            </h3>
                            <p className="mt-1 text-[16px] text-black">
                                {plan.description}
                            </p>

                            {/* Price */}
                            <div className="mt-6">
                                <span className="font-heading text-[36px] font-bold leading-none text-black sm:text-[42px]">
                                    от {fmt(plan.priceFrom)} ₽
                                </span>
                                <span className="ml-2 text-[16px] text-black">
                                    / мес
                                </span>
                            </div>

                            {/* CTA */}
                            <a
                                href={plan.ctaLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-6"
                                data-track="buy_click"
                                data-source-section="pricing-card"
                                data-tariff-id={plan.id}
                            >
                                <Button
                                    className={cn(
                                        "w-full h-12 rounded-xl text-[15px] font-bold",
                                        plan.recommended
                                            ? "bg-blue-500 text-white hover:bg-blue-600"
                                            : "bg-black text-white hover:bg-black/85",
                                    )}
                                >
                                    {plan.ctaLabel}
                                </Button>
                            </a>

                            {/* Features */}
                            <ul className="mt-6 flex flex-col gap-3.5">
                                {plan.features
                                    .filter((f) => f.included)
                                    .map((f, i) => (
                                        <li
                                            key={i}
                                            className="flex items-start gap-3"
                                        >
                                            <svg className="mt-0.5 size-5 shrink-0 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                                            </svg>
                                            <span className="text-[15px] text-black">
                                                {f.label}
                                            </span>
                                        </li>
                                    ))}
                            </ul>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
