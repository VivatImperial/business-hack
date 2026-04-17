interface ChatEmptyProps {
    onSuggest: (text: string) => void;
    disabled?: boolean;
}

const SUGGESTIONS = [
    "Как подключиться к корпоративной сети по VPN?",
    "Отчёт в 1С выдаёт не те данные за период.",
    "Забыл пароль от внутренней почты, что делать?",
    "Какие документы нужны для сброса 2FA?",
];

export function ChatEmpty({ onSuggest, disabled }: ChatEmptyProps) {
    return (
        <div className="flex flex-col items-center text-center gap-6 py-10 animate-fade-in-up">
            <div className="size-16 rounded-2xl bg-white flex items-center justify-center shadow-sm overflow-hidden p-2">
                <img
                    src="/images/layout/logo.webp"
                    alt="Балтийский Берег"
                    className="w-full h-auto object-contain"
                />
            </div>
            <div className="flex flex-col gap-2 max-w-md">
                <h2 className="text-2xl font-semibold text-foreground">
                    Задайте вопрос ассистенту
                </h2>
                <p className="text-sm text-muted-foreground">
                    Ассистент отвечает на вопросы по инцидентам, ИТ, 1С и
                    внутренним сервисам «Балтийский Берег».
                </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-2 w-full max-w-lg">
                {SUGGESTIONS.map((s) => (
                    <button
                        key={s}
                        type="button"
                        disabled={disabled}
                        onClick={() => onSuggest(s)}
                        className="text-left text-[14px] text-foreground bg-card rounded-xl px-4 py-3 shadow-card hover:shadow-pop transition-shadow disabled:opacity-50"
                    >
                        {s}
                    </button>
                ))}
            </div>
        </div>
    );
}
