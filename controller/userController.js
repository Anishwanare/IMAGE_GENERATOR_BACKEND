import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { userModel } from "../model/userSchema.js";
import { catchAsyncError } from "../middleware/catchAsyncError.js";
import Razorpay from "razorpay"
import { transactionModel } from "../model/transactionModel.js";

// Register
export const register = catchAsyncError(async (req, res) => {
    const { name, email, password } = req.body;

    // console.log(req.body)

    try {
        if (!name || !email || !password) {
            return res.status(500).json({
                success: false,
                message: "Please fill full form!",
            });
        }

        const existingUser = await userModel.findOne({ email });
        if (existingUser) {
            return res
                .status(400)
                .json({ success: false, message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);


        const newUser = new userModel({
            name,
            email,
            password: hashedPassword,
        });
        await newUser.save();

        const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET_KEY, {
            expiresIn: "1d",
        });

        return res.status(201).json({
            success: true,
            message: "User registered successfully",
            user: newUser,
            token,
        });
    } catch (error) {
        return res.status(500).json({ message: "Server error", error });
    }
});

// Login
export const login = catchAsyncError(async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await userModel.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res
                .status(400)
                .json({ success: false, message: "Invalid email or password" });
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET_KEY, {
            expiresIn: "1d",
        });

        res
            .status(200)
            .json({ success: true, message: "User login Successfully", token, user });
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Server error" });
    }
});


export const userCredits = catchAsyncError(async (req, res, next) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.json({ success: false, message: "Id not found" })
        }

        const user = await userModel.findById(userId);
        if (!user) {
            return res.json({ success: false, message: "user not found.." })
        }

        res.json({
            success: true,
            message: "Credits fetched successfully",
            credits: user.creditBalance,
            user: { name: user.name }
        })

    } catch (error) {
        console.log(error.message)
        res.json({
            success: false,
            message: error.message
        })
    }
})

const razorPayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_Fy8StwWY6kryBM',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'TCBVBJHYR9p4HgCkb2uvxkqQ',
});

export const paymentRazorpay = async (req, res) => {
    try {
        const { userId, planId } = req.body;

        // console.log("userId ",userId + "planid "+ planId)

        if (!userId || !planId) {
            return res.status(400).json({
                success: false,
                message: "Missing Details",
            });
        }

        const userData = await userModel.findById(userId);
        if (!userData) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        // console.log("user data",userData)

        let credits, plan, amount, date;

        switch (planId) {
            case "Basic":
                plan = "Basic";
                credits = 100;
                amount = 10;
                break;
            case "Advanced":
                plan = "Advanced";
                credits = 500;
                amount = 50;
                break;
            case "Business":
                plan = "Business";
                credits = 5000;
                amount = 250;
                break;
            default:
                return res.status(400).json({
                    success: false,
                    message: "Invalid Plan ID",
                });
        }

        date = Date.now();

        const transactionData = { credits, plan, amount, date, userId };

        // console.log("transactionData", transactionData)

        const newTransaction = await transactionModel.create(transactionData);

        const options = {
            amount: amount * 100,
            currency: process.env.CURRENCY || "INR",
            receipt: newTransaction._id.toString(),
        };


        // console.log("options",options)
        //here getting error while create 
        const order = await razorPayInstance.orders.create(options);

        return res.json({
            success: true,
            order,
        });
    } catch (error) {
        console.error("Error in paymentRazorpay:", error);
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

export const verifyRazorpay = catchAsyncError(async (req, res) => {
    try {
        const { razorpay_order_id } = req.body;

        // Check if the order ID is provided
        if (!razorpay_order_id) {
            return res.status(400).json({
                success: false,
                message: "razorpay_order_id is required"
            });
        }

        const orderInfo = await razorPayInstance.orders.fetch(razorpay_order_id);

        if (orderInfo.status === "paid") {
            const transactionData = await transactionModel.findById(orderInfo.receipt);

            if (transactionData.payment) {
                return res.json({
                    success: false,
                    message: "Payment already processed"
                });
            }

            const userData = await userModel.findById(transactionData.userId);
            console.log("user", userData);

            console.log("current user balance", userData.creditBalance);
            console.log("credits to be added", transactionData.credits);

            const updatedCreditBalance = userData.creditBalance + transactionData.credits;
            console.log("updated balance", updatedCreditBalance);

            // Update the user balance correctly
            await userModel.findByIdAndUpdate(userData._id, { creditBalance: updatedCreditBalance });

            // Mark the transaction as paid
            await transactionModel.findByIdAndUpdate(transactionData._id, { payment: true });

            res.json({
                success: true,
                message: "Credits Added Successfully"
            });
        } else {
            res.json({
                success: false,
                message: "Payment failed, please try again"
            });
        }
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Server error, please try again later"
        });
    }
});
