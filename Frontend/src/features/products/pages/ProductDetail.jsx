import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useProductDetails } from '../hooks/useProductDetails';
import { useCart } from '../../cart/hooks/useCart';
import CartDrawer from '../../cart/components/CartDrawer';
import '../styles/ProductDetail.scss';

const ProductDetail = () => {
  const { p_id } = useParams();
  const navigate = useNavigate();
  const { product, image, rentPlans, selectedPlanId, setSelectedPlanId } = useProductDetails(p_id);
  const { addToCart, totals } = useCart();
  const [cartOpen, setCartOpen] = useState(false);
  
  // Form State
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [quantity, setQuantity] = useState(1);

  const handleAddToCart = async () => {
    if (!selectedPlanId) return alert("Please select a Rental Plan.");
    if (!startDate || !endDate) return alert("Please select rental start and end dates.");
    if (new Date(endDate) <= new Date(startDate)) return alert("End date must be after start date.");

    const success = await addToCart(p_id, selectedPlanId, quantity, new Date(startDate).toISOString(), new Date(endDate).toISOString());
    if (success) {
      setCartOpen(true);
    }
  };

  const handleWishlist = () => {
    console.log("Added to wishlist:", p_id);
    alert(`Added ${product?.pname || 'Product'} to wishlist!`);
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
    ? `(Rs ${selectedPlan.price} / per ${selectedPlan.duration_type})` 
    : `(Rs ${product.sales_price || product.cost_price || 0} / per ${product.duration || 'month'})`;

  return (
    <div className="product-detail-container">
      {/* Navbar - Reused style from Home */}
      <nav className="navbar">
        <div className="logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor"/>
            <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Your Logo
        </div>
        
        <div className="nav-links">
          <a href="#" onClick={(e) => { e.preventDefault(); navigate('/'); }}>Products</a>
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
          <button className="icon-btn" onClick={handleWishlist}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
          </button>
          <button className="icon-btn" onClick={() => setCartOpen(true)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
            <span className="badge">{totals.totalItemsCount}</span>
          </button>
          <div className="profile-avatar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </div>
        </div>
      </nav>

      {/* Main Detail Area */}
      <main className="product-detail-main">
        <div className="breadcrumb">
          All Product / {product.pname}
        </div>
        
        <div className="detail-layout">
          {/* Left Column: Image */}
          <div className="image-column">
            <div className="image-box">
              {image ? (
                <img src={image} alt={product.pname} />
              ) : (
                <div className="no-image">No Image Available</div>
              )}
            </div>
          </div>
          
          {/* Right Column: Details & Actions */}
          <div className="info-column">
            <h1 className="product-title">{product.pname}</h1>
            <p className="product-id">ID: {product.p_id.substring(0, 8).toUpperCase()}</p>
            <p className="price-label">{priceLabel}</p>

            <div className="action-box">
              <div className="rental-period">
                <label>Rental Period (UTC + 01:00)</label>
                <div className="date-inputs">
                  <input 
                    type="datetime-local" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                  <span className="arrow">➔</span>
                  <input 
                    type="datetime-local" 
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="bottom-actions">
                <div className="quantity-selector">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
                  <span>{quantity}</span>
                  <button onClick={() => setQuantity(quantity + 1)}>+</button>
                </div>
                
                <button className="add-cart-btn" onClick={handleAddToCart}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="9" cy="21" r="1"></circle>
                    <circle cx="20" cy="21" r="1"></circle>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                  </svg>
                  Add to cart
                </button>
                
                <button className="icon-btn-bordered" onClick={handleWishlist}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                  </svg>
                </button>

                <button className="icon-btn-bordered">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="3" y1="12" x2="21" y2="12"></line>
                    <line x1="3" y1="6" x2="21" y2="6"></line>
                    <line x1="3" y1="18" x2="21" y2="18"></line>
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
                        <td>Rs {plan.price}</td>
                        <td>Rs {plan.deposit}</td>
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
