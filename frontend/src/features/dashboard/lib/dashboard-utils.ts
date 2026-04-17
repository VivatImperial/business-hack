const TAG_COLORS = ["#2AABEE", "#818CF8", "#A78BFA", "#C4B5FD", "#93C5FD"];

export function getTagColor(index: number): string {
    return TAG_COLORS[index] ?? TAG_COLORS[TAG_COLORS.length - 1];
}

export function getGreeting(): string {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Доброе утро ☀️";
    if (hour >= 12 && hour < 18) return "Добрый день 👋";
    if (hour >= 18 && hour < 23) return "Добрый вечер 🌇";
    return "Доброй ночи 🌙";
}
