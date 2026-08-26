import { useEffect, useState } from "react";
import axios from "axios";

function App() {
  const [message, setMessage] = useState("");

  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_API_URL}/`)
      .then((response) => {
        setMessage(response.data.message);
      })
      .catch((error) => {
        console.error("API connection failed:", error);
      });
  }, []);

  return (
    <div>
      <h1>NIMS</h1>
      <p>{message}</p>
    </div>
  );
}

export default App;