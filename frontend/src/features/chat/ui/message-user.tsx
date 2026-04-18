import type { ClientRequestMessageResponse } from "@/lib/api/generated/schemas";
import { motion } from "@/shared/animations/motion";

interface MessageUserProps {
    message: ClientRequestMessageResponse;
    /** Index in the list, used to stagger the reveal. */
    index?: number;
}

export function MessageUser({ message, index = 0 }: MessageUserProps) {
    const delay = Math.min(index * 0.05, 0.35);

    return (
        <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
                duration: 0.22,
                ease: [0.25, 0.1, 0.25, 1],
                delay,
            }}
            className="flex justify-end"
        >
            <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl bg-primary px-4 py-3 text-[15px] leading-relaxed text-primary-foreground">
                {message.text}
            </div>
        </motion.div>
    );
}
