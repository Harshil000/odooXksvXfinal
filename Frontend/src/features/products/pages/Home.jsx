import { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate } from 'react-router';
import { useProducts } from '../hooks/useProducts';
import { useCart } from '../../cart/hooks/useCart';
import CartDrawer from '../../cart/components/CartDrawer';
import Navbar from '../../dashboard/components/Navbar';
import { AuthContext } from '../../auth/auth.context';
import { removeProduct } from '../services/product.service';
import httpClient from '../../../shared/api/httpClient';
import { mapProductToCard } from '../utils/product.mapper';
import '../styles/Home.scss';

const Home = () => {
  const navigate = useNavigate();
  const { products, attributes, loading, error, hasMore, loadMore } = useProducts();
  const { totals } = useCart();
  const [cartOpen, setCartOpen] = useState(false);
  
  // Debounced search query states
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null); // null = not in search mode
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchInput);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchInput]);

  // Call backend search API when debounced query changes
  useEffect(() => {
    if (!debouncedSearchQuery.trim()) {
      setSearchResults(null); // clear search, show all products
      return;
    }
    let cancelled = false;
    setSearchLoading(true);
    httpClient
      .get('/products/search', { params: { q: debouncedSearchQuery } })
      .then((res) => {
        if (!cancelled) {
          const mapped = (res.data.products || []).map(mapProductToCard);
          setSearchResults(mapped);
        }
      })
      .catch((err) => {
        console.error('[Search] API error:', err);
        if (!cancelled) setSearchResults([]);
      })
      .finally(() => {
        if (!cancelled) setSearchLoading(false);
      });
    return () => { cancelled = true; };
  }, [debouncedSearchQuery]);

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

  // When searching: use backend search results; otherwise filter the locally-loaded list
  const baseProducts = searchResults !== null ? searchResults : (products || []);

  const filteredProducts = baseProducts.filter((product) => {
    // When in search mode, backend already filtered by query — just apply UI filters
    if (searchResults === null) {
      // 2. Publish status filter (Customers only see published ones)
      if (!isAdmin && product.to_publish === false) return false;
    }

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
        searchQuery={searchInput} 
        onSearchChange={setSearchInput} 
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

          {searchLoading ? (
            <div className="no-products-found" style={{ padding: "40px 20px", textAlign: "center", color: "#a1a1aa", fontSize: "16px", background: "#1e1e1e", borderRadius: "8px", border: "1px solid #27272a", marginTop: "20px" }}>
              Searching...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="no-products-found" style={{ padding: "40px 20px", textAlign: "center", color: "#a1a1aa", fontSize: "16px", background: "#1e1e1e", borderRadius: "8px", border: "1px solid #27272a", marginTop: "20px" }}>
              No product found
            </div>
          ) : (
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
          )}

          {/* Scroll trigger / loading indicator (only show when not in search mode) */}
          {searchResults === null && (
            <div ref={observerRef} className="infinite-scroll-trigger">
              {loading && <div className="loading-spinner">Loading more products...</div>}
              {!hasMore && products.length > 0 && <div className="no-more-products">No more products to display.</div>}
            </div>
          )}
        </main>
      </div>
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
};

export default Home;
