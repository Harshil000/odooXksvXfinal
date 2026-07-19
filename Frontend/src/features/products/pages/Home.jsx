import { useState, useEffect, useRef, useContext } from 'react';
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
  const { products, attributes, loading, error, hasMore, loadMore } = useProducts();
  const { totals } = useCart();
  const [cartOpen, setCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState({});
  const observerRef = useRef(null);

  useEffect(() => {
    if (!hasMore || loading) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        loadMore();
      }
    }, { threshold: 1.0 });

    const currentTrigger = observerRef.current;
    if (currentTrigger) {
      observer.observe(currentTrigger);
    }

    return () => {
      if (currentTrigger) {
        observer.unobserve(currentTrigger);
      }
    };
  }, [hasMore, loading, loadMore]);

  const { user, showProductFilters } = useContext(AuthContext);
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
    // 0. Owner filter (Vendors only see self-created products)
    if (user && user.c_id && product.c_id !== user.c_id) return false;

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
        {showProductFilters && (
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
        )}

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

          {/* Scroll trigger / loading indicator */}
          <div ref={observerRef} className="infinite-scroll-trigger">
            {loading && <div className="loading-spinner">Loading more products...</div>}
            {!hasMore && products.length > 0 && <div className="no-more-products">No more products to display.</div>}
          </div>
        </main>
      </div>
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
};

export default Home;
