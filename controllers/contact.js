import Contact from "../models/Contact.js"
import { validationResult } from "express-validator"

// @route   POST api/contact
// @desc    Submit contact form
// @access  Public
export const submitContactForm = async (req, res) => {
  // Validate request
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  const { name, email, subject, message } = req.body

  try {
    // Create new contact submission
    const newContact = new Contact({
      name,
      email,
      subject,
      message,
    })

    // Save to database
    await newContact.save()

    res.status(201).json({ message: "Thank you for your message. We'll get back to you soon." })
  } catch (error) {
    console.error("Error in submitContactForm:", error.message)
    res.status(500).json({ message: "Server error" })
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
    console.error("Error in getContactSubmissions:", error.message)
    res.status(500).json({ message: "Server error" })
  }
}

