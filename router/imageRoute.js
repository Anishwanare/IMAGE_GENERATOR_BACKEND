import express from "express"
import { generateImage } from "../controller/imageController.js"
import { userAuth } from "../middleware/auth.js";

const router = express.Router()

router.post('/generate-image', userAuth, generateImage);


export default router