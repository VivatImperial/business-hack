
import { useEffect } from "react";

import { trackEvent } from "@/lib/tracking";

export function SiteAnalyticsTracker() {
  useEffect(() => {
    trackEvent("page_view");

    const clickHandler = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;

      const tracked = target.closest<HTMLElement>("[data-track]");
      if (!tracked) return;

      const type = tracked.dataset.track;
      if (!type) return;

      trackEvent(type as Parameters<typeof trackEvent>[0], {
        sourceSection: tracked.dataset.sourceSection,
        tariffId: tracked.dataset.tariffId,
      });
    };

    document.addEventListener("click", clickHandler);

    const observers: IntersectionObserver[] = [];

    const pricingSection = document.getElementById("pricing");
    if (pricingSection) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              trackEvent("pricing_view", { sourceSection: "pricing" });
              observer.disconnect();
            }
          });
        },
        { threshold: 0.4 }
      );
      observer.observe(pricingSection);
      observers.push(observer);
    }

    const sectionNodes = document.querySelectorAll<HTMLElement>("[data-track-section]");
    sectionNodes.forEach((node) => {
      const sectionName = node.dataset.trackSection;
      if (!sectionName) return;
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              trackEvent("section_view", { sourceSection: sectionName });
              observer.disconnect();
            }
          });
        },
        { threshold: 0.35 }
      );
      observer.observe(node);
      observers.push(observer);
    });

    return () => {
      document.removeEventListener("click", clickHandler);
      observers.forEach((observer) => observer.disconnect());
    };
  }, []);

  return null;
}
