import { Outlet } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";

export default function Layout() {
    return (
        <div className='min-h-screen bg-surface text-text'>
            <Header />
            <main className='min-h-screen'>
                <Outlet />
            </main>
            <Footer />
        </div>
    );
}
