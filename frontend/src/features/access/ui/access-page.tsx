import { useState, type FormEvent } from "react";
import {
    ClipboardDocumentIcon,
    CheckIcon,
    TrashIcon,
    PlusIcon,
    KeyIcon,
} from "@heroicons/react/24/solid";

import {
    useAccessEntries,
    generatePassword,
} from "@/features/access/lib/access-store";
import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import { useSnackbar } from "@/hooks/use-snackbar";
import { cn } from "@/lib/utils";

function validEmail(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function AccessPage() {
    const { entries, create, remove } = useAccessEntries();
    const { show, showError } = useSnackbar();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const onCreate = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!validEmail(email)) {
            showError("Некорректный email");
            return;
        }
        if (password.length < 6) {
            showError("Пароль слишком короткий (минимум 6 символов)");
            return;
        }
        create(email.trim(), password);
        setEmail("");
        setPassword("");
        show("Доступ создан");
    };

    const onGenerate = () => {
        setPassword(generatePassword(16));
    };

    const onCopy = async (entryId: string, entryPassword: string) => {
        try {
            await navigator.clipboard.writeText(entryPassword);
            setCopiedId(entryId);
            setTimeout(() => setCopiedId(null), 2000);
        } catch {
            showError("Буфер обмена недоступен");
        }
    };

    return (
        <div className="flex flex-col gap-8 p-6 md:p-10 max-w-[1400px] w-full mx-auto animate-fade-in-up">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-semibold text-foreground">
                    Доступы
                </h1>
                <p className="text-sm text-muted-foreground">
                    Управление доступами к системе для других сотрудников
                </p>
            </div>

            {/* Create form */}
            <section className="flex flex-col gap-4 bg-card rounded-2xl p-6 ring-1 ring-border shadow-sm">
                <h2 className="text-lg font-medium text-foreground">
                    Создать доступ
                </h2>
                <form
                    onSubmit={onCreate}
                    className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto_auto] gap-4 items-end"
                >
                    <div className="flex flex-col gap-1.5">
                        <label
                            htmlFor="access-email"
                            className="text-sm font-medium text-foreground"
                        >
                            Email
                        </label>
                        <Input
                            id="access-email"
                            type="email"
                            placeholder="ex@bereg.ru"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="h-11 bg-background"
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label
                            htmlFor="access-pwd"
                            className="text-sm font-medium text-foreground"
                        >
                            Пароль
                        </label>
                        <Input
                            id="access-pwd"
                            type="text"
                            placeholder="JskLoimNqg2348965!"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="h-11 bg-background font-mono"
                        />
                    </div>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onGenerate}
                        className="h-11 px-4"
                    >
                        <KeyIcon className="size-4 mr-2" />
                        Сгенерировать
                    </Button>
                    <Button type="submit" className="h-11 px-6">
                        <PlusIcon className="size-4 mr-2" />
                        Создать
                    </Button>
                </form>
            </section>

            {/* Access list */}
            <section className="flex flex-col gap-4">
                <h3 className="text-lg font-medium text-foreground">
                    Активные доступы
                </h3>

                {entries.length === 0 ? (
                    <div className="rounded-2xl bg-card p-12 ring-1 ring-border shadow-sm text-center flex flex-col items-center justify-center gap-3">
                        <div className="size-12 rounded-full bg-secondary flex items-center justify-center text-muted-foreground">
                            <KeyIcon className="size-6" />
                        </div>
                        <p className="text-muted-foreground">
                            Пока нет созданных доступов
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        <div className="hidden md:grid grid-cols-[1fr_1fr_auto_auto] gap-4 px-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            <span>Email</span>
                            <span>Пароль</span>
                            <span className="w-[140px]" />
                            <span className="w-[110px]" />
                        </div>
                        {entries.map((entry) => {
                            const copied = copiedId === entry.id;
                            return (
                                <div
                                    key={entry.id}
                                    className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto_auto] gap-4 items-center p-4 bg-card rounded-xl ring-1 ring-border shadow-sm transition-all hover:shadow-md"
                                >
                                    <div className="flex flex-col gap-1.5 md:hidden">
                                        <span className="text-xs font-medium text-muted-foreground uppercase">Email</span>
                                        <span className="text-sm font-medium text-foreground">{entry.email}</span>
                                    </div>
                                    <span className="hidden md:block text-sm font-medium text-foreground truncate">{entry.email}</span>
                                    
                                    <div className="flex flex-col gap-1.5 md:hidden">
                                        <span className="text-xs font-medium text-muted-foreground uppercase">Пароль</span>
                                        <span className="text-sm font-mono text-muted-foreground">{entry.password}</span>
                                    </div>
                                    <span className="hidden md:block text-sm font-mono text-muted-foreground truncate">{entry.password}</span>
                                    
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        onClick={() =>
                                            onCopy(entry.id, entry.password)
                                        }
                                        className={cn(
                                            "h-9 w-full md:w-[140px] transition-colors",
                                            copied &&
                                                "bg-emerald-50 text-emerald-700 hover:bg-emerald-50",
                                        )}
                                    >
                                        {copied ? (
                                            <>
                                                <CheckIcon className="size-4 mr-2" />
                                                Скопировано
                                            </>
                                        ) : (
                                            <>
                                                <ClipboardDocumentIcon className="size-4 mr-2" />
                                                Копировать
                                            </>
                                        )}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() => {
                                            remove(entry.id);
                                            show("Доступ удалён");
                                        }}
                                        className="h-9 w-full md:w-[110px] text-destructive hover:text-destructive hover:bg-destructive/10"
                                    >
                                        <TrashIcon className="size-4 mr-2" />
                                        Удалить
                                    </Button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>
        </div>
    );
}
