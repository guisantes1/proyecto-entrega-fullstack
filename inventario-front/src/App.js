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
          <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.3)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
          }}>
            <div style={{
              backgroundColor: 'white',
              padding: 30,
              borderRadius: 8,
              minWidth: 350,
              fontSize: 16,
            }}>
              <h3 style={{ marginBottom: 20 }}>Cambiar contraseña</h3>
              
              <label>Contraseña actual:</label>
              <input
                type="password"
                value={oldPassword}
                onChange={e => setOldPassword(e.target.value)}
                style={{ width: '100%', marginBottom: 12, padding: 6 }}
              />

              <label>Nueva contraseña:</label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                style={{ width: '100%', marginBottom: 12, padding: 6 }}
              />

              <label>Repetir nueva contraseña:</label>
              <input
                type="password"
                value={repeatPassword}
                onChange={e => setRepeatPassword(e.target.value)}
                style={{ width: '100%', marginBottom: 20, padding: 6 }}
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => {
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

                    const token = localStorage.getItem("token");
                    console.log("→ Intentando cambiar contraseña...");
                    console.log("Token:", token);
                    console.log("Payload enviado:", {
                      old_password: oldPassword,
                      new_password: newPassword,
                    });

                    fetch("http://127.0.0.1:8000/change-password", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                      },
                      body: JSON.stringify({
                        old_password: oldPassword,
                        new_password: newPassword,
                      }),
                    })

                      .then(res => {
                        if (!res.ok) throw new Error("Error");
                        return res.json();
                      })
                      .then(() => {
                        alert("Contraseña cambiada con éxito");
                        setShowChangePassword(false);
                        setOldPassword('');
                        setNewPassword('');
                        setRepeatPassword('');
                      })
                      .catch(err => {
                        console.error(err);
                        alert("Error al cambiar la contraseña");
                      });
                  }}
                  style={{ marginRight: 10, padding: '6px 12px' }}
                >
                  Guardar
                </button>
                <button onClick={() => setShowChangePassword(false)} style={{ padding: '6px 12px' }}>
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
