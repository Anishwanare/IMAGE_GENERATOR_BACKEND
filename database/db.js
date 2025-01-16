import mongoose from "mongoose";

export const dataBaseConnection = async () => {
    await mongoose.connect(process.env.MONGO_URL, {
        dbName: "image_generator",
    }).then(() => {
        console.log("Connected to Image Generator Database");
    }).catch((err) => {
        console.error("Error while connecting to db", err);
    });
}