import { DocumentTextIcon, ShieldCheckIcon } from "@heroicons/react/24/solid";

export function AppFooter() {
    return (
        <footer className="px-6 py-4 mb-2">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-[12px] text-muted-foreground">
                <div className="flex items-center gap-1.5">
                    <span className="font-medium text-foreground/70">
                        ИП Игитов М.Д.
                    </span>
                    <span className="text-muted-foreground/40">|</span>
                    <span>ИНН 434586235127</span>
                    <span className="text-muted-foreground/40">|</span>
                    <a
                        href="tel:+79127120125"
                        className="hover:text-foreground transition-colors"
                    >
                        +7 (912) 712-01-25
                    </a>
                </div>
                <div className="flex items-center gap-4">
                    <a
                        href="/documents/Политика_конфиденциальности.docx"
                        className="flex items-center gap-1 hover:text-foreground transition-colors"
                    >
                        <ShieldCheckIcon className="w-3 h-3" />
                        Политика конфиденциальности
                    </a>
                    <a
                        href="/documents/Согласие_на_обработку_персональных_данных1.docx"
                        className="flex items-center gap-1 hover:text-foreground transition-colors"
                    >
                        <DocumentTextIcon className="w-3 h-3" />
                        Согласие на обработку ПД
                    </a>
                </div>
            </div>
        </footer>
    );
}
