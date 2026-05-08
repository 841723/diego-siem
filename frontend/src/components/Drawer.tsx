import { useEffect, type ReactNode } from "react";

type Props = {
    open: boolean;
    title: string;
    onClose: () => void;
    children: ReactNode;
    footer: ReactNode;
};

export default function Drawer({ open, title, onClose, children, footer }: Props) {
    useEffect(() => {
        if (!open) return;
        const previous = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = previous;
        };
    }, [open]);

    if (!open) return null;

    return (
        <div className='fixed inset-0 z-50'>
            <button
                className='absolute inset-0 bg-black/55'
                onClick={onClose}
                aria-label='Cerrar panel'
            />

            <aside className='absolute right-0 top-0 h-full w-full max-w-2xl border-l border-border bg-background shadow-2xl'>
                <div className='flex h-full flex-col'>
                    <header className='shrink-0 border-b border-border px-6 py-4'>
                        <div className='flex items-center justify-between gap-4'>
                            <h2 className='text-lg font-semibold text-text-logo'>
                                {title}
                            </h2>
                            <button
                                className='rounded border border-border px-3 py-1 text-sm text-muted hover:bg-primary/30'
                                onClick={onClose}
                            >
                                Cerrar
                            </button>
                        </div>
                    </header>

                    <div className='min-h-0 flex-1 overflow-y-auto p-6'>
                        {children}
                    </div>

                    <footer className='shrink-0 border-t border-border bg-background px-6 py-4'>
                        {footer}
                    </footer>
                </div>
            </aside>
        </div>
    );
}
