import { useState, useEffect } from "react";
import Login from "./Login";
import StockList from "./StockList";
import './App.css';   

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem("token")
  );
  const [username, setUsername] = useState(localStorage.getItem("username") || "");

  
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    setIsAuthenticated(false);
    setUsername("");
  };

  const handleLogin = () => {
    const storedUsername = localStorage.getItem("username");
    setUsername(storedUsername || "");
    setIsAuthenticated(true);
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !repeatPassword) {
      alert("Rellena todos los campos");
      return;
    }
    if (newPassword !== repeatPassword) {
      alert("Las nuevas contraseñas no coinciden");
      return;
    }
    if (newPassword === oldPassword) {
      alert("La nueva contraseña no puede ser igual a la anterior");
      return;
    }
  
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://127.0.0.1:8000/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
      });
  
      if (!res.ok) throw new Error("Error al cambiar contraseña");
  
      alert("Contraseña cambiada con éxito");
      setShowChangePassword(false);
      setOldPassword('');
      setNewPassword('');
      setRepeatPassword('');
    } catch (err) {
      console.error(err);
      alert("Error al cambiar la contraseña");
    }
  };

  return (
    <div className="App-container">
      
      <div
        className="App-background"
        style={{ backgroundImage: `url('/divain_logo.jpeg')` }}
      />

    
      <main className="App-main">

        {isAuthenticated ? (
          <>
            <div className="App-header-bar">

              <span className="App-username">Hola, {username}</span>

              <button
                onClick={() => setShowChangePassword(true)}
                className="Btn-change-password"
              >
                Cambiar contraseña
              </button>

              <button
                onClick={handleLogout}
                className="Btn-logout"
              >
                Cerrar sesión
              </button>

            </div>


            <StockList />
          </>
        ) : (
          <Login onLogin={handleLogin} />
        )}
        
        {showChangePassword && (
          <div className="change-password-overlay">
            <div className="change-password-modal">
              <h3 className="change-password-title">Cambiar contraseña</h3>

              <label className="change-password-label">Contraseña actual:</label>
              <input
                type="password"
                value={oldPassword}
                onChange={e => setOldPassword(e.target.value)}
                className="change-password-input"
              />

              <label className="change-password-label">Nueva contraseña:</label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="change-password-input"
              />

              <label className="change-password-label">Repetir nueva contraseña:</label>
              <input
                type="password"
                value={repeatPassword}
                onChange={e => setRepeatPassword(e.target.value)}
                className="change-password-input"
              />

              <div className="change-password-buttons">
                <button
                  onClick={handleChangePassword}
                  className="change-password-button"
                >
                  Guardar
                </button>
                <button
                  onClick={() => setShowChangePassword(false)}
                  className="change-password-button"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
  
}


export default App;