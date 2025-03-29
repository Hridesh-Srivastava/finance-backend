import express from "express"
import { check } from "express-validator"
import auth from "../middleware/auth.js"
import {
  getUserProfile,
  updateUserProfile,
  updateUserSettings,
  updateUserPassword,
  forgotPassword,
  resetPassword,
} from "../controllers/users.js"

const router = express.Router()

// @route   GET api/users/profile
// @desc    Get user profile
// @access  Private
router.get("/profile", auth, getUserProfile)

// @route   PUT api/users/profile
// @desc    Update user profile
// @access  Private
router.put(
  "/profile",
  [auth, [check("name", "Name is required").not().isEmpty(), check("email", "Please include a valid email").isEmail()]],
  updateUserProfile,
)

// @route   PUT api/users/settings
// @desc    Update user settings
// @access  Private
router.put("/settings", auth, updateUserSettings)

// @route   PUT api/users/password
// @desc    Update user password
// @access  Private
router.put(
  "/password",
  [
    auth,
    [
      check("currentPassword", "Current password is required").exists(),
      check("newPassword", "New password must be at least 6 characters").isLength({ min: 6 }),
    ],
  ],
  updateUserPassword,
)

// @route   POST api/users/forgot-password
// @desc    Send password reset email
// @access  Public
router.post("/forgot-password", [check("email", "Please include a valid email").isEmail()], forgotPassword)

// @route   POST api/users/reset-password
// @desc    Reset password with token
// @access  Public
router.post(
  "/reset-password",
  [
    check("token", "Token is required").exists(),
    check("password", "Password must be at least 6 characters").isLength({ min: 6 }),
  ],
  resetPassword,
)

export default router

