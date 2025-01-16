import express from "express";
import { login, paymentRazorpay, register, userCredits, verifyRazorpay } from "../controller/userController.js";
import { userAuth } from "../middleware/auth.js";

const router = express.Router();


router.post('/register', register)
router.post('/login', login)
// router.get('/profile/:id', userProfile)
router.get('/credits', userAuth, userCredits)
router.post('/purchase-credits', userAuth, paymentRazorpay)
router.post('/verify/purchase-credits',verifyRazorpay)



export default router