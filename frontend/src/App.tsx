import { useEffect, useState } from "react";

function App() {
    const [logs, setLogs] = useState([]);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        async function fetchLogs() {
            try {
                const res = await fetch("http://localhost:8080/logs");
                if (!res.ok) {
                    throw new Error(`HTTP ${res.status}`);
                }

                const data = await res.json();
                if (!cancelled) {
                    setLogs(data);
                    setError("");
                }
            } catch (err) {
                if (!cancelled) {
                    setError((err as Error).message || "Error loading logs");
                }
            }
        }

        fetchLogs();
        const interval = setInterval(fetchLogs, 1000);

        return () => {
            cancelled = true;
            clearInterval(interval);
        };
    }, []);

    return (
        <main className='p-4 bg-gray-700 min-h-screen text-white'>
            <h1 className='text-3xl font-bold mb-4'>Logs</h1>
            <span>
                {logs.length} {logs.length !== 1 ? "logs" : "log"} loaded
            </span>
            {error && <p>{error}</p>}
            <table className='w-full mt-4 border-collapse'>
                <thead>
                    <tr>
                        <th className='border-b-2 border-gray-500 text-left p-2'>
                            Timestamp
                        </th>
                        <th className='border-b-2 border-gray-500 text-left p-2'>
                            Source ID
                        </th>
                        <th className='border-b-2 border-gray-500 text-left p-2'>
                            Data
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {logs.map((log: any, index) => (
                        <tr key={index}>
                            <td className='border-b border-gray-500 p-2'>
                                {log.timestamp}
                            </td>
                            <td className='border-b border-gray-500 p-2'>
                                {log.source_id}
                            </td>
                            <td className='border-b border-gray-500 p-2'>
                                {JSON.stringify(log.data)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </main>
    );
}

export default App;
