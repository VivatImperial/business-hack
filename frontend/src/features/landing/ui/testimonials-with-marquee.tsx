"use client";

import { motion, staggerContainer, fadeUp } from "@/shared/animations/motion";
import { ArrowTrendingUpIcon } from "@heroicons/react/24/solid";

import { cn } from "@/lib/utils";
import { type TestimonialAuthor } from "./testimonial-card";

interface TestimonialsSectionProps {
    title: string;
    description: string;
    testimonials: Array<{
        author: TestimonialAuthor;
        text: string;
        href?: string;
    }>;
    className?: string;
}

export function TestimonialsSection({
    title,
    description,
    testimonials,
    className,
}: TestimonialsSectionProps) {
    return (
        <section
            className={cn(
                "bg-background text-foreground",
                "px-4 py-16 sm:py-20 md:py-24",
                className,
            )}
        >
            <div className="mx-auto flex max- flex-col items-center gap-10 text-center">
                <motion.div
                    className="flex flex-col items-center gap-4"
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true }}
                    variants={staggerContainer(0.12)}
                >
                    <motion.h2 variants={fadeUp} className="font-heading max-w-[720px] text-3xl leading-tight sm:text-5xl sm:leading-tight">
                        {title}
                    </motion.h2>
                    <motion.p variants={fadeUp} className="text-md max-w-[600px] font-medium text-muted-foreground sm:text-xl">
                        {description}
                    </motion.p>
                </motion.div>

                <motion.div
                    className="grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-3"
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, margin: "-80px" }}
                    variants={{
                        hidden: {},
                        show: { transition: { staggerChildren: 0.08 } },
                    }}
                >
                    {testimonials.map((item, index) => (
                        <motion.article
                            key={`${item.author.name}-${index}`}
                            className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-left"
                            variants={{
                                hidden: { opacity: 0, y: 18 },
                                show: { opacity: 1, y: 0 },
                            }}
                            transition={{ duration: 0.45, ease: "easeOut" }}
                            whileHover={{ y: -6 }}
                        >
                            <div className="mb-4 inline-flex rounded-full border border-blue-200 bg-blue-50 p-2 text-blue-700">
                                <ArrowTrendingUpIcon className="size-4" />
                            </div>
                            <h3 className="font-heading text-xl">
                                {item.author.name}
                            </h3>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {item.author.handle}
                            </p>
                            <p className="mt-4 text-sm leading-relaxed text-slate-700">
                                {item.text}
                            </p>
                        </motion.article>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
