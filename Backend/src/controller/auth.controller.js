import crypto from "crypto";
import { createUser, createCompany, findUserById, findCompanyById, findUserByEmail, updateUserPassword } from "../repository/user.repository.js";
import { createVendor, findVendorById, findVendorByEmail, updateVendorPassword, searchCompaniesByName } from "../repository/vendor.repository.js";
import { authenticateUser } from "../service/auth.service.js";
import { issueAccessToken } from "../utils/token.util.js";
import { getAccessCookieOptions, getClearCookieOptions } from "../utils/cookie.util.js";
import { upsertPasswordReset, findPasswordResetByToken, deletePasswordResetByEmail } from "../repository/passwordReset.repository.js";
import { sendEmail } from "../service/mail.service.js";

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

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/forgot-password
// ─────────────────────────────────────────────────────────────────────────────
export async function forgotPasswordController(req, res, next) {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    // 1. Check if user or vendor exists
    const user = await findUserByEmail(email);
    const vendor = await findVendorByEmail(email);
    if (!user && !vendor) {
      return res.status(404).json({ message: "No account found with this email" });
    }

    // 2. Generate a secure token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour expiration

    // 3. Upsert into password_resets
    await upsertPasswordReset(email, token, expiresAt);

    // 4. Send email
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const resetLink = `${frontendUrl}/forgot-password?token=${token}`;

    const mailText = `You requested a password reset. Please click on the link below to reset your password:\n\n${resetLink}\n\nThis link will expire in 1 hour.`;
    const mailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #6366f1;">Password Reset Request</h2>
        <p>You requested a password reset for your account. Click the button below to choose a new password:</p>
        <div style="margin: 24px 0;">
          <a href="${resetLink}" style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
        </div>
        <p style="color: #64748b; font-size: 14px;">Or copy and paste this URL into your browser:</p>
        <p style="color: #64748b; font-size: 14px; word-break: break-all;">${resetLink}</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="color: #94a3b8; font-size: 12px;">If you did not request this, you can safely ignore this email.</p>
      </div>
    `;

    await sendEmail({
      to: email,
      subject: "Password Reset Request",
      text: mailText,
      html: mailHtml,
    });

    return res.status(200).json({ message: "Password reset email sent successfully" });
  } catch (error) {
    next(error);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/reset-password
// ─────────────────────────────────────────────────────────────────────────────
export async function resetPasswordController(req, res, next) {
  const { token, password } = req.body;
  if (!token || !password) {
    return res.status(400).json({ message: "Token and password are required" });
  }

  try {
    // 1. Find the reset record
    const resetRecord = await findPasswordResetByToken(token);
    if (!resetRecord) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    // 2. Check expiration
    if (new Date(resetRecord.expires_at) < new Date()) {
      await deletePasswordResetByEmail(resetRecord.email);
      return res.status(400).json({ message: "Token has expired" });
    }

    // 3. Find if user or vendor
    const user = await findUserByEmail(resetRecord.email);
    const vendor = await findVendorByEmail(resetRecord.email);

    if (user) {
      await updateUserPassword(user.u_id, password);
    } else if (vendor) {
      await updateVendorPassword(vendor.v_id, password);
    } else {
      return res.status(404).json({ message: "Account not found" });
    }

    // 4. Delete the token so it cannot be reused
    await deletePasswordResetByEmail(resetRecord.email);

    return res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    next(error);
  }
}

/**
 * Searches for companies by name query for staff registration dropdown list.
 * GET /api/auth/companies/search
 */
export async function searchCompaniesController(req, res, next) {
  try {
    const { q } = req.query;
    if (!q || !q.trim()) {
      return res.status(200).json({ companies: [] });
    }
    const companies = await searchCompaniesByName(q.trim());
    return res.status(200).json({ companies });
  } catch (error) {
    next(error);
  }
}
