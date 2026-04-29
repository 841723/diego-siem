import type { ReactNode } from "react";

type Props = {
    children: ReactNode;
    className?: string;
};

export default function SectionCard({ children, className }: Props) {
    const base = "rounded-2xl border border-slate-800 bg-slate-900 p-6";
    const classes = [base, className].filter(Boolean).join(" ");
    return (
        <section className={classes}>
            {children}
        </section>
    );
}
