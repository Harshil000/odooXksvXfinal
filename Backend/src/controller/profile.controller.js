import { findUserById, updateUserProfile, updateCompanyProfile, findCompanyById, updateUserPassword } from "../repository/user.repository.js";
import { getPool } from "../config/database.js";
import { findVendorById, updateVendorProfile, updateVendorPassword } from "../repository/vendor.repository.js";
import { createAddress, findAddressesByUserId, updateAddress, deleteAddress } from "../repository/address.repository.js";
import { processImageToBase64 } from "../utils/image.util.js";

// GET /api/profile
export async function getProfileController(req, res, next) {
  try {
    const isVendor = !!req.user.role;
    const { id } = req.user;

    let profileData = {};

    if (isVendor) {
      const vendor = await findVendorById(id);
      if (!vendor) return res.status(404).json({ message: "Vendor profile not found" });
      delete vendor.password;
      profileData.user = vendor;
      profileData.userType = "vendor";

      if (vendor.c_id) {
        const company = await findCompanyById(vendor.c_id);
        profileData.company = company;
      }
    } else {
      const user = await findUserById(id);
      if (!user) return res.status(404).json({ message: "User profile not found" });
      delete user.password;
      profileData.user = user;
      profileData.userType = "user";

      const addresses = await findAddressesByUserId(id);
      profileData.addresses = addresses || [];
    }

    return res.status(200).json(profileData);
  } catch (error) {
    next(error);
  }
}

// PUT /api/profile/user
export async function updateUserController(req, res, next) {
  try {
    const isVendor = !!req.user.role;
    const { id } = req.user;
    const { firstName, lastName } = req.body;

    let profileImage = undefined;
    if (req.file) {
      profileImage = processImageToBase64(req.file);
    } else if (req.body.profileImage) {
      profileImage = req.body.profileImage === "null" ? null : req.body.profileImage;
    }

    let updatedUser;
    if (isVendor) {
      const current = await findVendorById(id);
      updatedUser = await updateVendorProfile(id, {
        first_name: firstName,
        last_name: lastName,
        profile_image: profileImage !== undefined ? profileImage : current.profile_image
      });
    } else {
      const current = await findUserById(id);
      updatedUser = await updateUserProfile(id, {
        first_name: firstName,
        last_name: lastName,
        profile_image: profileImage !== undefined ? profileImage : current.profile_image
      });
    }

    delete updatedUser.password;
    return res.status(200).json({ message: "Profile updated successfully", user: updatedUser });
  } catch (error) {
    next(error);
  }
}

// PUT /api/profile/company
export async function updateCompanyController(req, res, next) {
  try {
    const isVendor = !!req.user.role;
    const { id, role } = req.user;

    if (!isVendor || role !== "admin") {
      return res.status(403).json({ message: "Only company admins can update company details" });
    }

    const vendor = await findVendorById(id);
    if (!vendor || !vendor.c_id) {
      return res.status(404).json({ message: "Company not found for this admin" });
    }

    const { companyName, productCategory, gstNo, pincode, city, state, addressLine1, addressLine2 } = req.body;

    const currentCompany = await findCompanyById(vendor.c_id);
    let companyProfileImage = currentCompany.comp_prof_image;

    if (req.file) {
      companyProfileImage = processImageToBase64(req.file);
    } else if (req.body.companyProfileImage !== undefined) {
      companyProfileImage = req.body.companyProfileImage === "null" ? null : req.body.companyProfileImage;
    }

    const updatedCompany = await updateCompanyProfile(vendor.c_id, {
      cname: companyName,
      product_category: productCategory,
      gst_no: gstNo,
      pincode,
      city,
      state,
      address_line1: addressLine1,
      address_line2: addressLine2,
      comp_prof_image: companyProfileImage
    });

    return res.status(200).json({ message: "Company updated successfully", company: updatedCompany });
  } catch (error) {
    next(error);
  }
}

// POST /api/profile/address
export async function addAddressController(req, res, next) {
  try {
    if (req.user.role) {
      return res.status(403).json({ message: "Vendors cannot manage user addresses" });
    }
    const { id } = req.user;
    const { pincode, state, city, addressLine1, addressLine2 } = req.body;

    const newAddress = await createAddress({
      pincode, state, city, address_line1: addressLine1, address_line2: addressLine2, u_id: id
    });

    return res.status(201).json({ message: "Address added successfully", address: newAddress });
  } catch (error) {
    next(error);
  }
}

// PUT /api/profile/address/:id
export async function updateAddressController(req, res, next) {
  try {
    if (req.user.role) {
      return res.status(403).json({ message: "Vendors cannot manage user addresses" });
    }
    const u_id = req.user.id;
    const a_id = req.params.id;
    const { pincode, state, city, addressLine1, addressLine2 } = req.body;

    const updatedAddress = await updateAddress(a_id, u_id, {
      pincode, state, city, address_line1: addressLine1, address_line2: addressLine2
    });

    if (!updatedAddress) {
      return res.status(404).json({ message: "Address not found or does not belong to user" });
    }

    return res.status(200).json({ message: "Address updated successfully", address: updatedAddress });
  } catch (error) {
    next(error);
  }
}

// DELETE /api/profile/address/:id
export async function deleteAddressController(req, res, next) {
  try {
    if (req.user.role) {
      return res.status(403).json({ message: "Vendors cannot manage user addresses" });
    }
    const u_id = req.user.id;
    const a_id = req.params.id;

    const deletedAddress = await deleteAddress(a_id, u_id);

    if (!deletedAddress) {
      return res.status(404).json({ message: "Address not found or does not belong to user" });
    }

    return res.status(200).json({ message: "Address deleted successfully" });
  } catch (error) {
    next(error);
  }
}

export async function changePasswordController(req, res, next) {
  try {
    const isVendor = !!req.user.role;
    const { id } = req.user;
    const { password } = req.body;

    if (isVendor) {
      const updatedVendor = await updateVendorPassword(id, password);
      delete updatedVendor.password;
      return res.status(200).json({ message: "Password updated successfully", user: updatedVendor });
    } else {
      const updatedUser = await updateUserPassword(id, password);
      delete updatedUser.password;
      return res.status(200).json({ message: "Password updated successfully", user: updatedUser });
    }
  } catch (error) {
    next(error);
  }
}

export async function getCompanyInfoController(req, res, next) {
  try {
    const pool = getPool();
    const result = await pool.query("SELECT cname, comp_prof_image FROM company LIMIT 1");
    if (result.rows.length === 0) {
      return res.status(200).json({ cname: "Your Logo", comp_prof_image: null });
    }
    return res.status(200).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
}
