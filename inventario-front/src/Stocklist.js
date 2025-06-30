import React, { useEffect, useState } from 'react';
import { DateTime } from 'luxon';

const API_URL = 'http://127.0.0.1:8000';

function StockList() {
  const [items, setItems] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSku, setNewSku] = useState('');
  const [newEan13, setNewEan13] = useState('');
  const [newQuantity, setNewQuantity] = useState('');

  useEffect(() => {
    cargarItems();
  }, []);

  const cargarItems = () => {
    fetch(${API_URL}/items)
      .then(res => res.json())
      .then(data => setItems(data))
      .catch(err => console.error('Error al cargar los items:', err));
  };

  const actualizarCantidad = async (id, cantidadActual) => {
    const nuevaCantidad = prompt('Introduce la nueva cantidad:', cantidadActual);
    const cantidad = parseInt(nuevaCantidad);

    if (isNaN(cantidad)) {
      alert('Cantidad no válida');
      return;
    }

    try {
      const res = await fetch(${API_URL}/items/${id}, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: cantidad })
      });

      if (!res.ok) {
        throw new Error('Error al actualizar');
      }

      const actualizado = await res.json();

      setItems(items.map(item => (item.id === id ? actualizado : item)));
      alert('Cantidad actualizada correctamente');
    } catch (err) {
      console.error(err);
      alert('Error al actualizar la cantidad');
    }
  };

  const verHistorial = async (id) => {
    try {
      const res = await fetch(`${API_URL}/movements`);
      const data = await res.json();
      const historial = data.filter(mov => mov.item_id === id);
  
      if (historial.length === 0) {
        alert('Este producto no tiene movimientos.');
      } else {
        const texto = historial.map(m => {
          const fechaMadrid = DateTime.fromISO(m.timestamp).setZone('Europe/Madrid').toFormat('d/M/yyyy HH:mm:ss');
          const unidades = Math.abs(m.amount);
          const tipo = m.type.charAt(0).toUpperCase() + m.type.slice(1);
          const usuario = m.user ? ` por ${m.user}` : '';
          return `${tipo} de ${unidades} unidad${unidades !== 1 ? 'es' : ''} el ${fechaMadrid}${usuario}`;
        }).join('\n');
  
        alert(`Historial del producto:\n\n${texto}`);
      }
    } catch (err) {
      console.error('Error al cargar historial:', err);
      alert('No se pudo cargar el historial');
    }
  };
  

  const eliminarProducto = async (id) => {
    if (!window.confirm("¿Seguro que quieres eliminar este producto? Se eliminarán también sus movimientos.")) return;

    try {
      const res = await fetch(${API_URL}/items/${id}, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al eliminar");

      setItems(items.filter(item => item.id !== id));
      alert("Producto eliminado correctamente");
    } catch (error) {
      console.error(error);
      alert("Error al eliminar producto");
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
      const res = await fetch(${API_URL}/items, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sku: newSku,
          ean13: newEan13,
          quantity: parseInt(newQuantity)
        }),
      });
      if (!res.ok) throw new Error('Error al añadir producto');
      const productoCreado = await res.json();
      setItems([...items, productoCreado]);
      setShowAddModal(false);
      setNewSku('');
      setNewEan13('');
      setNewQuantity('');
      alert('Producto añadido correctamente');
    } catch (error) {
      console.error(error);
      alert('No se pudo añadir el producto');
    }
  };

  return (
    <div style={{ position: 'relative', padding: '20px' }}>
      <h2>Listado de Inventario</h2>

      {/* Botón + */}
      <button
        title="Añadir producto"
        onClick={() => setShowAddModal(true)}
        style={{
          position: 'absolute',
          top: 20,
          right: 20,
          fontSize: 24,
          width: 40,
          height: 40,
          borderRadius: '50%',
          backgroundColor: '#4CAF50',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        +
      </button>

      {/* Modal añadir */}
      {showAddModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.3)',
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          zIndex: 9999,
        }}>
          <div style={{
            backgroundColor: 'white', padding: 20, borderRadius: 8,
            minWidth: 300,
          }}>
            <h3>Añadir nuevo producto</h3>
            <label>SKU:</label><br />
            <input value={newSku} onChange={e => setNewSku(e.target.value)} /><br />
            <label>EAN13:</label><br />
            <input value={newEan13} onChange={e => setNewEan13(e.target.value)} /><br />
            <label>Cantidad inicial:</label><br />
            <input type="number" value={newQuantity} onChange={e => setNewQuantity(e.target.value)} /><br /><br />
            <button onClick={añadirProducto} style={{ marginRight: 10 }}>Añadir</button>
            <button onClick={() => setShowAddModal(false)}>Cancelar</button>
          </div>
        </div>
      )}

      <table style={{ margin: '0 auto' }}>
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
              <td>
                <button onClick={() => verHistorial(item.id)} title="Ver historial">⏳</button>
              </td>
              <td>{item.sku}</td>
              <td>{item.ean13}</td>
              <td>{item.quantity}</td>
              <td>
                <button onClick={() => actualizarCantidad(item.id, item.quantity)}>Actualizar</button>
              </td>
              <td>
                <button
                  onClick={() => eliminarProducto(item.id)}
                  title="Eliminar producto"
                  style={{ color: "red", fontWeight: "bold", fontSize: "18px", cursor: "pointer" }}
                >
                  X
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default StockList;