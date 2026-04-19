import type { ClientRequestMessageResponse } from "@/lib/api/generated/schemas";
import { BASE_URL } from "@/lib/api/client";
import { motion } from "@/shared/animations/motion";

type UserMessage = ClientRequestMessageResponse & {
    image_url?: string | null;
    image_name?: string | null;
};

interface MessageUserProps {
    message: UserMessage;
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
            <div className="flex max-w-[85%] flex-col gap-2 rounded-2xl bg-primary px-4 py-3 text-[15px] leading-relaxed text-primary-foreground">
                {message.image_url ? (
                    <a
                        href={resolveMediaUrl(message.image_url)}
                        target="_blank"
                        rel="noreferrer"
                        className="block overflow-hidden rounded-xl border border-white/20"
                    >
                        <img
                            src={resolveMediaUrl(message.image_url)}
                            alt={message.image_name || "OCR screenshot"}
                            className="max-h-72 w-full object-cover"
                        />
                    </a>
                ) : null}
                <div className="whitespace-pre-wrap">{message.text}</div>
            </div>
        </motion.div>
    );
}

function resolveMediaUrl(url: string): string {
    if (/^https?:\/\//i.test(url)) {
        return url;
    }
    const normalizedUrl = url.startsWith("/") ? url : `/${url}`;
    const routedUrl = normalizedUrl.startsWith("/uploads/")
        ? `/api${normalizedUrl}`
        : normalizedUrl;
    return `${BASE_URL.replace(/\/api$/, "")}${routedUrl}`;
}
