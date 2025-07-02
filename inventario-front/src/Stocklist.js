import React, { useEffect, useState } from 'react';
import { DateTime } from 'luxon';
import './StockList.css';


const API_URL = 'http://127.0.0.1:8000';

function StockList() {
  const [items, setItems] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSku, setNewSku] = useState('');
  const [newEan13, setNewEan13] = useState('');
  const [newQuantity, setNewQuantity] = useState('');

  // Función para logout y recarga al expirar sesión
  function logoutAndRedirect() {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    alert("Tu sesión ha expirado. Por favor, inicia sesión de nuevo.");
    window.location.reload();
  }

  // Función fetch con manejo de token expirado
  async function fetchWithAuth(url, options = {}) {
    const token = localStorage.getItem("token");
    if (!options.headers) options.headers = {};
    options.headers.Authorization = `Bearer ${token}`;

    const response = await fetch(url, options);

    if (response.status === 401) {
      let errorDetail = "";
      try {
        const errorData = await response.json();
        errorDetail = errorData.detail || "";
      } catch {
        // no hacer nada si no hay json
      }

      if (errorDetail.toLowerCase().includes("expired")) {
        logoutAndRedirect();
        throw new Error("Sesión expirada");
      } else {
        alert("No autorizado");
        throw new Error("No autorizado");
      }
    }

    if (!response.ok) {
      throw new Error(`Error en fetch: ${response.statusText}`);
    }

    return response;
  }


  useEffect(() => {
    cargarItems();
  }, []);

  const cargarItems = async () => {
    try {
      const res = await fetchWithAuth(`${API_URL}/items`);
      const data = await res.json();
      setItems(data);
    } catch (err) {
      if (err.message !== "Sesión expirada") {
        console.error('Error al cargar items:', err);
        alert('Error al cargar items. Mira la consola.');
      }
    }
  };

  const actualizarCantidad = async (id, cantidadActual) => {
    const nuevaCantidad = prompt('Introduce la nueva cantidad:', cantidadActual);
    const cantidad = parseInt(nuevaCantidad);
  
    if (isNaN(cantidad)) {
      alert('Cantidad no válida');
      return;
    }
    if (cantidad === cantidadActual) {
      alert('La cantidad no ha cambiado');
      return;
    }
  
    try {
      const res = await fetchWithAuth(`${API_URL}/items/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: cantidad })
      });
      const actualizado = await res.json();
      setItems(items.map(item => (item.id === id ? actualizado : item)));
      alert('Cantidad actualizada correctamente');
    } catch (err) {
      if (err.message !== "Sesión expirada") {
        console.error(err);
        alert('Error al actualizar la cantidad');
      }
    }
  };
  

  const verHistorial = async (id) => {
    try {
      const res = await fetchWithAuth(`${API_URL}/movements`);
      const data = await res.json();
      const historial = data.filter(mov => mov.item_id === id);
      if (historial.length === 0) {
        alert('Este producto no tiene movimientos.');
      } else {
        const texto = historial.map(m => {
          const fechaMadrid = DateTime.fromISO(m.timestamp).setZone('Europe/Madrid').toFormat('d/M/yyyy HH:mm:ss');
          const unidades = Math.abs(m.amount);
          const usuario = m.username ? ` por ${m.username}` : '';
          let tipoMovimiento;
          let cantidades = '';
          if (m.type.toLowerCase() === 'creación') {
            tipoMovimiento = 'Creación';
          } else {
            tipoMovimiento = m.amount > 0 ? 'Entrada' : 'Salida';
            cantidades = ` (${m.quantity_before} -> ${m.quantity_after})`;
          }
          return `${tipoMovimiento} de ${unidades} unidad${unidades !== 1 ? 'es' : ''} el ${fechaMadrid}${cantidades}${usuario}`;
        }).join('\n');
        alert(`Historial del producto:\n\n${texto}`);
      }
    } catch (err) {
      if (err.message !== "Sesión expirada") {
        console.error('Error al cargar historial:', err);
        alert('No se pudo cargar el historial');
      }
    }
  };

  const eliminarProducto = async (id) => {
    if (!window.confirm("¿Seguro que quieres eliminar este producto? Se eliminarán también sus movimientos.")) return;
  
    try {
      const res = await fetchWithAuth(`${API_URL}/items/${id}`, { method: "DELETE" });
      setItems(items.filter(item => item.id !== id));
      alert("Producto eliminado correctamente");
    } catch (error) {
      if (error.message !== "Sesión expirada") {
        console.error("Error al eliminar producto:", error);
        alert("Error al eliminar producto: " + error.message);
      }
    }
  };
  

  const añadirProducto = async () => {
    if (!newSku.trim() || !newEan13.trim() || !newQuantity.trim()) {
      alert('Por favor, rellena todos los campos.');
      return;
    }
    if (isNaN(parseInt(newQuantity))) {
      alert('Cantidad debe ser un número válido.');
      return;
    }
    if (items.some(i => i.sku === newSku)) {
      alert('Ya existe un producto con ese SKU.');
      return;
    }
    if (items.some(i => i.ean13 === newEan13)) {
      alert('Ya existe un producto con ese EAN13.');
      return;
    }
  
    try {
      const res = await fetchWithAuth(`${API_URL}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sku: newSku,
          ean13: newEan13,
          quantity: parseInt(newQuantity)
        }),
      });
  
      const productoCreado = await res.json();
      setItems([...items, productoCreado]);
      setShowAddModal(false);
      setNewSku('');
      setNewEan13('');
      setNewQuantity('');
      alert('Producto añadido correctamente');
    } catch (error) {
      if (error.message !== "Sesión expirada") {
        console.error(error);
        alert('No se pudo añadir el producto');
      }
    }
  };


  return (
    <div className="container">

      
      <img src="/divain_team.png" alt="Divain Logo" className="logo" />

      <h2 className="title">Listado de Inventario</h2>    

      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center'}}>

      <table className="inventory-table">

      <thead>
        <tr>
          <th>Historial</th>
          <th>SKU</th>
          <th>EAN13</th>
          <th>Cantidad</th>
          <th>Acción</th>
          <th>Eliminar</th>
        </tr>
      </thead>
      <tbody>
        {items.map(item => (
          <tr key={item.id}>

            <td className="centered">
            <button
              onClick={() => verHistorial(item.id)}
              title="Ver historial"
              className="button-history"
            >
              ⏳
            </button>
            </td>


            <td>{item.sku}</td>
            <td>{item.ean13}</td>
            <td>{item.quantity}</td>
            <td className="centered">

            <button
              onClick={() => actualizarCantidad(item.id, item.quantity)}
              className="button-update"
            >
              Actualizar
            </button>

            </td>


            <td className="centered">
              <button
                onClick={() => eliminarProducto(item.id)}
                title="Eliminar producto"
                className="button-delete"
              >
                X
              </button>
            </td>


          </tr>
        ))}
      </tbody>

        </table>
      </div>
  
      {/* Botón añadir producto */}
      <div className="button-add-wrapper">
        <button
          onClick={() => setShowAddModal(true)}
          className="button-add"
        >
          Añadir producto
        </button>
      </div>



      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-title">Añadir nuevo producto</h3>

            <label className="modal-label">SKU:</label>
            <input
              className="modal-input"
              value={newSku}
              onChange={(e) => setNewSku(e.target.value)}
            />

            <label className="modal-label">EAN13:</label>
            <input
              className="modal-input"
              value={newEan13}
              onChange={(e) => setNewEan13(e.target.value)}
            />

            <label className="modal-label">Cantidad inicial:</label>
            <input
              type="number"
              className="modal-input-number"
              value={newQuantity}
              onChange={(e) => setNewQuantity(e.target.value)}
            />

            <button className="modal-button" onClick={añadirProducto}>
              Añadir
            </button>
            <button className="modal-button" onClick={() => setShowAddModal(false)}>
              Cancelar
            </button>
          </div>
        </div>
      )}


    </div>
  );
  
  

}

export default StockList;