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
    const token = localStorage.getItem("token");
    fetch(`${API_URL}/items`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(res => {
        console.log('Respuesta fetch:', res);
        if (!res.ok) throw new Error(`Error en fetch: ${res.status}`);
        return res.json();
      })
      .then(data => {
        console.log('Datos recibidos:', data);
        setItems(data);
      })
      .catch(err => {
        console.error('Error al cargar items:', err);
        alert('Error al cargar items. Mira la consola.');
      });
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
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/items/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
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
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/movements`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
  
      const data = await res.json();
      const historial = data.filter(mov => mov.item_id === id);
  
      // 🟨 Añade esto para inspeccionar los movimientos en consola
      console.log("🟨 Movimientos recibidos:", historial);
  
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
      console.error('Error al cargar historial:', err);
      alert('No se pudo cargar el historial');
    }
  };
  
  
  

  const eliminarProducto = async (id) => {
    if (!window.confirm("¿Seguro que quieres eliminar este producto? Se eliminarán también sus movimientos.")) return;
  
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/items/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

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
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
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
    <div style={{ position: 'relative', padding: '20px', textAlign: 'center' }}>
      <h2>Listado de Inventario</h2>
    
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
      <table style={{
        borderCollapse: 'collapse',
        fontSize: '18px',
        width: '100%',
        maxWidth: '900px',
      }}>

      <thead>
        <tr>
          <th style={{ padding: '12px' }}>Historial</th>
          <th style={{ padding: '12px' }}>SKU</th>
          <th style={{ padding: '12px' }}>EAN13</th>
          <th style={{ padding: '12px' }}>Cantidad</th>
          <th style={{ padding: '12px' }}>Acción</th>
          <th style={{ padding: '12px' }}>Eliminar</th>
        </tr>
      </thead>
      <tbody>
        {items.map(item => (
          <tr key={item.id}>
            <td style={{ padding: '12px' }}>
              <button onClick={() => verHistorial(item.id)} title="Ver historial" style={{ fontSize: '16px' }}>⏳</button>
            </td>
            <td style={{ padding: '12px' }}>{item.sku}</td>
            <td style={{ padding: '12px' }}>{item.ean13}</td>
            <td style={{ padding: '12px' }}>{item.quantity}</td>
            <td style={{ padding: '12px' }}>
              <button
                onClick={() => actualizarCantidad(item.id, item.quantity)}
                style={{ padding: '8px 16px', fontSize: '16px' }}
              >
                Actualizar
              </button>
            </td>
            <td style={{ padding: '12px' }}>
              <button
                onClick={() => eliminarProducto(item.id)}
                title="Eliminar producto"
                style={{
                  color: "red",
                  fontWeight: "bold",
                  fontSize: "18px",
                  cursor: "pointer",
                  padding: "4px 10px"
                }}
              >
                X
              </button>
            </td>
          </tr>
        ))}
      </tbody>

        </table>
      </div>
  
      {/* Botón añadir */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 20 }}>
        <button
          title="Añadir producto"
          onClick={() => setShowAddModal(true)}
          style={{
            fontSize: 24,
            width: 50,
            height: 50,
            borderRadius: '50%',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            userSelect: 'none',
            boxShadow: '0 0 8px #4CAF50',
          }}
        >
          +
        </button>
      </div>
  
      
      {showAddModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.3)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              padding: 40,
              borderRadius: 8,
              minWidth: 400,
              minHeight: 350,
              fontSize: 16,
            }}
          >
            <h3 style={{ marginBottom: 20 }}>Añadir nuevo producto</h3>
  
            <label style={{ marginBottom: 8, display: 'block' }}>SKU:</label>
            <input
              style={{ fontSize: 16, padding: 6, width: '100%', marginBottom: 16 }}
              value={newSku}
              onChange={(e) => setNewSku(e.target.value)}
            />
  
            <label style={{ marginBottom: 8, display: 'block' }}>EAN13:</label>
            <input
              style={{ fontSize: 16, padding: 6, width: '100%', marginBottom: 16 }}
              value={newEan13}
              onChange={(e) => setNewEan13(e.target.value)}
            />
  
            <label style={{ marginBottom: 8, display: 'block' }}>Cantidad inicial:</label>
            <input
              type="number"
              style={{ fontSize: 16, padding: 6, width: '100%', marginBottom: 24 }}
              value={newQuantity}
              onChange={(e) => setNewQuantity(e.target.value)}
            />
  
            <button
              onClick={añadirProducto}
              style={{ marginRight: 10, padding: '8px 16px', fontSize: 16, cursor: 'pointer' }}
            >
              Añadir
            </button>
            <button
              onClick={() => setShowAddModal(false)}
              style={{ padding: '8px 16px', fontSize: 16, cursor: 'pointer' }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
  
  

}

export default StockList;