import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true
    },
    plan: {
        type: String,
        required: true,
    },
    credits: {
        type: Number,
        required: true,
    },
    payment: { type: Boolean, required: false },
    amount: {
        type: Number,
        required: true,
    },
    date: {
        type: Number,
    }
})

export const transactionModel = mongoose.model('transaction', transactionSchema)

