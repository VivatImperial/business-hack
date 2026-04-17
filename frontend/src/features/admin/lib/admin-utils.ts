export function generatePassword() {
    const alphabet =
        "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
    return Array.from(
        { length: 16 },
        () => alphabet[Math.floor(Math.random() * alphabet.length)],
    ).join("");
}

export function sessionStatusLabel(status: string) {
    switch (status) {
        case "healthy":
            return "здоровая";
        case "backoff":
            return "бэкофф";
        case "leased":
            return "арендована";
        case "paused":
            return "пауза";
        case "inactive":
            return "неактивна";
        default:
            return "нет сессии";
    }
}
