import jwt from "jsonwebtoken";
import { catchAsyncError } from "./catchAsyncError.js";

export const userAuth = catchAsyncError(async (req, res, next) => {
    try {
        const { token } = req.headers; 

        if (!token) {
            return res.status(401).json({ 
                success: false,
                message: "Unauthorized login",
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY); 

        if (!decoded.id) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized login",
            });
        }

        req.body.userId = decoded.id; 

        next(); 
    } catch (error) {
        console.log(error);
        res.status(401).json({
            success: false,
            message: "Token invalid or expired",
        });
    }
});
