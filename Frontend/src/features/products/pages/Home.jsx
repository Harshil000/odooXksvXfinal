import { useState, useContext } from 'react';
import { useNavigate } from 'react-router';
import { useProducts } from '../hooks/useProducts';
import { useCart } from '../../cart/hooks/useCart';
import CartDrawer from '../../cart/components/CartDrawer';
import Navbar from '../../dashboard/components/Navbar';
import { AuthContext } from '../../auth/auth.context';
import { removeProduct } from '../services/product.service';
import '../styles/Home.scss';

const Home = () => {
  const navigate = useNavigate();
  const { products, attributes, loading, error } = useProducts();
  const { totals } = useCart();
  const [cartOpen, setCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState({});

  const { user } = useContext(AuthContext);
  const isAdmin = user && (user.role === 'admin' || user.role === 'ADMIN');

  const handleDeleteProduct = async (e, p_id) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await removeProduct(p_id);
      alert('Product deleted successfully');
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert('Error deleting product: ' + err.message);
    }
  };

  // Group all attributes by name across all products
  const groupedFilters = {};
  (attributes || []).forEach(attr => {
    if (!groupedFilters[attr.attribute_name]) {
      groupedFilters[attr.attribute_name] = [];
    }
    if (!groupedFilters[attr.attribute_name].includes(attr.value_name)) {
      groupedFilters[attr.attribute_name].push(attr.value_name);
    }
  });

  const filteredProducts = (products || []).filter((product) => {
    // 1. Search filter
    const matchesSearch = product.pname.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    // 2. Publish status filter (Customers only see published ones)
    if (!isAdmin && product.to_publish === false) return false;

    // 3. Dynamic attributes sidebar filter
    for (const [attrName, selectedValue] of Object.entries(selectedFilters)) {
      if (selectedValue && selectedValue !== 'All') {
        const hasAttr = (attributes || []).some(attr =>
          attr.p_id === product.id &&
          attr.attribute_name === attrName &&
          attr.value_name === selectedValue
        );
        if (!hasAttr) return false;
      }
    }

    return true;
  });

  return (
    <div className="home-container dashboard-page">
      {/* Integrated Navbar */}
      <Navbar 
        activeSection="products" 
        searchQuery={searchQuery} 
        onSearchChange={setSearchQuery} 
        searchPlaceholder="Search products..." 
      />

      <div className="main-content">
        {/* Sidebar Filters */}
        <aside className="sidebar">
          {Object.keys(groupedFilters).map(attrName => (
            <div className="filter-group" key={attrName}>
              <label>{attrName}</label>
              <select 
                value={selectedFilters[attrName] || 'All'}
                onChange={(e) => setSelectedFilters({
                  ...selectedFilters,
                  [attrName]: e.target.value
                })}
              >
                <option value="All">All</option>
                {groupedFilters[attrName].map(val => (
                  <option key={val} value={val}>{val}</option>
                ))}
              </select>
            </div>
          ))}
          {Object.keys(groupedFilters).length === 0 && (
            <p className="no-filters-msg" style={{color: 'var(--text-muted)', fontSize: '0.85rem'}}>No attributes to filter.</p>
          )}
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
            {filteredProducts.map((product) => (
              <div 
                key={product.id} 
                className="product-card" 
                onClick={() => navigate(`/product/${product.id}`)}
                style={{ cursor: 'pointer' }}
              >
                <div className="image-container">
                  {isAdmin && (
                    <div className="admin-card-actions">
                      <button 
                        className="admin-edit-btn" 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          navigate(`/edit-product/${product.id}`); 
                        }}
                        title="Edit Product"
                      >
                        ✏️
                      </button>
                      <button 
                        className="admin-delete-btn" 
                        onClick={(e) => handleDeleteProduct(e, product.id)}
                        title="Delete Product"
                      >
                        🗑️
                      </button>
                    </div>
                  )}

                  {isAdmin && product.to_publish === false && (
                    <div className="unpublished-badge">Unpublished</div>
                  )}

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
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
};

export default Home;
