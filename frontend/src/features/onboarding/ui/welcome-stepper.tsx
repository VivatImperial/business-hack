import { CheckIcon } from "@heroicons/react/24/solid";
import { motion } from "@/shared/animations/motion";

export interface WelcomeStep {
    id: string;
    label: string;
    description: string;
}

interface WelcomeStepperProps {
    steps: WelcomeStep[];
    currentStepId: string;
    completedStepIds: string[];
}

export function WelcomeStepper({
    steps,
    currentStepId,
    completedStepIds,
}: WelcomeStepperProps) {
    const currentIndex = steps.findIndex((s) => s.id === currentStepId);

    return (
        <div className="flex w-full items-start justify-center">
            {steps.map((step, index) => {
                const isCompleted = completedStepIds.includes(step.id);
                const isActive = step.id === currentStepId;
                const isPast = index < currentIndex;
                const showDone = isCompleted || isPast;
                const isLast = index === steps.length - 1;

                return (
                    <div key={step.id} className="flex items-start">
                        {/* Step column — circle + label centered */}
                        <div className="flex w-[20%] sm:w-[112px] flex-col items-center">
                            <motion.div
                                initial={false}
                                animate={{ scale: isActive ? 1.06 : 1 }}
                                transition={{
                                    type: "spring",
                                    stiffness: 320,
                                    damping: 22,
                                }}
                                className={`relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold transition-colors duration-300 ${
                                    showDone
                                        ? "border-primary bg-primary text-white"
                                        : isActive
                                          ? "border-primary bg-white text-primary"
                                          : "border-slate-200 bg-white text-muted-foreground"
                                }`}
                            >
                                {showDone ? (
                                    <CheckIcon className="size-3 stroke-3" />
                                ) : (
                                    <span>{index + 1}</span>
                                )}
                            </motion.div>

                            <div className="hidden sm:flex flex-col items-center gap-0.5 text-center mt-2.5">
                                <span
                                    className={`text-[12px] font-semibold leading-tight transition-colors duration-200 ${
                                        isActive || showDone
                                            ? "text-foreground"
                                            : "text-muted-foreground"
                                    }`}
                                >
                                    {step.label}
                                </span>
                                <span className="text-[11px] leading-tight text-muted-foreground/80">
                                    {step.description}
                                </span>
                            </div>
                        </div>

                        {/* Connector — sits between step columns, vertically centered with circle */}
                        {!isLast && (
                            <div className="relative mt-[11px] h-[2px] w-8 sm:w-12 overflow-hidden rounded-full bg-slate-100">
                                <motion.div
                                    initial={false}
                                    animate={{
                                        scaleX: isPast || isCompleted ? 1 : 0,
                                    }}
                                    transition={{
                                        duration: 0.4,
                                        ease: "easeOut",
                                    }}
                                    style={{ originX: 0 }}
                                    className="absolute inset-0 bg-primary"
                                />
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
