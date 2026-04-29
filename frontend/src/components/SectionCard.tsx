import type { ReactNode } from "react";

type Props = {
    children: ReactNode;
    className?: string;
};

export default function SectionCard({ children, className = "" }: Props) {
    return (
        <section className={`rounded-2xl border border-slate-800 bg-slate-900 p-6 ${className}`}>
            {children}
        </section>
    );
}
