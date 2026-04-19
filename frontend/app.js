async function fetchLogs() {
  const res = await fetch("http://localhost:8080/logs/all");
  const data = await res.json();

  document.getElementById("logs").innerText =
    JSON.stringify(data, null, 2);
}

setInterval(fetchLogs, 2000);
fetchLogs();