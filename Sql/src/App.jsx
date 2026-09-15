import { useEffect, useState } from 'react'
import './App.css'

const API_URL = 'http://localhost:3001'

function getProductRows(payload) {
  if (!Array.isArray(payload)) return []

  const rows = Array.isArray(payload[0]) ? payload[0] : payload
  return rows.filter((item) => item && typeof item === 'object' && !Array.isArray(item))
}

async function fetchProducts() {
  const response = await fetch(`${API_URL}/productos/crud`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accion: 'READ' }),
  })

  if (!response.ok) throw new Error('No se pudieron cargar los productos.')

  return getProductRows(await response.json())
}

function App() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [purchased, setPurchased] = useState(0)
  const [stockProduct, setStockProduct] = useState(null)
  const [stockQuantity, setStockQuantity] = useState('')
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function loadProducts() {
      try {
        setProducts(await fetchProducts())
      } catch (requestError) {
        setError(requestError.message || 'No se pudo conectar con el inventario.')
      } finally {
        setLoading(false)
      }
    }

    loadProducts()
  }, [])

  async function handleStockIncrease(event) {
    event.preventDefault()
    setFormError('')
    setSaving(true)

    try {
      const response = await fetch(`${API_URL}/productos/crud`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accion: 'ALTA_STOCK',
          id: stockProduct.id,
          stock_actual: Number(stockQuantity),
        }),
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'No se pudo añadir el producto.')

      setProducts(await fetchProducts())
      setStockProduct(null)
      setStockQuantity('')
    } catch (requestError) {
      setFormError(requestError.message || 'No se pudo añadir el producto.')
    } finally {
      setSaving(false)
    }
  }

  async function handlePurchase(id) {
    const productToBuy = products.find((product) => product.id === id)
    if (!productToBuy || Number(productToBuy.stock_actual) <= 0) return

    try {
      const response = await fetch(`${API_URL}/productos/crud`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accion: 'COMPRAR',
          id: id,
          stock_actual: 1
        }),
      })

      if (!response.ok) {
        throw new Error('Error al registrar la compra en el servidor.')
      }

      setProducts((currentProducts) =>
        currentProducts.map((product) => {
          if (product.id !== id) return product
          return { ...product, stock_actual: Number(product.stock_actual) - 1 }
        })
      )
      setPurchased((current) => current + 1)
    } catch (err) {
      console.error('Error al realizar la compra:', err)
      alert(err.message || 'No se pudo registrar la compra.')
    }
  }

  return (
    <main className="storefront">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Pepe Market inicio">
          <span className="brand-mark">P</span>
          <span>Pepe<span className="brand-accent">Market</span></span>
        </a>
        <div className="cart-status" aria-live="polite">
          <span className="cart-icon" aria-hidden="true">🛒</span>
          <span>{purchased} {purchased === 1 ? 'producto' : 'productos'}</span>
        </div>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Inventario fresco, compra sencilla</p>
          <h1>Lo que necesitas,<br /><em>justo aquí.</em></h1>
          <p className="hero-description">Explora nuestro inventario y encuentra tus favoritos antes de que se agoten.</p>
        </div>
        <div className="hero-badge" aria-label="Compra segura">
          <span>PEPE</span>
          <strong>market</strong>
          <small>DESDE 2024</small>
        </div>
      </section>

      <section className="catalog" aria-labelledby="catalog-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Selección del día</p>
            <h2 id="catalog-title">Nuestros productos</h2>
          </div>
          <div className="catalog-actions">
            <span className="product-count">{products.length} disponibles</span>
            <span className="catalog-hint">Selecciona un producto para aumentar su existencia</span>
          </div>
        </div>

        {stockProduct && (
          <div className="form-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setStockProduct(null)}>
            <form className="product-form" onSubmit={handleStockIncrease}>
              <div className="form-heading">
                <div>
                  <p className="eyebrow">Entrada de inventario</p>
                  <h2>Alta de stock</h2>
                  <p className="form-product-name">{stockProduct.nombre}</p>
                </div>
                <button type="button" className="close-button" aria-label="Cerrar formulario" onClick={() => setStockProduct(null)}>×</button>
              </div>
              <label className="stock-input-label">Cantidad a ingresar<input type="number" min="1" value={stockQuantity} onChange={(event) => setStockQuantity(event.target.value)} required autoFocus /></label>
              {formError && <p className="form-error">{formError}</p>}
              <div className="form-actions">
                <button type="button" className="cancel-button" onClick={() => setStockProduct(null)}>Cancelar</button>
                <button type="submit" className="buy-button" disabled={saving}>{saving ? 'Guardando...' : 'Registrar alta'}</button>
              </div>
            </form>
          </div>
        )}

        {loading && <p className="state-message">Cargando inventario...</p>}
        {error && <p className="state-message error-message">{error} Revisa que el backend esté encendido.</p>}
        {!loading && !error && products.length === 0 && (
          <p className="state-message">No hay productos disponibles por ahora.</p>
        )}

        <div className="product-grid">
          {products.map((product) => {
            const price = Number(product.precio) || 0
            const stock = Number(product.stock_actual) || 0
            const isPremium = price >= 100
            const isLowStock = stock <= 10

            return (
              <article className={`product-card ${isPremium ? 'premium' : ''}`} key={product.id}>
                <div className="product-topline">
                  <span className="product-label">{isPremium ? 'Selección especial' : 'Disponible'}</span>
                  <span className="product-id">#{String(product.id).padStart(3, '0')}</span>
                </div>
                <div className="product-symbol" aria-hidden="true">{isPremium ? '✦' : '＋'}</div>
                <h3>{product.nombre}</h3>
                <p className="product-description">{product.descripcion || 'Una opción práctica para tu día a día.'}</p>
                <div className="product-meta">
                  <div>
                    <span className="meta-label">Precio</span>
                    <strong className="price">${price.toFixed(2)}</strong>
                  </div>
                  <div className={`stock ${isLowStock ? 'low-stock' : ''}`}>
                    <span className="meta-label">Stock</span>
                    <strong>{stock} unidades</strong>
                  </div>
                </div>
                {isLowStock && <p className="stock-warning">Quedan pocos</p>}
                <div className="card-actions">
                  <button type="button" className="stock-button" onClick={() => { setStockProduct(product); setFormError(''); setStockQuantity('') }}>
                    <span aria-hidden="true">+</span> Alta de stock
                  </button>
                  <button type="button" className="buy-button" disabled={stock === 0} onClick={() => handlePurchase(product.id)}>
                    {stock === 0 ? 'Agotado' : 'Comprar'}
                    {stock > 0 && <span aria-hidden="true">→</span>}
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      </section>
    </main>
  )
}

export default App