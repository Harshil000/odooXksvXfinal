import { useState, useContext, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useProductDetails } from '../hooks/useProductDetails';
import { useCart } from '../../cart/hooks/useCart';
import CartDrawer from '../../cart/components/CartDrawer';
import Navbar from '../../dashboard/components/Navbar';
import { AuthContext } from '../../auth/auth.context';
import { removeProduct } from '../services/product.service';
import '../styles/ProductDetail.scss';

/**
 * Convert any date or ISO string to local YYYY-MM-DDTHH:MM representation in IST timezone (+05:30).
 */
function toISTString(dateInput) {
  if (!dateInput) return "";
  const date = new Date(dateInput);
  // Add +05:30 offset
  const offsetMs = 5.5 * 60 * 60 * 1000;
  const localTime = new Date(date.getTime() + offsetMs);
  return localTime.toISOString().slice(0, 16);
}

/**
 * Parses a local datetime-local value as an explicit IST timezone (+05:30) date, returning its ISO UTC string.
 */
function parseISTToUTC(dateStr) {
  if (!dateStr) return null;
  const hasTimezone = dateStr.includes("Z") || dateStr.match(/[+-]\d{2}:\d{2}$/);
  const targetStr = hasTimezone ? dateStr : `${dateStr}:00+05:30`;
  return new Date(targetStr).toISOString();
}

const ProductDetail = () => {
  const { p_id } = useParams();
  const navigate = useNavigate();
  const { 
    product, 
    image, 
    images, 
    variants, 
    attributes, 
    rentPlans, 
    selectedPlanId, 
    setSelectedPlanId 
  } = useProductDetails(p_id);
  
  const { addToCart, totals } = useCart();
  const [cartOpen, setCartOpen] = useState(false);
  
  // Image Swiper State
  const [currentImgIndex, setCurrentImgIndex] = useState(0);

  // Form State
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [quantity, setQuantity] = useState(1);

  const { user } = useContext(AuthContext);
  const isAdmin = user && (user.role === 'admin' || user.role === 'ADMIN');

  // Date limit checks
  const minDateTime = useMemo(() => {
    return toISTString(new Date());
  }, []);

  const handleAddToCart = async () => {
    if (!selectedPlanId) return alert("Please select a Rental Plan.");
    if (!startDate || !endDate) return alert("Please select rental start and end dates.");
    
    const now = new Date();
    const startUTC = new Date(parseISTToUTC(startDate));
    const endUTC = new Date(parseISTToUTC(endDate));
    
    if (startUTC < now) {
      return alert("Start date and time cannot be in the past.");
    }
    if (endUTC <= startUTC) {
      return alert("End date must be after Start date.");
    }

    const success = await addToCart(p_id, selectedPlanId, quantity, startUTC.toISOString(), endUTC.toISOString());
    if (success) {
      setCartOpen(true);
    }
  };

  const handleWishlist = () => {
    console.log("Added to wishlist:", p_id);
    alert(`Added ${product?.pname || 'Product'} to wishlist!`);
  };

  const handleDeleteProduct = async () => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      await removeProduct(p_id);
      alert("Product deleted successfully");
      navigate("/");
    } catch (err) {
      console.error(err);
      alert("Error deleting product: " + err.message);
    }
  };

  if (!product) {
    return (
      <div className="product-detail-container loading">
        <p>Loading product details...</p>
      </div>
    );
  }

  const selectedPlan = rentPlans.find(p => p.r_id === selectedPlanId);
  const priceLabel = selectedPlan 
    ? `(₹${selectedPlan.price} / per ${selectedPlan.duration_type})` 
    : `(₹${product.sales_price || product.cost_price || 0} / per ${product.duration || 'month'})`;

  // Parse and group all attributes across all variants of this product name
  const groupedAttributes = {};
  attributes.forEach(attr => {
    if (!groupedAttributes[attr.attribute_name]) {
      groupedAttributes[attr.attribute_name] = [];
    }
    if (!groupedAttributes[attr.attribute_name].some(v => v.value === attr.value_name)) {
      groupedAttributes[attr.attribute_name].push({
        value: attr.value_name,
        key_id: attr.key_id
      });
    }
  });

  // Determine current active attribute values for this exact product
  const currentProductAttributes = {};
  attributes.forEach(attr => {
    if (attr.p_id === p_id) {
      currentProductAttributes[attr.attribute_name] = attr.value_name;
    }
  });

  // Handle changing an attribute value -> redirects to the matching variant
  const handleAttributeChange = (attributeName, newValue) => {
    const nextSelected = {
      ...currentProductAttributes,
      [attributeName]: newValue
    };

    // Find the variant that matches the next selected attributes as closely as possible
    const bestVariant = variants.find(variant => {
      const variantAttrs = attributes.filter(a => a.p_id === variant.p_id);
      return Object.keys(nextSelected).every(attrName => {
        const matchingAttr = variantAttrs.find(a => a.attribute_name === attrName);
        return matchingAttr && matchingAttr.value_name === nextSelected[attrName];
      });
    });

    if (bestVariant) {
      setCurrentImgIndex(0);
      navigate(`/product/${bestVariant.p_id}`);
    } else {
      // Fallback: Find any variant that has the selected attribute value
      const backupVariant = variants.find(variant => {
        const variantAttrs = attributes.filter(a => a.p_id === variant.p_id);
        const matchingAttr = variantAttrs.find(a => a.attribute_name === attributeName);
        return matchingAttr && matchingAttr.value_name === newValue;
      });
      if (backupVariant) {
        setCurrentImgIndex(0);
        navigate(`/product/${backupVariant.p_id}`);
      }
    }
  };

  const allImages = Array.from(new Set(images && images.length > 0 ? images : (image ? [image] : [])));

  return (
    <div className="product-detail-container dashboard-page">
      {/* Unified Navbar */}
      <Navbar activeSection="products" />

      {/* Main Detail Area */}
      <main className="product-detail-main">
        <div className="breadcrumb">
          All Product / {product.pname}
        </div>
        
        <div className="detail-layout">
          {/* Left Column: Swipeable Images */}
          <div className="image-column">
            <div className="image-box swiper-container">
              {allImages.length > 0 ? (
                <>
                  <img src={allImages[currentImgIndex]} alt={product.pname} className="swiper-image" />
                  {allImages.length > 1 && (
                    <>
                      <button 
                        className="swiper-arrow left" 
                        onClick={() => setCurrentImgIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1))}
                        type="button"
                      >
                        &#10094;
                      </button>
                      <button 
                        className="swiper-arrow right" 
                        onClick={() => setCurrentImgIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1))}
                        type="button"
                      >
                        &#10095;
                      </button>
                      <div className="swiper-dots">
                        {allImages.map((_, idx) => (
                          <span 
                            key={idx} 
                            className={`swiper-dot ${idx === currentImgIndex ? 'active' : ''}`}
                            onClick={() => setCurrentImgIndex(idx)}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="no-image">No Image Available</div>
              )}
            </div>
          </div>
          
          {/* Right Column: Details & Actions */}
          <div className="info-column">
            <div className="product-header-row">
              <div>
                <h1 className="product-title">{product.pname}</h1>
                <p className="product-id">ID: {product.p_id.substring(0, 8).toUpperCase()}</p>
              </div>
              {isAdmin && (
                <div className="admin-detail-actions">
                  <button 
                    className="admin-edit-btn" 
                    onClick={() => navigate(`/edit-product/${p_id}`)}
                    type="button"
                  >
                    ✏️ Edit
                  </button>
                  <button 
                    className="admin-delete-btn" 
                    onClick={handleDeleteProduct}
                    type="button"
                  >
                    🗑️ Delete
                  </button>
                </div>
              )}
            </div>

            <p className="price-label">{priceLabel}</p>

            {/* Attributes Side/Variant Table with Dropdown Menus */}
            {Object.keys(groupedAttributes).length > 0 && (
              <div className="side-attributes-section">
                <h3>Attributes & Variants</h3>
                <table className="side-attributes-table">
                  <tbody>
                    {Object.keys(groupedAttributes).map(attrName => (
                      <tr key={attrName}>
                        <td className="attr-name">{attrName}</td>
                        <td className="attr-value">
                          <select 
                            value={currentProductAttributes[attrName] || ''} 
                            onChange={(e) => handleAttributeChange(attrName, e.target.value)}
                            className="attr-select"
                          >
                            {groupedAttributes[attrName].map(opt => (
                              <option key={opt.value} value={opt.value}>
                                {opt.value}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="action-box">
              <div className="rental-period">
                <label>Rental Period (IST)</label>
                <div className="date-inputs">
                  <input 
                    type="datetime-local" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    min={minDateTime}
                  />
                  <span className="arrow">➔</span>
                  <input 
                    type="datetime-local" 
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate || minDateTime}
                  />
                </div>
              </div>

              <div className="bottom-actions">
                <div className="quantity-selector">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} type="button">-</button>
                  <span>{quantity}</span>
                  <button onClick={() => setQuantity(quantity + 1)} type="button">+</button>
                </div>
                
                <button className="add-cart-btn" onClick={handleAddToCart} type="button">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="9" cy="21" r="1"></circle>
                    <circle cx="20" cy="21" r="1"></circle>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                  </svg>
                  Add to cart
                </button>
                
                <button className="icon-btn-bordered" onClick={handleWishlist} type="button">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="description-section">
              <h3>Description</h3>
              <p>{product.description || 'No description available for this product.'}</p>
            </div>
            
            {rentPlans.length > 0 && (
              <div className="rent-plans-section">
                <h3>Rental Plans</h3>
                <table className="rent-plans-table">
                  <thead>
                    <tr>
                      <th style={{width: '40px'}}>Select</th>
                      <th>Duration</th>
                      <th>Price</th>
                      <th>Deposit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rentPlans.map(plan => (
                      <tr key={plan.r_id} onClick={() => setSelectedPlanId(plan.r_id)} style={{cursor: 'pointer'}}>
                        <td>
                          <input 
                            type="radio" 
                            name="rent_plan" 
                            checked={selectedPlanId === plan.r_id} 
                            onChange={() => setSelectedPlanId(plan.r_id)} 
                            style={{cursor: 'pointer'}}
                          />
                        </td>
                        <td style={{ textTransform: 'capitalize' }}>{plan.duration_type}</td>
                        <td>₹{plan.price}</td>
                        <td>₹{plan.deposit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
};

export default ProductDetail;

