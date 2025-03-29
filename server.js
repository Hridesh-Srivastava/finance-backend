import express from "express"
import mongoose from "mongoose"
import cors from "cors"
import morgan from "morgan"
import helmet from "helmet"
import dotenv from "dotenv"
import http from "http"

// Import routes
import authRoutes from "./routes/auth.js"
import transactionRoutes from "./routes/transactions.js"
import userRoutes from "./routes/users.js"
import aiRoutes from "./routes/ai.js"
import contactRoutes from "./routes/contact.js"
import healthRoutes from "./routes/health.js"

// Load environment variables
dotenv.config()

// Initialize express app
const app = express()

// Increase request size limit for potential large payloads
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true, limit: "10mb" }))

// Configure CORS properly - this is critical
app.use(
  cors({
    origin: "*", // Allow all origins in development
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
)

// Logging middleware
app.use(morgan("dev"))

// Security middleware with relaxed settings for development
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
)

// Simple request logger for debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`)
  next()
})

// Routes
app.use("/api/auth", authRoutes)
app.use("/api/transactions", transactionRoutes)
app.use("/api/users", userRoutes)
app.use("/api/ai", aiRoutes)
app.use("/api/contact", contactRoutes)
app.use("/api/health", healthRoutes)

// Basic health check route
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Server is running",
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  })
})

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err)
  res.status(500).json({
    message: "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? err.message : "Server error",
  })
})

// Handle 404 errors
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.url} not found` })
})

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      // These options help with connection stability
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    })
    console.log(`MongoDB connected successfully! host: ${mongoose.connection.host}`)
  } catch (error) {
    console.error("MongoDB connection error:", error)
    process.exit(1)
  }
}

// Create HTTP server
const server = http.createServer(app)

// Start server with proper error handling
const PORT = process.env.PORT || 5000
connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
  })

  // Handle server errors
  server.on("error", (error) => {
    console.error("Server error:", error)
    if (error.code === "EADDRINUSE") {
      console.error(`Port ${PORT} is already in use. Try a different port.`)
    }
    process.exit(1)
  })
})

// Handle unhandled promise rejections
process.on("unhandledRejection", (error) => {
  console.error("Unhandled Rejection:", error)
})

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error)
  process.exit(1)
})

