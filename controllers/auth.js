import jwt from "jsonwebtoken"
import User from "../models/User.js"
import { validationResult } from "express-validator"

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: "Validation error", errors: errors.array() })
    }

    // Log request body for debugging
    console.log("Registration request received:", JSON.stringify(req.body, null, 2))

    const { name, email, password } = req.body

    // Additional validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" })
    }

    // Check if user already exists
    let user = await User.findOne({ email })
    if (user) {
      return res.status(400).json({ message: "User already exists" })
    }

    // Create new user
    user = new User({
      name,
      email,
      password,
    })

    // Save user to database
    await user.save()
    console.log("User registered successfully:", email)

    // Generate JWT token
    const payload = {
      user: {
        id: user.id,
      },
    }

    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" }, (err, token) => {
      if (err) {
        console.error("JWT Sign Error:", err)
        return res.status(500).json({ message: "Error generating token" })
      }
      res.status(201).json({ token })
    })
  } catch (err) {
    console.error("Registration error:", err)
    res.status(500).json({ message: "Server Error", error: err.message })
  }
}

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: "Validation error", errors: errors.array() })
    }

    const { email, password } = req.body

    // Check for user
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(400).json({ message: "Invalid Credentials" })
    }

    // Check password
    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid Credentials" })
    }

    // Generate JWT
    const payload = {
      user: {
        id: user.id,
      },
    }

    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" }, (err, token) => {
      if (err) {
        console.error("JWT Sign Error:", err)
        return res.status(500).json({ message: "Error generating token" })
      }
      res.json({ token })
    })
  } catch (err) {
    console.error("Login error:", err)
    res.status(500).json({ message: "Server Error", error: err.message })
  }
}

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password")
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }
    res.json(user)
  } catch (err) {
    console.error("Get user error:", err)
    res.status(500).json({ message: "Server Error", error: err.message })
  }
}

