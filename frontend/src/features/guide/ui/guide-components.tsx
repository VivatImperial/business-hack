import { Link } from "@tanstack/react-router";

export function FeatureCard({
    step,
    title,
    description,
}: {
    step: string;
    title: string;
    description: string;
}) {
    return (
        <div className="rounded-2xl bg-[#f5f5f7] p-6">
            <span className="font-heading text-[32px] font-bold leading-none text-black/15">
                {step}
            </span>
            <h3 className="mt-3 text-[17px] font-bold text-black">{title}</h3>
            <p className="mt-1.5 text-[15px] leading-relaxed text-black/60">
                {description}
            </p>
        </div>
    );
}

export function PageSection({
    id,
    title,
    description,
    features,
    image,
    link,
}: {
    id: string;
    icon?: unknown;
    title: string;
    badge?: string;
    description: string;
    features: string[];
    image: string;
    link: string;
}) {
    return (
        <section id={id} className="scroll-mt-12">
            <h2 className="font-heading text-[26px] font-bold tracking-tight text-black sm:text-[30px]">
                {title}
            </h2>
            <p className="mt-3 text-[17px] leading-relaxed text-black/70">
                {description}
            </p>

            {/* Screenshot */}
            <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
                <img
                    src={image}
                    alt={title}
                    className="w-full h-auto block"
                    loading="lazy"
                />
            </div>

            {/* Features */}
            <ul className="mt-6 flex flex-col gap-2.5">
                {features.map((feature, i) => (
                    <li
                        key={i}
                        className="flex items-start gap-3 text-[16px] text-black/80 leading-relaxed"
                    >
                        <svg className="mt-1 size-5 shrink-0 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                        </svg>
                        {feature}
                    </li>
                ))}
            </ul>

            <Link
                to={link}
                className="mt-5 inline-flex text-[16px] font-medium text-blue-500 transition-colors hover:text-blue-600"
            >
                Перейти в раздел →
            </Link>
        </section>
    );
}

export function SetupCard({
    title,
    description,
    number,
}: {
    number?: number;
    icon?: unknown;
    title: string;
    description: React.ReactNode;
}) {
    return (
        <div className="rounded-2xl bg-[#f5f5f7] p-6">
            {number && (
                <span className="font-heading text-[32px] font-bold leading-none text-black/15">
                    {number}
                </span>
            )}
            <h3 className="mt-3 text-[17px] font-bold text-black">{title}</h3>
            <p className="mt-1.5 text-[15px] leading-relaxed text-black/60">
                {description}
            </p>
        </div>
    );
}
