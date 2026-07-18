import { Router } from "express";
import multer from "multer";
import { verifyToken, verifyAdmin } from "../middleware/auth.middleware.js";
import {
  getProfileController,
  updateUserController,
  updateCompanyController,
  addAddressController,
  updateAddressController,
  deleteAddressController,
  changePasswordController
} from "../controller/profile.controller.js";
import {
  updateProfileValidation,
  updateCompanyValidation,
  addressValidation,
  changePasswordValidation
} from "../validation/profile.validator.js";

const profileRoute = Router();
const upload = multer({ storage: multer.memoryStorage() });

profileRoute.use(verifyToken);

profileRoute.get("/", getProfileController);
profileRoute.put("/user", upload.single("profileImage"), updateProfileValidation, updateUserController);
profileRoute.put("/company", verifyAdmin, upload.single("companyProfileImage"), updateCompanyValidation, updateCompanyController);
profileRoute.put("/change-password", changePasswordValidation, changePasswordController);

profileRoute.post("/address", addressValidation, addAddressController);
profileRoute.put("/address/:id", addressValidation, updateAddressController);
profileRoute.delete("/address/:id", deleteAddressController);

export default profileRoute;
