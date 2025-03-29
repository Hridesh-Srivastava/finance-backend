import express from "express"
import { check } from "express-validator"
import { submitContactForm, getContactSubmissions } from "../controllers/contact.js"
import auth from "../middleware/auth.js"

const router = express.Router()

// @route   POST api/contact
// @desc    Submit contact form
// @access  Public
router.post(
  "/",
  [
    check("name", "Name is required").not().isEmpty(),
    check("email", "Please include a valid email").isEmail(),
    check("subject", "Subject is required").not().isEmpty(),
    check("message", "Message is required").not().isEmpty(),
  ],
  submitContactForm,
)

// @route   GET api/contact
// @desc    Get all contact submissions (admin only)
// @access  Private/Admin
router.get("/", auth, getContactSubmissions)

export default router

