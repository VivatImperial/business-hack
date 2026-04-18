import type { ClientRequestMessageResponse } from "@/lib/api/generated/schemas";
import { motion, blurFadeUp } from "@/shared/animations/motion";

export function MessageUser({
    message,
}: {
    message: ClientRequestMessageResponse;
}) {
    return (
        <motion.div
            variants={blurFadeUp}
            initial="hidden"
            animate="show"
            className="flex justify-end"
        >
            <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl bg-primary px-4 py-3 text-[15px] leading-relaxed text-primary-foreground shadow-card">
                {message.text}
            </div>
        </motion.div>
    );
}
