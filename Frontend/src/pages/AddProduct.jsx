import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import './AddProduct.scss';

const AddProduct = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('general');
  const [imagePreview, setImagePreview] = useState('');
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

  const [rentalData, setRentalData] = useState({
    periodicity: 'hourly', // ENUM: hourly, daily, nightly, weekly, monthly, yearly
    pickup: '',
    return: '',
    late_fees: '',
    security_deposit: '',
  });

  const [attributes, setAttributes] = useState([
    { name: '', values: '' }
  ]);

  useEffect(() => {
    const fetchContextAndAttributes = async () => {
      try {
        // Fetch logged-in user/vendor info to get actual c_id
        const userRes = await fetch('http://localhost:3000/api/auth/me', { credentials: 'include' });
        if (userRes.ok) {
          const userData = await userRes.json();
          const actualCId = userData.vendor?.c_id; // Vendors have c_id
          
          if (actualCId) {
            setCId(actualCId);
            
            // Now fetch attributes for this company
            const res = await fetch(`http://localhost:3000/api/attributes/company/${actualCId}`);
            if (res.ok) {
              const data = await res.json();
              setCompanyAttributes(data.attributes || []);
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch attributes or context", err);
      }
    };
    fetchContextAndAttributes();
  }, []);

  const handleCreateNewAttribute = () => {
    if (newAttributeName && newAttributeName.trim()) {
      const name = newAttributeName.trim();
      const existingAttr = companyAttributes.find(a => a.name.toLowerCase() === name.toLowerCase());
      if (!existingAttr) {
        setCompanyAttributes([...companyAttributes, { name }]);
      }
      setNewAttributeName('');
      setShowAttributeModal(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
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
      // 1. Create Base Product
      // Note: We use a hardcoded c_id for demo purposes (assuming company exists).
      // In reality, this comes from auth context/token.
      const productPayload = {
        c_id: c_id,
        pname: productData.pname,
        description: productData.description || 'No description',
        to_publish: productData.to_publish,
        quantity: Number(productData.quantity),
        product_type: salesData.product_type,
        sales_price: Number(salesData.sales_price || 0),
        cost_price: Number(salesData.cost_price || 0),
      };
      
      if (imagePreview) {
        productPayload.images = [imagePreview];
      }

      const resProduct = await fetch('http://localhost:3000/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(productPayload)
      });
      
      const productResponse = await resProduct.json();
      if (!resProduct.ok) throw new Error(productResponse.message);
      
      const p_id = productResponse.product.p_id;

      // 2. Create Rent Plan
      const rentPayload = {
        deposit: Number(rentalData.security_deposit || 0),
        penalty: Number(rentalData.late_fees || 0),
        price: Number(salesData.sales_price || 0),
        duration_type: rentalData.periodicity,
        pickup_time: rentalData.pickup || null,
        return_time: rentalData.return || null,
      };

      await fetch(`http://localhost:3000/api/rent-plans/product/${p_id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(rentPayload)
      });

      // 3. Create Attributes
      for (const attr of attributes) {
        if (attr.name.trim() && attr.values.trim()) {
          // Check if attribute name already exists for company
          let attri_id;
          const existingAttr = companyAttributes.find(a => a.name.toLowerCase() === attr.name.toLowerCase());
          
          if (existingAttr && existingAttr.attri_id) {
            attri_id = existingAttr.attri_id;
          } else {
            // Create Attribute for Company
            const attrRes = await fetch(`http://localhost:3000/api/attributes/company/${c_id}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ name: attr.name })
            });
            const attrData = await attrRes.json();
            attri_id = attrData.attribute.attri_id;
            
            // Also save locally so next iteration doesn't create duplicate
            setCompanyAttributes([...companyAttributes, attrData.attribute]);
          }
          
          // Link Attribute to Product
          await fetch(`http://localhost:3000/api/attributes/product/${p_id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ attri_id })
          });

          // Split comma separated values and create keys/values
          const vals = attr.values.split(',').map(v => v.trim());
          for (const val of vals) {
            // First create a key
            const keyRes = await fetch(`http://localhost:3000/api/attributes/${attri_id}/keys`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ key_name: val })
            });
            const keyData = await keyRes.json();
            const key_id = keyData.key.key_id;
            
            // Then create a value for the key
            await fetch(`http://localhost:3000/api/attributes/keys/${key_id}/values`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ value_name: val })
            });
          }
        }
      }

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
          </div>

          <div className="image-upload-box">
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleImageUpload} 
              style={{opacity: 0, position: 'absolute', inset: 0, cursor: 'pointer', zIndex: 10}}
            />
            {imagePreview ? <img src={imagePreview} alt="Preview" /> : <span>📸 Add Image</span>}
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
            <div className="flex-columns">
              <div className="column">
                <h3 className="section-title">Rental</h3>
                <div className="form-row">
                  <label>Periodicity</label>
                  <select value={rentalData.periodicity} onChange={(e) => setRentalData({...rentalData, periodicity: e.target.value})}>
                    <option value="hourly">Hours</option>
                    <option value="daily">Day</option>
                    <option value="nightly">Night</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                <div className="form-row">
                  <label>Pickup</label>
                  <input type="time" value={rentalData.pickup} onChange={(e) => setRentalData({...rentalData, pickup: e.target.value})} />
                </div>
                <div className="form-row">
                  <label>Return</label>
                  <input type="time" value={rentalData.return} onChange={(e) => setRentalData({...rentalData, return: e.target.value})} />
                </div>
                <div className="form-row" style={{marginTop: '2rem'}}>
                  <label>Late Fees $</label>
                  <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                    <input type="number" style={{minWidth: '80px'}} value={rentalData.late_fees} onChange={(e) => setRentalData({...rentalData, late_fees: e.target.value})} />
                    <span style={{color: 'var(--text-secondary)'}}>per hour late</span>
                  </div>
                </div>
              </div>
              <div className="column">
                <h3 className="section-title">Rental Deposit</h3>
                <div className="form-row">
                  <label>Security Deposit $</label>
                  <input type="number" value={rentalData.security_deposit} onChange={(e) => setRentalData({...rentalData, security_deposit: e.target.value})} />
                </div>
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
