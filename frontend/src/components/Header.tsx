import { NavLink } from "react-router-dom";

const NAV_ITEMS = [
    { to: "/logs", label: "Logs" },
    { to: "/sources", label: "Fuentes" },
    { to: "/mapping", label: "Mapping" },
    { to: "/pipelines", label: "Pipelines" },
    { to: "/rules", label: "Rules" },
];

export default function Header() {
    return (
        <nav className='sticky top-0 z-10 w-full border-b border-border bg-secondary'>
            <div className='mx-auto flex justify-between items-center gap-6 px-6 py-2'>
                <a
                    className='text-xl font-bold tracking-tight text-text-logo flex items-center'
                    href='/'
                >
                    <img
                        src='https://go.dev/images/favicon-gopher.svg'
                        alt='dieGo SIEM logo'
                        className='inline-block h-6 w-6 mr-2'
                    />
                    dieGo SIEM
                </a>
                <div className='flex gap-4'>
                    {NAV_ITEMS.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) =>
                                `px-3 py-1.5 text-sm font-medium transition-colors text-muted hover:bg-primary/50 ${
                                    isActive
                                        ? "border-b-2 border-muted text-muted"
                                        : ""
                                }`
                            }
                        >
                            {item.label}
                        </NavLink>
                    ))}
                </div>
            </div>
        </nav>
    );
}
