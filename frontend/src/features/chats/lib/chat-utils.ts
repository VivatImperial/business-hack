/* ── Avatar color palette ── */

export const AVATAR_PALETTE = [
    { bg: "bg-blue-100", text: "text-blue-600" },
    { bg: "bg-emerald-100", text: "text-emerald-600" },
    { bg: "bg-violet-100", text: "text-violet-600" },
    { bg: "bg-amber-100", text: "text-amber-700" },
    { bg: "bg-rose-100", text: "text-rose-600" },
    { bg: "bg-cyan-100", text: "text-cyan-600" },
] as const;

export function hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash);
}

export function getAvatarProps(name: string) {
    const idx = hashString(name) % AVATAR_PALETTE.length;
    const letter = name.trim()[0]?.toUpperCase() || "?";
    return { ...AVATAR_PALETTE[idx], letter };
}
