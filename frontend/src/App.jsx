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
          setLogs(Array.isArray(data) ? data : []);
          setError("");
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Error loading logs");
        }
      }
    }

    fetchLogs();
    const interval = setInterval(fetchLogs, 2000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <>
      <h1>Logs</h1>
      {error && <p>{error}</p>}
      <pre>{JSON.stringify(logs, null, 2)}</pre>
    </>
  );
}

export default App;
