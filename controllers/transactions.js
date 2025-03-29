import mongoose from "mongoose"
import Transaction from "../models/Transaction.js"
import pythonService from "../services/pythonService.js"

// @route   GET api/transactions
// @desc    Get all transactions for a user
// @access  Private
export const getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user.id }).sort({ date: -1 })
    res.json(transactions)
  } catch (error) {
    console.error("Error in getTransactions:", error.message)
    res.status(500).json({ message: "Server error" })
  }
}

// @route   GET api/transactions/:id
// @desc    Get a transaction by ID
// @access  Private
export const getTransactionById = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id)

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" })
    }

    // Check if transaction belongs to user
    if (transaction.user.toString() !== req.user.id) {
      return res.status(401).json({ message: "Not authorized" })
    }

    res.json(transaction)
  } catch (error) {
    console.error("Error in getTransactionById:", error.message)

    if (error.kind === "ObjectId") {
      return res.status(404).json({ message: "Transaction not found" })
    }

    res.status(500).json({ message: "Server error" })
  }
}

// @route   POST api/transactions
// @desc    Create a transaction
// @access  Private
export const createTransaction = async (req, res) => {
  try {
    const { name, amount, date, category, notes } = req.body

    // Create new transaction
    const newTransaction = new Transaction({
      user: req.user.id,
      name,
      amount,
      date: date || Date.now(),
      category,
      notes,
    })

    // Save transaction to database
    const transaction = await newTransaction.save()

    // Sync with Python service if available
    try {
      await pythonService.importTransactions(req.user.id, [
        {
          name: transaction.name,
          amount: transaction.amount,
          date: transaction.date,
          category: transaction.category,
          notes: transaction.notes,
        },
      ])
    } catch (syncError) {
      console.error("Failed to sync transaction with AI service:", syncError)
      // Don't fail the request if sync fails
    }

    res.status(201).json(transaction)
  } catch (error) {
    console.error("Error in createTransaction:", error.message)
    res.status(500).json({ message: "Server error" })
  }
}

// @route   PUT api/transactions/:id
// @desc    Update a transaction
// @access  Private
export const updateTransaction = async (req, res) => {
  try {
    const { name, amount, date, category, notes } = req.body

    // Build transaction object
    const transactionFields = {}
    if (name !== undefined) transactionFields.name = name
    if (amount !== undefined) transactionFields.amount = amount
    if (date !== undefined) transactionFields.date = date
    if (category !== undefined) transactionFields.category = category
    if (notes !== undefined) transactionFields.notes = notes

    // Find transaction
    let transaction = await Transaction.findById(req.params.id)

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" })
    }

    // Check if transaction belongs to user
    if (transaction.user.toString() !== req.user.id) {
      return res.status(401).json({ message: "Not authorized" })
    }

    // Update transaction
    transaction = await Transaction.findByIdAndUpdate(req.params.id, { $set: transactionFields }, { new: true })

    res.json(transaction)
  } catch (error) {
    console.error("Error in updateTransaction:", error.message)

    if (error.kind === "ObjectId") {
      return res.status(404).json({ message: "Transaction not found" })
    }

    res.status(500).json({ message: "Server error" })
  }
}

// @route   DELETE api/transactions/:id
// @desc    Delete a transaction
// @access  Private
export const deleteTransaction = async (req, res) => {
  try {
    // Find transaction
    const transaction = await Transaction.findById(req.params.id)

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" })
    }

    // Check if transaction belongs to user
    if (transaction.user.toString() !== req.user.id) {
      return res.status(401).json({ message: "Not authorized" })
    }

    // Delete transaction
    await Transaction.findByIdAndRemove(req.params.id)

    res.json({ message: "Transaction removed" })
  } catch (error) {
    console.error("Error in deleteTransaction:", error.message)

    if (error.kind === "ObjectId") {
      return res.status(404).json({ message: "Transaction not found" })
    }

    res.status(500).json({ message: "Server error" })
  }
}

// @route   GET api/transactions/stats
// @desc    Get transaction statistics
// @access  Private
export const getTransactionStats = async (req, res) => {
  try {
    // Get total income
    const income = await Transaction.aggregate([
      { $match: { user: mongoose.Types.ObjectId(req.user.id), category: "Income" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ])

    // Get total expenses
    const expenses = await Transaction.aggregate([
      { $match: { user: mongoose.Types.ObjectId(req.user.id), category: { $ne: "Income" } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ])

    // Get expenses by category
    const expensesByCategory = await Transaction.aggregate([
      { $match: { user: mongoose.Types.ObjectId(req.user.id), category: { $ne: "Income" } } },
      { $group: { _id: "$category", total: { $sum: "$amount" } } },
      { $sort: { total: -1 } },
    ])

    // Get monthly data
    const monthlyData = await Transaction.aggregate([
      { $match: { user: mongoose.Types.ObjectId(req.user.id) } },
      {
        $project: {
          month: { $month: "$date" },
          year: { $year: "$date" },
          amount: 1,
          category: 1,
        },
      },
      {
        $group: {
          _id: { month: "$month", year: "$year", category: { $eq: ["$category", "Income"] } },
          total: { $sum: "$amount" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ])

    res.json({
      income: income.length > 0 ? income[0].total : 0,
      expenses: expenses.length > 0 ? expenses[0].total : 0,
      expensesByCategory,
      monthlyData,
    })
  } catch (error) {
    console.error("Error in getTransactionStats:", error.message)
    res.status(500).json({ message: "Server error" })
  }
}

