import { useState, useEffect } from "react";
import Login from "./Login";
import StockList from "./StockList";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem("token")
  );
  const [username, setUsername] = useState(localStorage.getItem("username") || "");

  useEffect(() => {
    console.log("🔐 Auth state:", isAuthenticated);
  }, [isAuthenticated]);

  const handleLogout = () => {
    console.log("🔴 LOGOUT CLICKED");
    localStorage.removeItem("token");
    localStorage.removeItem("username"); // Limpia el nombre del usuario también
    setIsAuthenticated(false);
    setUsername("");
  };

  const handleLogin = () => {
    const storedUsername = localStorage.getItem("username");
    setUsername(storedUsername || "");
    setIsAuthenticated(true);
  };

  return (
    <main
      style={{
        position: "relative",
        zIndex: 1,
        minHeight: "100vh",
        padding: "20px",
      }}
    >
      {isAuthenticated ? (
        <>
          <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center" }}>
            <span style={{ marginRight: "10px", fontWeight: "bold" }}>
              Hola, {username}
            </span>
            <button
              onClick={handleLogout}
              style={{
                padding: "6px 12px",
                cursor: "pointer",
                border: "1px solid #ccc",
                borderRadius: "4px",
                backgroundColor: "#f5f5f5",
              }}
            >
              Cerrar sesión
            </button>
          </div>
          <StockList />
        </>
      ) : (
        <Login onLogin={handleLogin} />
      )}
    </main>
  );
}

export default App;
