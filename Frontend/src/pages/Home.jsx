import  { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import './Home.scss';

const Home = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  
  // Checking user role from local storage or context would happen here
  const isAdmin = true; // Hardcoded to true for demo purposes to show the add button

  useEffect(() => {
    // Fetch products from backend
    const fetchProducts = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/products', {
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          // Transform backend product keys to match frontend mapping
          const formatted = data.products.map(p => ({
            id: p.p_id,
            image: p.image || 'https://via.placeholder.com/300x200?text=No+Image', 
            price: `Rs ${p.sales_price || p.price || 0}`,
            duration: 'Month', 
            colors: [], 
            outOfStock: p.quantity <= 0,
            pname: p.pname
          }));
          setProducts(formatted);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };
    fetchProducts();
  }, []);
  

  return (
    <div className="home-container">
      {/* Navbar */}
      <nav className="navbar">
        <div className="logo">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor"/>
            <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Your Logo
        </div>
        
        <div className="nav-links">
          <a href="#">Products</a>
          <a href="#">Terms & Condition</a>
          <a href="#">About us</a>
          <a href="#">Contact Us</a>
        </div>

        <div className="search-container">
          <input type="text" placeholder="Search..." />
          <button>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </button>
        </div>

        <div className="actions">
          <button className="icon-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
          </button>
          <button className="icon-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
            <span className="badge">0</span>
          </button>
          <div className="profile-avatar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </div>
        </div>
      </nav>

      <div className="main-content">
        {/* Sidebar Filters */}
        <aside className="sidebar">
          <div className="filter-group">
            <label>Brand</label>
            <select>
              <option>▼</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Color</label>
            <select>
              <option>▼</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Duration</label>
            <select>
              <option>▼</option>
            </select>
          </div>
          
          <div className="price-filter">
            <label>Price Range</label>
            <select style={{ alignSelf: 'flex-end', width: 'fit-content' }}>
              <option>▼</option>
            </select>
            <div className="range-labels">
              <span>$1.0</span>
              <span>$10000</span>
            </div>
            <input type="range" min="1" max="10000" />
          </div>
        </aside>

        {/* Product Grid */}
        <main className="products-area">
          <div className="area-header">
            <h1>Products</h1>
            {isAdmin && (
              <button className="add-product-btn" onClick={() => navigate('/add-product')}>
                + Add Product
              </button>
            )}
          </div>

          <div className="products-grid">
            {products.map((product) => (
              <div 
                key={product.id} 
                className="product-card" 
                onClick={() => navigate(`/product/${product.id}`)}
                style={{ cursor: 'pointer' }}
              >
                <div className="image-container">
                  {product.outOfStock ? (
                    <div className="out-of-stock-badge">Out of stock</div>
                  ) : (
                    <img src={product.image} alt="Product" />
                  )}
                  
                  {product.colors && product.colors.length > 0 && (
                    <div className="variants">
                      {product.colors.map((color, idx) => (
                        <div key={idx} className="variant-dot" style={{ backgroundColor: color }}></div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="product-info">
                  <div style={{fontWeight: 'bold', marginBottom: '0.5rem', color: 'var(--text-primary)'}}>{product.pname}</div>
                  <div className="price">{product.price} / per {product.duration}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="pagination">
            <button>&lt;</button>
            <button>1</button>
            <button>2</button>
            <span>...</span>
            <button>&gt;</button>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Home;
