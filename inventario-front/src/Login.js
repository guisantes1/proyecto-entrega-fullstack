import { useState } from "react";

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new URLSearchParams();
    formData.append("username", username);
    formData.append("password", password);

    try {
      const response = await fetch("http://localhost:8000/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem("token", data.access_token);
        const payload = JSON.parse(atob(data.access_token.split('.')[1]));
        localStorage.setItem("username", payload.sub);
        onLogin();
      } else {
        alert("Usuario o contraseña incorrectos");
      }
    } catch (error) {
      console.error("Error en login:", error);
      alert("Error al conectar con el servidor");
    }
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        backgroundColor: "transparent",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: "480px",
          padding: "50px 40px",
          border: "1px solid #ccc",
          borderRadius: "20px",
          textAlign: "center",
          fontFamily: "sans-serif",
          backgroundColor: "#fff",
          boxShadow: "0 6px 18px rgba(0, 0, 0, 0.2)",
        }}
      >
        <img
          src="/divain_team.png"
          alt="Divain logo"
          style={{
            width: "200px",
            marginBottom: "30px",
          }}
        />

        <h2 style={{ marginBottom: "30px", fontSize: "28px" }}>Iniciar sesión</h2>

        <input
          type="text"
          placeholder="Usuario"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{
            width: "100%",
            padding: "14px",
            marginBottom: "20px",
            fontSize: "18px",
            border: "1px solid #ccc",
            borderRadius: "6px",
            boxSizing: "border-box",
          }}
        />

        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            width: "100%",
            padding: "14px",
            marginBottom: "25px",
            fontSize: "18px",
            border: "1px solid #ccc",
            borderRadius: "6px",
            boxSizing: "border-box",
          }}
        />

        <button
          type="submit"
          style={{
            width: "100%",
            padding: "14px",
            fontSize: "18px",
            backgroundColor: "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Entrar
        </button>
      </form>
    </div>
  );
}
