import { Link } from "@tanstack/react-router";

export function MobileFeatureCard({
    step,
    title,
    description,
}: {
    step: string;
    title: string;
    description: string;
}) {
    return (
        <div className="flex items-center gap-3 rounded-xl bg-[#f5f5f7] p-3.5">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-xl font-heading text-[14px] font-bold text-black/30">
                {step}
            </span>
            <div>
                <h3 className="text-[14px] font-bold text-black">{title}</h3>
                <p className="text-[12px] text-black/60">{description}</p>
            </div>
        </div>
    );
}

export function MobilePageSection({
    title,
    description,
    image,
    link,
}: {
    icon?: unknown;
    title: string;
    description: string;
    image: string;
    link: string;
}) {
    return (
        <section>
            <h2 className="font-heading text-[20px] font-bold tracking-tight text-black">
                {title}
            </h2>
            <p className="mt-1.5 text-[15px] leading-relaxed text-black/70">
                {description}
            </p>
            <div className="mt-3 overflow-hidden rounded-xl border border-slate-200">
                <img
                    src={image}
                    alt={title}
                    className="block h-auto w-full"
                    loading="lazy"
                />
            </div>
            <Link
                to={link}
                className="mt-3 inline-flex text-[14px] font-medium text-blue-500"
            >
                Открыть →
            </Link>
        </section>
    );
}

export function MobileSetupStep({
    number,
    title,
    description,
}: {
    number: number;
    icon?: unknown;
    title: string;
    description: string;
}) {
    return (
        <div className="flex items-start gap-3 rounded-xl bg-[#f5f5f7] p-3.5">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-xl font-heading text-[13px] font-bold text-black/30">
                {number}
            </span>
            <div>
                <h3 className="text-[14px] font-bold text-black">{title}</h3>
                <p className="text-[12px] text-black/60">{description}</p>
            </div>
        </div>
    );
}
