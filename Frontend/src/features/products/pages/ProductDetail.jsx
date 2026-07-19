import { useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useProductDetails } from '../hooks/useProductDetails';
import { useCart } from '../../cart/hooks/useCart';
import CartDrawer from '../../cart/components/CartDrawer';
import Navbar from '../../dashboard/components/Navbar';
import { AuthContext } from '../../auth/auth.context';
import { removeProduct } from '../services/product.service';
import '../styles/ProductDetail.scss';

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

  const priceLabel = `Price: ₹${product.sales_price || product.cost_price || 0}`;

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

            <div className="description-section">
              <h3>Description</h3>
              <p>{product.description || 'No description available for this product.'}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProductDetail;

