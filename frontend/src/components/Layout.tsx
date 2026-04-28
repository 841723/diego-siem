import { NavLink, Outlet } from "react-router-dom";

const NAV_ITEMS = [
    { to: "/logs", label: "Logs" },
    { to: "/sources", label: "Fuentes" },
];

export default function Layout() {
    return (
        <div className="min-h-screen bg-slate-950 text-slate-100">
            <nav className="border-b border-slate-800 bg-slate-900">
                <div className="mx-auto flex max-w-7xl items-center gap-6 px-6 py-4">
                    <span className="text-lg font-bold tracking-tight text-cyan-400">
                        dieGo SIEM
                    </span>
                    <div className="flex gap-1">
                        {NAV_ITEMS.map((item) => (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                className={({ isActive }) =>
                                    `rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                                        isActive
                                            ? "bg-slate-800 text-white"
                                            : "text-slate-400 hover:text-white"
                                    }`
                                }
                            >
                                {item.label}
                            </NavLink>
                        ))}
                    </div>
                </div>
            </nav>
            <main className="mx-auto max-w-7xl space-y-6 p-6">
                <Outlet />
            </main>
        </div>
    );
}
