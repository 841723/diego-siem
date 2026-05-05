import { Outlet } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";

export default function Layout() {
    return (
        <div className='max-h-screen h-screen overflow-hidden bg-background text-text flex flex-col'>
            <Header />
            <main className='overflow-hidden flex-1 min-h-0'>
                <Outlet />
            </main>
            {/* <Footer /> */}
        </div>
    );
}
