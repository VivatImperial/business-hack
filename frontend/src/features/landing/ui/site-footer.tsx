import { Button } from "@/shared/ui/button";
import { DinoGame } from "./dino-game";
import { Link } from "@tanstack/react-router";
import { MANAGER_CONTACT_URL } from "@/shared/config/contact";

export function SiteFooter() {
    return (
        <div
            className="px-5 sm:px-6 py-12 md:py-20 w-full max-w-[1200px] mx-auto"
            data-track-section="footer"
        >
            {/* Top CTA */}
            <div className="flex flex-col lg:flex-row justify-between items-center lg:items-start gap-12 mb-16 text-center lg:text-left">
                <div className="max-w-xl w-full flex flex-col items-center lg:items-start">
                    <h3 className="font-heading text-3xl md:text-[44px] font-bold text-black tracking-tight leading-tight">
                        Находите клиентов
                        <br />и действуйте мгновенно
                    </h3>
                    <div className="mt-8 flex flex-row flex-nowrap justify-center lg:justify-start gap-2 sm:gap-4 w-full min-w-0">
                        <Link to="/login" className="min-w-0 shrink">
                            <Button
                                className="h-12 rounded-xl bg-black text-white hover:bg-black/85 px-3 sm:px-8 font-medium text-sm sm:text-base whitespace-nowrap"
                                data-track="cta_click"
                                data-source-section="footer-primary"
                            >
                                Начать бесплатно →
                            </Button>
                        </Link>
                        <a
                            href={MANAGER_CONTACT_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="min-w-0 shrink"
                        >
                            <Button
                                variant="outline"
                                className="h-12 rounded-xl px-3 sm:px-8 border-slate-200 hover:bg-[#f5f5f7] text-black font-medium text-sm sm:text-base whitespace-nowrap"
                                data-track="cta_click"
                                data-source-section="footer-contact"
                            >
                                Связаться с нами →
                            </Button>
                        </a>
                    </div>
                </div>

                {/* Logo */}
                <div className="flex flex-col items-center lg:items-end gap-5 w-full lg:w-auto">
                    <div className="flex items-center gap-3">
                        <img
                            src="/images/common/logo.webp"
                            alt="Pulsar"
                            className="h-12 w-12 object-cover"
                        />
                        <span className="font-brand text-4xl font-bold text-black tracking-tight">
                            Пульсар
                        </span>
                    </div>
                    <div className="flex flex-row flex-nowrap gap-3 shrink-0 justify-center lg:justify-end">
                        <a
                            href={MANAGER_CONTACT_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex size-10 items-center justify-center rounded-xl bg-[#f5f5f7] text-black transition-colors hover:bg-slate-200"
                        >
                            <svg
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M22 2L11 13" />
                                <path d="M22 2l-7 20-4-9-9-4 20-7z" />
                            </svg>
                        </a>
                        <a
                            href="mailto:info@goji.studio"
                            className="flex size-10 items-center justify-center rounded-xl bg-[#f5f5f7] text-black transition-colors hover:bg-slate-200"
                        >
                            <svg
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <rect
                                    width="20"
                                    height="16"
                                    x="2"
                                    y="4"
                                    rx="2"
                                />
                                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                            </svg>
                        </a>
                    </div>
                </div>
            </div>

            {/* Links Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 sm:gap-x-8 gap-y-10 text-[15px] w-full max-w-xl mx-auto md:max-w-none md:mx-0 justify-items-stretch md:justify-items-start">
                <div>
                    <h4 className="font-heading font-bold text-black text-[16px] mb-5">
                        Продукт
                    </h4>
                    <ul className="space-y-3">
                        <li>
                            <a
                                href="#how-it-works"
                                className="text-black/60 hover:text-black transition-colors"
                            >
                                Как это работает
                            </a>
                        </li>
                        <li>
                            <a
                                href="#why-pulsar"
                                className="text-black/60 hover:text-black transition-colors"
                            >
                                Почему Пульсар
                            </a>
                        </li>
                        <li>
                            <a
                                href="#pricing"
                                className="text-black/60 hover:text-black transition-colors"
                            >
                                Тарифы
                            </a>
                        </li>
                        <li>
                            <a
                                href="#faq"
                                className="text-black/60 hover:text-black transition-colors"
                            >
                                FAQ
                            </a>
                        </li>
                        <li>
                            <Link
                                to="/guide"
                                className="text-black/60 hover:text-black transition-colors"
                            >
                                Руководство
                            </Link>
                        </li>
                    </ul>
                </div>
                <div>
                    <h4 className="font-heading font-bold text-black text-[16px] mb-5">
                        Компания
                    </h4>
                    <ul className="space-y-3">
                        <li>
                            <a
                                href="mailto:info@goji.studio"
                                className="text-black/60 hover:text-black transition-colors"
                            >
                                Контакты
                            </a>
                        </li>
                    </ul>
                </div>
                <div>
                    <h4 className="font-heading font-bold text-black text-[16px] mb-5">
                        Документы
                    </h4>
                    <ul className="space-y-3">
                        <li>
                            <a
                                href="/documents/Политика_конфиденциальности.docx"
                                className="text-black/60 hover:text-black transition-colors"
                            >
                                Политика конфиденциальности
                            </a>
                        </li>
                        <li>
                            <a
                                href="/documents/Согласие_на_обработку_персональных_данных1.docx"
                                className="text-black/60 hover:text-black transition-colors"
                            >
                                Согласие на обработку ПД
                            </a>
                        </li>
                    </ul>
                </div>
                <div>
                    <h4 className="font-heading font-bold text-black text-[16px] mb-5">
                        Реквизиты
                    </h4>
                    <ul className="space-y-2 text-[13px] leading-relaxed text-black/50">
                        <li className="font-medium text-black/70">
                            ИП Игитов Максим Дмитриевич
                        </li>
                        <li>ИНН 434586235127</li>
                        <li>
                            Кировская обл., Юрьянский р-н,
                            <br />
                            пгт. Мурыгино, ул. Железнодорожная д. 1
                        </li>
                        <li>
                            <a
                                href="tel:+79127120125"
                                className="hover:text-black transition-colors"
                            >
                                +7 (912) 712-01-25
                            </a>
                        </li>
                    </ul>
                </div>
            </div>

            {/* Easter egg */}
            <div className="mt-14 flex justify-center">
                <DinoGame />
            </div>

            <div className="mt-8 pt-8 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4 text-black/40 text-sm">
                <p>
                    © {new Date().getFullYear()} ИП Игитов М.Д. Все права
                    защищены.
                </p>
                <p>Пульсар для B2B-лидогенерации в социальных сетях.</p>
            </div>
        </div>
    );
}
