import { useEffect, useState } from "react";

type HealthResponse = {
  status: string;
  application: string;
  timestamp: string;
};

function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/v1/health`)
      .then((response) => {
        if (!response.ok) throw new Error("API request failed");
        return response.json();
      })
      .then((data: HealthResponse) => setHealth(data))
      .catch(() => setError("Cannot connect to backend"));
  }, []);

  return (
    <main style={{ padding: "40px", fontFamily: "Arial" }}>
      <h1>JobPilot</h1>
      <p>Full Stack Job Application Management Platform</p>

      <h2>Backend Connection</h2>

      {health ? (
        <p>✅ Connected to {health.application}</p>
      ) : error ? (
        <p>{error}</p>
      ) : (
        <p>Connecting...</p>
      )}
    </main>
  );
}

export default App;