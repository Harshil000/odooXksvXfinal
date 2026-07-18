export function updateProfileValidation(req, res, next) {
  const { firstName, lastName } = req.body;
  const errors = [];

  if (!firstName || !firstName.trim()) errors.push({ msg: "First name is required" });
  if (!lastName || !lastName.trim()) errors.push({ msg: "Last name is required" });
  
  if (errors.length > 0) {
    return res.status(400).json({ message: "Validation failed", errors });
  }
  next();
}

export function updateCompanyValidation(req, res, next) {
  const { companyName, productCategory, gstNo, pincode, city, state, addressLine1 } = req.body;
  const errors = [];

  if (!companyName || !companyName.trim()) errors.push({ msg: "Company Name is required" });
  if (!productCategory || !productCategory.trim()) errors.push({ msg: "Product Category is required" });
  if (!gstNo || !gstNo.trim()) errors.push({ msg: "GST No is required" });
  if (!pincode || !pincode.trim()) errors.push({ msg: "Pincode is required" });
  if (!city || !city.trim()) errors.push({ msg: "City is required" });
  if (!state || !state.trim()) errors.push({ msg: "State is required" });
  if (!addressLine1 || !addressLine1.trim()) errors.push({ msg: "Address Line 1 is required" });

  if (errors.length > 0) {
    return res.status(400).json({ message: "Validation failed", errors });
  }
  next();
}

export function addressValidation(req, res, next) {
  const { pincode, city, state, addressLine1 } = req.body;
  const errors = [];

  if (!pincode || !pincode.trim()) errors.push({ msg: "Pincode is required" });
  if (!city || !city.trim()) errors.push({ msg: "City is required" });
  if (!state || !state.trim()) errors.push({ msg: "State is required" });
  if (!addressLine1 || !addressLine1.trim()) errors.push({ msg: "Address Line 1 is required" });

  if (errors.length > 0) {
    return res.status(400).json({ message: "Validation failed", errors });
  }
  next();
}

export function changePasswordValidation(req, res, next) {
  const { password, confirmPassword } = req.body;
  const errors = [];

  if (!password) {
    errors.push({ msg: "Password is required" });
  } else {
    if (password.length < 6 || password.length > 12) {
      errors.push({ msg: "Password must be 6-12 characters long" });
    }
    if (!/[a-z]/.test(password) || !/[A-Z]/.test(password)) {
      errors.push({ msg: "Password must contain both uppercase and lowercase letters" });
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      errors.push({ msg: "Password must contain at least one special character" });
    }
  }

  if (password !== confirmPassword) {
    errors.push({ msg: "Passwords must match" });
  }

  if (errors.length > 0) {
    return res.status(400).json({ message: "Validation failed", errors });
  }
  next();
}
