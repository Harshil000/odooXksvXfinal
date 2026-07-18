import { createUser, createCompany, findUserById, findCompanyById } from "../repository/user.repository.js";
import { createVendor, findVendorById } from "../repository/vendor.repository.js";
import { authenticateUser } from "../service/auth.service.js";
import { issueAccessToken } from "../utils/token.util.js";
import { getAccessCookieOptions, getClearCookieOptions } from "../utils/cookie.util.js";

// ─────────────────────────────────────────────────────────────────────────────
// Helper: build the JWT payload from user object
// ─────────────────────────────────────────────────────────────────────────────
function buildTokenPayload(entity, userType) {
  if (userType === "vendor") {
    return {
      id: entity.v_id,
      role: entity.role
    };
  }
  return {
    id: entity.u_id
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/register (Normal Users Only)
// ─────────────────────────────────────────────────────────────────────────────
export async function registerController(req, res, next) {
  try {
    const registeredEntity = await createUser({
      first_name: req.body.first_name,
      last_name: req.body.last_name,
      profile_image: req.body.profile_image,
      email: req.body.email,
      password: req.body.password,
    });

    const payload = buildTokenPayload(registeredEntity, "user");
    const accessToken = issueAccessToken(payload);
    res.cookie("accessToken", accessToken, getAccessCookieOptions());

    return res.status(201).json({
      msg: "User registered successfully",
      user: registeredEntity,
      user_type: "user",
    });
  } catch (error) {
    next(error);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/admin/register
// ─────────────────────────────────────────────────────────────────────────────
export async function adminRegisterController(req, res, next) {
  try {
    // 1. Create company
    const newCompany = await createCompany({
      product_category: req.body.productCategory,
      gst_no: req.body.gstNo,
      cname: req.body.companyName,
      pincode: req.body.pincode,
      city: req.body.city,
      state: req.body.state,
      address_line1: req.body.addressLine1,
      address_line2: req.body.addressLine2 || "",
    });

    // 2. Create admin vendor mapped to new company
    const newVendor = await createVendor({
      first_name: req.body.firstName,
      last_name: req.body.lastName,
      email: req.body.email,
      password: req.body.password,
      c_id: newCompany.c_id,
      role: "admin",
    });

    const payload = buildTokenPayload(newVendor, "vendor");
    const accessToken = issueAccessToken(payload);
    res.cookie("accessToken", accessToken, getAccessCookieOptions());

    return res.status(201).json({
      msg: "Admin and Company registered successfully",
      vendor: newVendor,
      user_type: "vendor",
    });
  } catch (error) {
    next(error);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/staff/register
// ─────────────────────────────────────────────────────────────────────────────
export async function staffRegisterController(req, res, next) {
  try {
    const c_id = req.body.companyUuid;

    // Verify company exists
    const company = await findCompanyById(c_id);
    if (!company) {
      return res.status(404).json({ message: "Company not found. Invalid Company UUID." });
    }

    // Create staff vendor
    const newVendor = await createVendor({
      first_name: req.body.firstName,
      last_name: req.body.lastName,
      email: req.body.email,
      password: req.body.password,
      c_id,
      role: "vendor", // 'vendor' is the enum value for staff in DB
    });

    const payload = buildTokenPayload(newVendor, "vendor");
    const accessToken = issueAccessToken(payload);
    res.cookie("accessToken", accessToken, getAccessCookieOptions());

    return res.status(201).json({
      msg: "Staff registered successfully",
      vendor: newVendor,
      user_type: "vendor",
    });
  } catch (error) {
    next(error);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────────────────────────────────────────
export async function loginController(req, res, next) {
  const { email, password } = req.body;

  try {
    // authenticateUser searches users, then vendors, throws 401 if fails.
    const authenticatedEntity = await authenticateUser(email, password);
    const userType = authenticatedEntity.user_type;
    
    // Remove password
    delete authenticatedEntity.password;

    const payload = buildTokenPayload(authenticatedEntity, userType);
    const accessToken = issueAccessToken(payload);
    res.cookie("accessToken", accessToken, getAccessCookieOptions());

    return res.status(200).json({
      msg: "Login successful",
      [userType]: authenticatedEntity,
      user_type: userType,
    });
  } catch (error) {
    next(error);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/auth/me  (protected — requires verifyToken middleware)
// ─────────────────────────────────────────────────────────────────────────────
export async function getMeController(req, res, next) {
  try {
    // If role is present in token, it's a vendor. Else, user.
    const isVendor = !!req.user.role;
    const { id } = req.user;
    
    let entity;
    if (isVendor) {
      entity = await findVendorById(id);
    } else {
      entity = await findUserById(id);
    }

    if (!entity) {
      return res.status(404).json({ message: "Profile not found" });
    }

    delete entity.password;

    return res.status(200).json({
      authenticated: true,
      [isVendor ? "vendor" : "user"]: entity,
      user_type: isVendor ? "vendor" : "user",
    });
  } catch (error) {
    next(error);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/auth/logout
// ─────────────────────────────────────────────────────────────────────────────
export async function logoutController(req, res) {
  res.clearCookie("accessToken", getClearCookieOptions());
  return res.status(200).json({ message: "Logged out successfully" });
}
