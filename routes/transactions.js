import express from "express"
import { check } from "express-validator"
import auth from "../middleware/auth.js"
import {
  getTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getTransactionStats,
} from "../controllers/transactions.js"

const router = express.Router()

// @route   GET api/transactions
// @desc    Get all transactions for a user
// @access  Private
router.get("/", auth, getTransactions)

// @route   GET api/transactions/:id
// @desc    Get a transaction by ID
// @access  Private
router.get("/:id", auth, getTransactionById)

// @route   POST api/transactions
// @desc    Create a transaction
// @access  Private
router.post(
  "/",
  [
    auth,
    [
      check("name", "Name is required").not().isEmpty(),
      check("amount", "Amount is required").isNumeric(),
      check("category", "Category is required").isIn([
        "Food",
        "Transport",
        "Entertainment",
        "Utilities",
        "Shopping",
        "Income",
        "Other",
      ]),
    ],
  ],
  createTransaction,
)

// @route   PUT api/transactions/:id
// @desc    Update a transaction
// @access  Private
router.put("/:id", auth, updateTransaction)

// @route   DELETE api/transactions/:id
// @desc    Delete a transaction
// @access  Private
router.delete("/:id", auth, deleteTransaction)

// @route   GET api/transactions/stats
// @desc    Get transaction statistics
// @access  Private
router.get("/stats", auth, getTransactionStats)

export default router

