import { createUser, createCompany, findUserById } from "../repository/user.repository.js";
import { createVendor, findVendorById } from "../repository/vendor.repository.js";
import { authenticateUser } from "../service/auth.service.js";
import { issueAccessToken } from "../utils/token.util.js";
import { getAccessCookieOptions, getClearCookieOptions } from "../utils/cookie.util.js";

// ─────────────────────────────────────────────────────────────────────────────
// Helper: build the JWT payload from user object
// ─────────────────────────────────────────────────────────────────────────────
function buildTokenPayload(entity, userType) {
  return {
    id: entity.u_id || entity.v_id,
    email: entity.email,
    user_type: userType,
    c_id: entity.c_id || null, // Vendors have c_id
    role: entity.role || null, // Vendors have role
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/register
// ─────────────────────────────────────────────────────────────────────────────
export async function registerController(req, res, next) {
  try {
    const { role } = req.body;
    let registeredEntity;
    let userType;

    // Check if registering a vendor or admin
    if (role === "vendor" || role === "admin") {
      userType = "vendor";
      let c_id = req.body.c_id;

      // If no company ID is provided, but company details are given, create the company first
      if (!c_id && req.body.cname && req.body.gst_no && req.body.product_category) {
        const company = await createCompany({
          product_category: req.body.product_category,
          comp_prof_image: req.body.comp_prof_image,
          gst_no: req.body.gst_no,
          cname: req.body.cname,
          pincode: req.body.pincode,
          city: req.body.city,
          state: req.body.state,
          address_line1: req.body.address_line1,
          address_line2: req.body.address_line2,
        });
        c_id = company.c_id;
      }

      if (!c_id) {
        return res.status(400).json({ message: "A company ID or complete company details are required to register a vendor" });
      }

      registeredEntity = await createVendor({
        first_name: req.body.first_name,
        last_name: req.body.last_name,
        profile_image: req.body.profile_image,
        email: req.body.email,
        password: req.body.password,
        c_id,
        role,
      });

    } else {
      // Register standard user
      userType = "user";
      registeredEntity = await createUser({
        first_name: req.body.first_name,
        last_name: req.body.last_name,
        profile_image: req.body.profile_image,
        email: req.body.email,
        password: req.body.password,
      });
    }

    const payload = buildTokenPayload(registeredEntity, userType);
    const accessToken = issueAccessToken(payload);
    res.cookie("accessToken", accessToken, getAccessCookieOptions());

    return res.status(201).json({
      msg: `${userType === "vendor" ? "Vendor" : "User"} registered successfully`,
      [userType]: registeredEntity,
      user_type: userType,
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
    const authenticatedEntity = await authenticateUser(email, password);
    const userType = authenticatedEntity.user_type;
    
    // Remove the password property just in case before sending the response
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
    const { id, user_type } = req.user;
    
    let entity;
    if (user_type === "vendor") {
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
      [user_type || "user"]: entity,
      user_type,
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
