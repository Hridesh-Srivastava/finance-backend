import Contact from "../models/Contact.js"
import { validationResult } from "express-validator"

// @route   POST api/contact
// @desc    Submit contact form
// @access  Public
export const submitContactForm = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: "Validation error", errors: errors.array() })
    }

    // Log request body for debugging
    console.log("Contact form submission received:", JSON.stringify(req.body, null, 2))

    const { name, email, subject, message } = req.body

    // Additional validation
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ message: "All fields are required" })
    }

    // Create new contact submission
    const newContact = new Contact({
      name,
      email,
      subject,
      message,
    })

    // Save to database
    const savedContact = await newContact.save()
    console.log("Contact form saved successfully with ID:", savedContact._id)

    res.status(201).json({
      message: "Thank you for your message. We'll get back to you soon.",
      success: true,
      id: savedContact._id,
    })
  } catch (error) {
    console.error("Error in submitContactForm:", error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// @route   GET api/contact
// @desc    Get all contact submissions (admin only)
// @access  Private/Admin
export const getContactSubmissions = async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 })
    res.json(contacts)
  } catch (error) {
    console.error("Error in getContactSubmissions:", error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

