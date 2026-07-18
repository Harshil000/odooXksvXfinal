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

  // If registering a vendor, c_id is strictly required
  if (role === "vendor" || role === "admin") {
    const { c_id } = req.body;
    
    if (!c_id) {
      errors.push({ msg: "Company ID (c_id) is required for vendor registration" });
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
