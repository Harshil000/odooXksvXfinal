import { Router } from 'express'
import * as authController from "../controller/auth.controller.js"
import * as authValidator from "../validation/auth.validator.js"
import { verifyToken } from "../middleware/auth.middleware.js"

const authRoute = Router()

authRoute.post('/register', authValidator.registerValidation, authController.registerController)
authRoute.post('/login', authValidator.loginValidation, authController.loginController)
authRoute.get('/me', verifyToken, authController.getMeController)
authRoute.get('/logout', authController.logoutController)

export default authRoute;