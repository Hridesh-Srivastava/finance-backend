import User from "../models/User.js"
import jwt from "jsonwebtoken"
import { validationResult } from "express-validator"

// @route   POST api/auth/register
// @desc    Register a user
// @access  Public
export const registerUser = async (req, res) => {
  // Validate request
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  const { name, email, password } = req.body

  try {
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

    // Create JWT token
    const payload = {
      id: user.id,
    }

    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" }, (err, token) => {
      if (err) throw err
      res.json({ token })
    })
  } catch (error) {
    console.error("Error in registerUser:", error.message)
    res.status(500).json({ message: "Server error" })
  }
}

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
export const loginUser = async (req, res) => {
  // Validate request
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  const { email, password } = req.body

  try {
    // Check if user exists
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" })
    }

    // Check password
    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" })
    }

    // Create JWT token
    const payload = {
      id: user.id,
    }

    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" }, (err, token) => {
      if (err) throw err
      res.json({ token })
    })
  } catch (error) {
    console.error("Error in loginUser:", error.message)
    res.status(500).json({ message: "Server error" })
  }
}

// @route   GET api/auth/me
// @desc    Get current user
// @access  Private
export const getCurrentUser = async (req, res) => {
  try {
    // User is already available from auth middleware
    const user = await User.findById(req.user.id).select("-password")
    res.json(user)
  } catch (error) {
    console.error("Error in getCurrentUser:", error.message)
    res.status(500).json({ message: "Server error" })
  }
}

