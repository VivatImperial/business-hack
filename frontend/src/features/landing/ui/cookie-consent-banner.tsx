
import { useState } from "react";
import { Button } from "@/shared/ui/button";

const COOKIE_KEY = "pulsar_cookie_consent_v1";

export function CookieConsentBanner() {
  const [visible, setVisible] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return !window.localStorage.getItem(COOKIE_KEY);
  });

  function accept() {
    window.localStorage.setItem(COOKIE_KEY, "accepted");
    setVisible(false);
  }

  function rejectOptional() {
    window.localStorage.setItem(COOKIE_KEY, "required_only");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed right-4 bottom-4 z-[95] w-[min(420px,calc(100vw-2rem))] animate-in fade-in-0 slide-in-from-bottom-6 duration-500">
      <div className="rounded-2xl border border-blue-200 bg-white/95 p-4 shadow-2xl backdrop-blur">
        <div className="mb-2 flex items-center gap-2 text-blue-700">
          <span className="text-sm" aria-hidden>◉</span>
          <span className="font-heading text-lg">Мы используем cookie</span>
        </div>
        <p className="text-sm text-slate-600">
          Это помогает улучшать сайт и считать аналитику воронки. Вы можете принять все cookie или оставить только
          необходимые.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" className="rounded-xl" onClick={accept}>
            Принять все
          </Button>
          <Button size="sm" variant="outline" className="rounded-xl" onClick={rejectOptional}>
            Только необходимые
          </Button>
          <a href="/documents/Политика_конфиденциальности.docx" className="ml-auto inline-flex items-center gap-1 text-xs text-blue-700 hover:underline">
            <span className="text-xs" aria-hidden>◇✓</span>
            Политика
          </a>
        </div>
      </div>
    </div>
  );
}
