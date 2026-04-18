const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(value: string): string | null {
    const v = value.trim();
    if (v.length === 0) return "Укажите email";
    if (!EMAIL_RE.test(v)) return "Неверный формат email";
    return null;
}

export function validatePassword(value: string): string | null {
    if (value.length === 0) return "Укажите пароль";
    if (value.length < 8) return "Минимум 8 символов";
    return null;
}

export function validateLogin(value: string): string | null {
    const v = value.trim();
    if (v.length === 0) return "Укажите логин";
    if (v.length < 3) return "Минимум 3 символа";
    if (v.length > 64) return "Максимум 64 символа";
    return null;
}

export function validatePasswordMatch(
    password: string,
    confirm: string,
): string | null {
    if (confirm.length === 0) return "Повторите пароль";
    if (password !== confirm) return "Пароли не совпадают";
    return null;
}
