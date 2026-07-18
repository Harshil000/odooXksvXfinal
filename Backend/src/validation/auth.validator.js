export function registerValidation(req, res, next) {
  const {full_name, email, password } = req.body;
  const errors = [];

  const finalFullName = (full_name || "").trim();
  if (!finalFullName) {
    errors.push({ msg: "Name is required" });
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
