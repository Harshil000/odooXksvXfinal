export function registerValidation(req, res, next) {
  const { first_name, last_name, email, password } = req.body;
  const errors = [];

  const finalFirstName = (first_name || "").trim();
  const finalLastName = (last_name || "").trim();
  
  if (!finalFirstName) errors.push({ msg: "First name is required" });
  if (!finalLastName) errors.push({ msg: "Last name is required" });
  
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

  if (errors.length > 0) {
    return res.status(400).json({ message: "Validation failed", errors });
  }
  next();
}

export function adminRegisterValidation(req, res, next) {
  const { firstName, lastName, email, password, companyName, productCategory, gstNo, pincode, city, state, addressLine1 } = req.body;
  const errors = [];

  if (!firstName || !firstName.trim()) errors.push({ msg: "First name is required" });
  if (!lastName || !lastName.trim()) errors.push({ msg: "Last name is required" });
  if (!email || !email.trim()) errors.push({ msg: "Email is required" });
  if (!password || password.length < 6) errors.push({ msg: "Password must be at least 6 chars" });
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

export function staffRegisterValidation(req, res, next) {
  const { firstName, lastName, email, password, companyUuid } = req.body;
  const errors = [];

  if (!firstName || !firstName.trim()) errors.push({ msg: "First name is required" });
  if (!lastName || !lastName.trim()) errors.push({ msg: "Last name is required" });
  if (!email || !email.trim()) errors.push({ msg: "Email is required" });
  if (!password || password.length < 6) errors.push({ msg: "Password must be at least 6 chars" });
  if (!companyUuid || !companyUuid.trim()) errors.push({ msg: "Company UUID is required" });

  if (errors.length > 0) {
    return res.status(400).json({ message: "Validation failed", errors });
  }
  next();
}

export function loginValidation(req, res, next) {
  const { email, password } = req.body;
  const errors = [];

  if (!email || !email.trim()) errors.push({ msg: "Email is required" });
  if (!password) errors.push({ msg: "Password is required" });

  if (errors.length > 0) {
    return res.status(400).json({ message: "Validation failed", errors });
  }
  next();
}
