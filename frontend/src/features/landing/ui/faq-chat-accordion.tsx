import * as React from "react";
import * as Accordion from "@radix-ui/react-accordion";
import { cn } from "@/lib/utils";

interface FAQItem {
    id: number;
    question: string;
    answer: string;
    icon?: string;
    iconPosition?: "left" | "right";
}

interface FaqAccordionProps {
    data: FAQItem[];
    className?: string;
    timestamp?: string;
    questionClassName?: string;
    answerClassName?: string;
    mobileLimit?: number;
}

export function FaqAccordion({
    data,
    className,
    mobileLimit,
}: FaqAccordionProps) {
    return (
        <div className={cn("", className)}>
            <Accordion.Root
                type="single"
                collapsible
                className="flex flex-col max-w-3xl mx-auto"
            >
                {data.map((item, index) => (
                    <Accordion.Item
                        value={item.id.toString()}
                        key={item.id}
                        className={cn(
                            "group/item -mx-5 rounded-2xl transition-colors data-[state=open]:bg-[#f5f5f7]",
                            mobileLimit &&
                                index >= mobileLimit &&
                                "hidden md:block",
                        )}
                    >
                        <Accordion.Header>
                            <Accordion.Trigger className="group flex w-full items-center justify-between gap-4 px-5 py-5 text-left md:py-6">
                                <span className="text-[17px] font-bold text-black sm:text-[18px]">
                                    {item.question}
                                </span>
                                <span className="shrink-0 text-black/40 transition-transform duration-200 group-data-[state=open]:rotate-45">
                                    <svg
                                        width="22"
                                        height="22"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <line x1="12" y1="5" x2="12" y2="19" />
                                        <line x1="5" y1="12" x2="19" y2="12" />
                                    </svg>
                                </span>
                            </Accordion.Trigger>
                        </Accordion.Header>
                        <Accordion.Content className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                            <div className="px-5 pb-5 pr-12 text-[16px] leading-relaxed text-black/70 md:pb-6">
                                {item.answer.split("\n").map((line, i) => (
                                    <React.Fragment key={i}>
                                        {i > 0 && <br />}
                                        {line}
                                    </React.Fragment>
                                ))}
                            </div>
                        </Accordion.Content>
                    </Accordion.Item>
                ))}
            </Accordion.Root>
        </div>
    );
}
