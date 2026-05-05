type Props = {
    title: string;
    subtitle?: string;
    error?: string;
    success?: string;
};

export default function PageHeader({ title, subtitle, error, success }: Props) {
    return (
        <div>
            <h1 className="text-2xl font-bold text-text">{title}</h1>
            {subtitle && (
                <p className="mt-1 text-sm text-muted">{subtitle}</p>
            )}
            {error && (
                <p className="mt-2 rounded bg-rose-900/40 px-3 py-2 text-sm text-rose-200">
                    {error}
                </p>
            )}
            {success && (
                <p className="mt-2 rounded bg-emerald-900/40 px-3 py-2 text-sm text-emerald-200">
                    {success}
                </p>
            )}
        </div>
    );
}
