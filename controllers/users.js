import User from "../models/User.js"
import jwt from "jsonwebtoken"
import { validationResult } from "express-validator"

// @route   GET api/users/profile
// @desc    Get user profile
// @access  Private
export const getUserProfile = async (req, res) => {
  try {
    res.json(req.user)
  } catch (error) {
    console.error("Error in getUserProfile:", error.message)
    res.status(500).json({ message: "Server error" })
  }
}

// @route   PUT api/users/profile
// @desc    Update user profile
// @access  Private
export const updateUserProfile = async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  const { name, email } = req.body

  try {
    // Check if email is already in use
    if (email !== req.user.email) {
      const existingUser = await User.findOne({ email })
      if (existingUser) {
        return res.status(400).json({ message: "Email is already in use" })
      }
    }

    // Update user
    const user = await User.findByIdAndUpdate(req.user.id, { $set: { name, email } }, { new: true }).select("-password")

    res.json(user)
  } catch (error) {
    console.error("Error in updateUserProfile:", error.message)
    res.status(500).json({ message: "Server error" })
  }
}

// @route   PUT api/users/settings
// @desc    Update user settings
// @access  Private
export const updateUserSettings = async (req, res) => {
  const { currency, theme, notifications, weeklyReport, monthlyReport } = req.body

  // Build preferences object
  const preferencesFields = {}
  if (currency) preferencesFields["preferences.currency"] = currency
  if (theme) preferencesFields["preferences.theme"] = theme
  if (notifications !== undefined) preferencesFields["preferences.notifications"] = notifications
  if (weeklyReport !== undefined) preferencesFields["preferences.weeklyReport"] = weeklyReport
  if (monthlyReport !== undefined) preferencesFields["preferences.monthlyReport"] = monthlyReport

  try {
    // Update user preferences
    const user = await User.findByIdAndUpdate(req.user.id, { $set: preferencesFields }, { new: true }).select(
      "-password",
    )

    res.json(user)
  } catch (error) {
    console.error("Error in updateUserSettings:", error.message)
    res.status(500).json({ message: "Server error" })
  }
}

// @route   PUT api/users/password
// @desc    Update user password
// @access  Private
export const updateUserPassword = async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  const { currentPassword, newPassword } = req.body

  try {
    // Get user with password
    const user = await User.findById(req.user.id)

    // Check current password
    const isMatch = await user.comparePassword(currentPassword)
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" })
    }

    // Update password
    user.password = newPassword
    await user.save()

    res.json({ message: "Password updated successfully" })
  } catch (error) {
    console.error("Error in updateUserPassword:", error.message)
    res.status(500).json({ message: "Server error" })
  }
}

// @route   POST api/users/forgot-password
// @desc    Send password reset email
// @access  Public
export const forgotPassword = async (req, res) => {
  const { email } = req.body

  try {
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    // Generate reset token
    const resetToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "1h" })

    // In a real app, you would send an email with the reset link
    // For this demo, we'll just return success

    res.json({ message: "Password reset email sent" })
  } catch (error) {
    console.error("Error in forgotPassword:", error.message)
    res.status(500).json({ message: "Server error" })
  }
}

// @route   POST api/users/reset-password
// @desc    Reset password with token
// @access  Public
export const resetPassword = async (req, res) => {
  const { token, password } = req.body

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // Get user
    const user = await User.findById(decoded.id)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    // Update password
    user.password = password
    await user.save()

    res.json({ message: "Password reset successful" })
  } catch (error) {
    console.error("Error in resetPassword:", error.message)

    if (error.name === "JsonWebTokenError") {
      return res.status(400).json({ message: "Invalid or expired token" })
    }

    res.status(500).json({ message: "Server error" })
  }
}

