import { config } from "dotenv";
import express from "express";
import cors from "cors";
import { dataBaseConnection } from "./database/db.js";
import userRoute from "./router/userRoute.js";
import imageRoute from "./router/imageRoute.js";
import bodyParser from "body-parser";

const app = express();

// Load environment variables from .env file
config({ path: "./.env" });

const PORT = process.env.PORT || 5013;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configuration
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.use(cors({
    origin: [process.env.FRONTEND_URL ||'http://localhost:5173' || 'https://imagifyyyy.netlify.app'],
    methods: ["POST", "PUT", "DELETE", "GET"],
    credentials: true,
    optionsSuccessStatus: 200,
    allowedHeaders: ["Content-Type", "Authorization", 'token']
}));

// Routes
app.use('/api/v1/user', userRoute);
app.use('/api/v2/ai', imageRoute);

// Database Connection
dataBaseConnection();

// Default Route
app.get("/", (req, res) => {
    res.send("Backend is working...");
});

// Start server
app.listen(PORT, () => {
    console.log("Connected to port", PORT);
});

// Global error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: "Internal server error" });
});
