import mongoose from 'mongoose';
import Transaction from '../models/Transaction.js';

// @desc    Create a transaction
// @route   POST /api/transactions
// @access  Private
export const createTransaction = async (req, res) => {
  try {
    const { name, amount, date, category, notes } = req.body;

    const newTransaction = new Transaction({
      user: req.user.id,
      name,
      amount,
      date: date || Date.now(),
      category,
      notes
    });

    const transaction = await newTransaction.save();
    res.json(transaction);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Get all transactions
// @route   GET /api/transactions
// @access  Private
export const getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user.id }).sort({ date: -1 });
    res.json(transactions);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Get transaction statistics
// @route   GET /api/transactions/stats
// @access  Private
export const getTransactionStats = async (req, res) => {
  try {
    // Get total income
    const income = await Transaction.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(req.user.id), category: "Income" } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    // Get total expenses
    const expenses = await Transaction.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(req.user.id), category: { $ne: "Income" } } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    // Get expenses by category
    const expensesByCategory = await Transaction.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(req.user.id), category: { $ne: "Income" } } },
      { $group: { _id: "$category", total: { $sum: "$amount" } } },
      { $sort: { total: -1 } }
    ]);

    res.json({
      income: income.length > 0 ? income[0].total : 0,
      expenses: expenses.length > 0 ? expenses[0].total : 0,
      expensesByCategory
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};