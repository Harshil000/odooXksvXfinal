import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { getCurrentUser } from '../../auth/services/auth.api';
import { createCompanyAttribute } from '../../attributes/api/attribute.api';
import { loadCompanyAttributes, saveProductAttributes } from '../../attributes/services/attribute.service';
import { saveProduct } from '../services/product.service';
import { saveRentPlans } from '../../rentPlans/services/rentPlan.service';
import { buildProductPayload } from '../utils/productPayload.util';
import '../styles/AddProduct.scss';

const AddProduct = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('general');
  const [imagePreviews, setImagePreviews] = useState([]);
  const [companyAttributes, setCompanyAttributes] = useState([]);
  const [c_id, setCId] = useState(null);
  const [showAttributeModal, setShowAttributeModal] = useState(false);
  const [newAttributeName, setNewAttributeName] = useState('');
  
  // Form State
  const [productData, setProductData] = useState({
    pname: '',
    description: '',
    quantity: 100,
    to_publish: true,
  });

  const [salesData, setSalesData] = useState({
    product_type: 'Goods',
    sales_price: '',
    cost_price: '',
  });

  const [rentPlans, setRentPlans] = useState([{
    periodicity: 'hourly',
    price: '',
    pickup: '',
    return: '',
    late_fees: '',
    security_deposit: '',
  }]);

  const [attributes, setAttributes] = useState([
    { name: '', values: '' }
  ]);

  useEffect(() => {
    const fetchContextAndAttributes = async () => {
      try {
        const userData = await getCurrentUser();
        const actualCId = userData.vendor?.c_id;

        if (actualCId) {
          setCId(actualCId);
          const attributes = await loadCompanyAttributes(actualCId);
          setCompanyAttributes(attributes);
        }
      } catch (err) {
        console.error("Failed to fetch attributes or context", err);
      }
    };
    fetchContextAndAttributes();
  }, []);

  const handleCreateNewAttribute = async () => {
    if (!c_id) {
      alert("Company context is required before creating attributes.");
      return;
    }

    if (newAttributeName && newAttributeName.trim()) {
      const name = newAttributeName.trim();
      const existingAttr = companyAttributes.find(a => a.name.toLowerCase() === name.toLowerCase());
      if (!existingAttr) {
        try {
          const response = await createCompanyAttribute(c_id, { name });
          setCompanyAttributes([...companyAttributes, response.attribute]);
        } catch (error) {
          console.error(error);
          alert("Error creating attribute: " + (error.message || "Unable to create attribute"));
          return;
        }
      }
      setNewAttributeName('');
      setShowAttributeModal(false);
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length) {
      Promise.all(files.map((file) => new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(file);
      }))).then((images) => {
        setImagePreviews((current) => [...current, ...images]);
      });
    }
  };

  const addAttributeLine = () => {
    setAttributes([...attributes, { name: '', values: '' }]);
  };

  const handleSave = async () => {
    if (!c_id) {
      alert("Error: No company context found. Please ensure you are logged in as a vendor/admin.");
      return;
    }

    try {
      const productPayload = buildProductPayload({
        companyId: c_id,
        productData,
        salesData,
        imagePreviews,
      });

      const product = await saveProduct(productPayload);
      const p_id = product.p_id;

      await saveRentPlans(p_id, rentPlans);
      const savedAttributes = await saveProductAttributes({
        companyId: c_id,
        productId: p_id,
        attributes,
        companyAttributes,
      });
      setCompanyAttributes(savedAttributes);

      alert('Product added successfully!');
      navigate('/');
    } catch (error) {
      console.error(error);
      alert('Error saving product: ' + error.message);
    }
  };

  return (
    <div className="add-product-container">
      <div className="header-actions">
        <button className="btn-cancel" onClick={() => navigate('/')}>Discard</button>
        <button className="btn-save" onClick={handleSave}>Save</button>
      </div>

      <div className="form-card">
        <div className="top-section">
          <div className="title-section">
            <div>
              <span className="type-badge">New</span>
              <h2>Product</h2>
              <div className="status-icons">
                <span>☑</span> <span className="error-icon">☒</span>
              </div>
            </div>
            
            <label style={{display: 'block', marginTop: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem'}}>Product Name</label>
            <input 
              type="text" 
              className="product-name-input" 
              placeholder="e.g. Computers"
              value={productData.pname}
              onChange={(e) => setProductData({...productData, pname: e.target.value})}
            />
            <label style={{display: 'block', marginTop: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem'}}>Description</label>
            <textarea
              className="product-description-input"
              placeholder="Add product description"
              value={productData.description}
              onChange={(e) => setProductData({...productData, description: e.target.value})}
            />
          </div>

          <div className="image-upload-box">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              style={{opacity: 0, position: 'absolute', inset: 0, cursor: 'pointer', zIndex: 10}}
            />
            {imagePreviews.length ? (
              <div className="image-preview-grid">
                {imagePreviews.slice(0, 4).map((image, index) => (
                  <img src={image} alt={`Preview ${index + 1}`} key={`${image.slice(0, 24)}-${index}`} />
                ))}
                {imagePreviews.length > 4 && <span className="image-count">+{imagePreviews.length - 4}</span>}
              </div>
            ) : <span>Add Images</span>}
          </div>
        </div>

        <div className="tabs">
          <button className={activeTab === 'general' ? 'active' : ''} onClick={() => setActiveTab('general')}>General Information</button>
          <button className={activeTab === 'attributes' ? 'active' : ''} onClick={() => setActiveTab('attributes')}>Attributes & Variants</button>
          <button className={activeTab === 'sales' ? 'active' : ''} onClick={() => setActiveTab('sales')}>Sales</button>
        </div>

        <div className="tab-content">
          {activeTab === 'general' && (
            <div className="flex-columns">
              <div className="column">
                <div className="form-row">
                  <label>Product Type</label>
                  <div className="radio-group">
                    <label>
                      <input type="radio" name="type" checked={salesData.product_type === 'Goods'} onChange={() => setSalesData({...salesData, product_type: 'Goods'})}/> Goods
                    </label>
                    <label>
                      <input type="radio" name="type" checked={salesData.product_type === 'Service'} onChange={() => setSalesData({...salesData, product_type: 'Service'})}/> Service
                    </label>
                  </div>
                </div>
                <div className="form-row">
                  <label>Quantity on Hand</label>
                  <input type="number" value={productData.quantity} onChange={(e) => setProductData({...productData, quantity: e.target.value})} />
                </div>
                <div className="form-row" style={{marginTop: '2rem'}}>
                  <label>Sales Price $</label>
                  <input type="number" value={salesData.sales_price} onChange={(e) => setSalesData({...salesData, sales_price: e.target.value})} />
                </div>
                <div className="form-row">
                  <label>Cost Price $</label>
                  <input type="number" value={salesData.cost_price} onChange={(e) => setSalesData({...salesData, cost_price: e.target.value})} />
                </div>
              </div>
              <div className="column">
                <div className="form-row">
                  <label>Publish</label>
                  <label className="toggle-switch">
                    <input type="checkbox" checked={productData.to_publish} onChange={(e) => setProductData({...productData, to_publish: e.target.checked})} />
                    <span className="slider"></span>
                  </label>
                </div>
                <p style={{color: 'var(--text-secondary)', fontSize: '0.8rem', marginLeft: '150px'}}>Only Admin should have the right to publish or unpublish a product</p>
              </div>
            </div>
          )}

          {activeTab === 'attributes' && (
            <div>
              <div style={{display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem'}}>
                <button 
                  className="btn-save" 
                  style={{fontSize: '0.85rem', padding: '0.4rem 1rem'}}
                  onClick={() => setShowAttributeModal(true)}
                >
                  + Create New Attribute
                </button>
              </div>
              <table className="attributes-table">
                <thead>
                  <tr>
                    <th>Name of the Attributes (Brand, color, Size...)</th>
                    <th>List of possible values (e.g. Red, Green, Blue..)</th>
                    <th style={{width: '50px'}}>Configure</th>
                  </tr>
                </thead>
                <tbody>
                  {attributes.map((attr, index) => (
                    <tr key={index}>
                      <td>
                        <input 
                          type="text" 
                          list="company-attributes-list"
                          value={attr.name} 
                          onChange={(e) => {
                            const newAttrs = [...attributes];
                            newAttrs[index].name = e.target.value;
                            setAttributes(newAttrs);
                          }} 
                          placeholder="e.g. Color" 
                        />
                      </td>
                      <td>
                        <input type="text" value={attr.values} onChange={(e) => {
                          const newAttrs = [...attributes];
                          newAttrs[index].values = e.target.value;
                          setAttributes(newAttrs);
                        }} placeholder="Red, Green" />
                      </td>
                      <td>
                        <button className="btn-icon" onClick={() => {
                          const newAttrs = attributes.filter((_, i) => i !== index);
                          setAttributes(newAttrs);
                        }}>🗑</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <datalist id="company-attributes-list">
                {companyAttributes.map(ca => (
                  <option key={ca.attri_id} value={ca.name} />
                ))}
              </datalist>
              <button className="add-line-btn" onClick={addAttributeLine}>Add a line</button>
            </div>
          )}

          {activeTab === 'sales' && (
            <div className="rent-plans-container" style={{display: 'flex', flexDirection: 'column', gap: '2rem'}}>
              {rentPlans.map((plan, index) => (
                <div key={index} className="flex-columns" style={{border: '1px solid var(--border)', padding: '1rem', borderRadius: '8px', position: 'relative'}}>
                  {rentPlans.length > 1 && (
                    <button 
                      onClick={() => setRentPlans(rentPlans.filter((_, i) => i !== index))}
                      style={{position: 'absolute', top: '10px', right: '10px', background: 'transparent', border: 'none', color: 'red', cursor: 'pointer'}}
                    >
                      🗑 Remove
                    </button>
                  )}
                  <div className="column">
                    <h3 className="section-title">Rental Plan {index + 1}</h3>
                    <div className="form-row">
                      <label>Periodicity</label>
                      <select value={plan.periodicity} onChange={(e) => {
                        const newPlans = [...rentPlans];
                        newPlans[index].periodicity = e.target.value;
                        setRentPlans(newPlans);
                      }}>
                        <option value="hourly">Hours</option>
                        <option value="daily">Day</option>
                        <option value="nightly">Night</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                      </select>
                    </div>
                    <div className="form-row">
                      <label>Price for this Duration $</label>
                      <input type="number" value={plan.price} onChange={(e) => {
                        const newPlans = [...rentPlans];
                        newPlans[index].price = e.target.value;
                        setRentPlans(newPlans);
                      }} />
                    </div>
                    <div className="form-row">
                      <label>Pickup</label>
                      <input type="time" value={plan.pickup} onChange={(e) => {
                        const newPlans = [...rentPlans];
                        newPlans[index].pickup = e.target.value;
                        setRentPlans(newPlans);
                      }} />
                    </div>
                    <div className="form-row">
                      <label>Return</label>
                      <input type="time" value={plan.return} onChange={(e) => {
                        const newPlans = [...rentPlans];
                        newPlans[index].return = e.target.value;
                        setRentPlans(newPlans);
                      }} />
                    </div>
                  </div>
                  <div className="column" style={{marginTop: '2.5rem'}}>
                    <div className="form-row">
                      <label>Late Fees $</label>
                      <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                        <input type="number" style={{minWidth: '80px'}} value={plan.late_fees} onChange={(e) => {
                          const newPlans = [...rentPlans];
                          newPlans[index].late_fees = e.target.value;
                          setRentPlans(newPlans);
                        }} />
                        <span style={{color: 'var(--text-secondary)'}}>per {plan.periodicity} late</span>
                      </div>
                    </div>
                    <div className="form-row" style={{marginTop: '1rem'}}>
                      <label>Security Deposit $</label>
                      <input type="number" value={plan.security_deposit} onChange={(e) => {
                        const newPlans = [...rentPlans];
                        newPlans[index].security_deposit = e.target.value;
                        setRentPlans(newPlans);
                      }} />
                    </div>
                  </div>
                </div>
              ))}
              <div style={{display: 'flex', justifyContent: 'center'}}>
                <button 
                  className="btn-save" 
                  onClick={() => setRentPlans([...rentPlans, { periodicity: 'monthly', price: '', pickup: '', return: '', late_fees: '', security_deposit: '' }])}
                >
                  + Add Extra Rent Plan
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {showAttributeModal && (
        <div className="attribute-modal-overlay">
          <div className="attribute-modal-content">
            <h3>Create New Attribute</h3>
            <p>Enter a name for the new attribute (e.g., Color, Size, Brand)</p>
            <input 
              type="text" 
              value={newAttributeName}
              onChange={(e) => setNewAttributeName(e.target.value)}
              placeholder="Attribute Name"
              autoFocus
            />
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowAttributeModal(false)}>Cancel</button>
              <button className="btn-save" onClick={handleCreateNewAttribute}>Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddProduct;

