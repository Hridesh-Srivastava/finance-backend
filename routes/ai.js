import express from "express"
import auth from "../middleware/auth.js"
import { askQuestion, getInsights } from "../controllers/ai.js"

const router = express.Router()

// @route   POST api/ai/ask
// @desc    Ask a question about finances
// @access  Private
router.post("/ask", auth, askQuestion)

// @route   GET api/ai/insights
// @desc    Get AI-generated insights
// @access  Private
router.get("/insights", auth, getInsights)

export default router

