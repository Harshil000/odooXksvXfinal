export function registerValidation(req, res, next) {
  const { first_name, last_name, email, password, role } = req.body;
  const errors = [];

  const finalFirstName = (first_name || "").trim();
  const finalLastName = (last_name || "").trim();
  
  if (!finalFirstName) {
    errors.push({ msg: "First name is required" });
  }

  if (!finalLastName) {
    errors.push({ msg: "Last name is required" });
  }

  if (!email || !email.trim()) {
    errors.push({ msg: "Email is required" });
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      errors.push({ msg: "Invalid email format" });
    }
  }

  if (!password || password.length < 6) {
    errors.push({ msg: "Password must be at least 6 characters long" });
  }

  // If registering a vendor, either c_id or complete company details are required
  if (role === "vendor" || role === "admin") {
    const { c_id, cname, gst_no, product_category, pincode, city, state, address_line1 } = req.body;
    
    if (!c_id) {
      if (!cname || !cname.trim()) errors.push({ msg: "Company name is required for vendor registration if not providing c_id" });
      if (!gst_no || !gst_no.trim()) errors.push({ msg: "GST number is required for vendor registration if not providing c_id" });
      if (!product_category || !product_category.trim()) errors.push({ msg: "Product category is required for vendor registration if not providing c_id" });
      if (!pincode || !pincode.trim()) errors.push({ msg: "Pincode is required for vendor registration if not providing c_id" });
      if (!city || !city.trim()) errors.push({ msg: "City is required for vendor registration if not providing c_id" });
      if (!state || !state.trim()) errors.push({ msg: "State is required for vendor registration if not providing c_id" });
      if (!address_line1 || !address_line1.trim()) errors.push({ msg: "Address line 1 is required for vendor registration if not providing c_id" });
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      message: "Validation failed",
      errors,
    });
  }

  next();
}

export function loginValidation(req, res, next) {
  const { email, password } = req.body;
  const errors = [];

  if (!email || !email.trim()) {
    errors.push({ msg: "Email is required" });
  }

  if (!password) {
    errors.push({ msg: "Password is required" });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      message: "Validation failed",
      errors,
    });
  }

  next();
}
