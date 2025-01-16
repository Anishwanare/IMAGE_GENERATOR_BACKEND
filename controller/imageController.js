import { userModel } from "../model/userSchema.js"
import { catchAsyncError } from "../middleware/catchAsyncError.js";
import FormData from "form-data"
import axios from "axios"

export const generateImage = catchAsyncError(async (req, res, next) => {
    try {
        const { userId, prompt } = req.body;
        const user = await userModel.findById(userId)

        if (!user || !prompt) {
            return res.status(400).json({
                success: false,
                message: "Missing details!!"
            })
        }

        if (user.creditBalance <= 0) {
            return res.json({
                success: false,
                message: "No Credits left",
                creditBalance: user.creditBalance
            })
        }

        const formdata = new FormData()
        formdata.append("prompt", prompt)

        const { data } = await axios.post('https://clipdrop-api.co/text-to-image/v1', formdata, {
            headers: { 'x-api-key': process.env.CLIPDROP_API },
            responseType: 'arraybuffer'
        });

        const base64Image = Buffer.from(data, 'binary').toString('base64');
        const resultImage = `data:image/png;base64,${base64Image}`;

        await userModel.findByIdAndUpdate(userId, { creditBalance: user.creditBalance - 1 });

        res.status(200).json({
            success: true,
            message: "Image Generated Successfully",
            creditBalance: user.creditBalance - 1,
            resultImage
        });



    } catch (error) {
        res.status(501).json({
            success: false,
            message: "Something went wrong", error,
        })
    }
})