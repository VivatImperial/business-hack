import { cn } from "@/lib/utils";

interface AssistantAvatarProps {
    size?: number;
    className?: string;
    pulse?: boolean;
}

/**
 * Brand-palette assistant avatar. Navy disc with three horizon waves and a
 * small accent dot — через CSS-переменные, чтобы подхватывать текущий бренд.
 */
export function AssistantAvatar({
    size = 48,
    className,
    pulse = false,
}: AssistantAvatarProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 48 48"
            xmlns="http://www.w3.org/2000/svg"
            className={cn("shrink-0 select-none", className)}
            aria-hidden
        >
            <defs>
                <linearGradient id="aa-bg" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="var(--brand-dark-2)" />
                    <stop offset="100%" stopColor="var(--brand-dark)" />
                </linearGradient>
                <clipPath id="aa-clip">
                    <circle cx="24" cy="24" r="24" />
                </clipPath>
            </defs>

            {/* Navy disc */}
            <circle cx="24" cy="24" r="24" fill="url(#aa-bg)" />

            {/* Accent dot — upper right, pulses while thinking */}
            <circle cx="36" cy="13" r="3.2" fill="#fff">
                {pulse && (
                    <animate
                        attributeName="opacity"
                        values="1;0.55;1"
                        dur="1.6s"
                        repeatCount="indefinite"
                    />
                )}
            </circle>

            {/* Three horizon waves, clipped to the disc */}
            <g clipPath="url(#aa-clip)" fill="none" strokeLinecap="round">
                <path
                    d="M-2 26 Q 8 22, 16 26 T 34 26 T 52 26"
                    stroke="#fff"
                    strokeWidth="2.2"
                    opacity="0.95"
                />
                <path
                    d="M-2 32 Q 8 28, 16 32 T 34 32 T 52 32"
                    stroke="var(--brand-sage-deep)"
                    strokeWidth="2"
                    opacity="0.9"
                />
                <path
                    d="M-2 38 Q 8 34, 16 38 T 34 38 T 52 38"
                    stroke="#fff"
                    strokeWidth="1.8"
                    opacity="0.5"
                />
            </g>

            {/* Subtle second accent dot (upper-left "star") */}
            <circle cx="12" cy="16" r="1.4" fill="#fff" opacity="0.65" />
        </svg>
    );
}
