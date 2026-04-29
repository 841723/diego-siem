export default function Footer() {
    return (
        <footer className='text-text'>
            <div className='mx-auto max-w-7xl px-6 py-16'>
                <span className=''>
                    &copy; {new Date().getFullYear()} dieGo SIEM
                </span>
            </div>
        </footer>
    );
}
