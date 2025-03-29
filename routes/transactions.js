import express from 'express';
import auth from '../middleware/auth.js';
import {
  createTransaction,
  getTransactions,
  getTransactionStats
} from '../controllers/transactions.js';

const router = express.Router();

// Apply auth middleware to all routes
router.use(auth);

// @route   POST api/transactions
// @desc    Create a transaction
// @access  Private
router.post('/', createTransaction);

// @route   GET api/transactions
// @desc    Get all transactions
// @access  Private
router.get('/', getTransactions);

// @route   GET api/transactions/stats
// @desc    Get transaction statistics
// @access  Private
router.get('/stats', getTransactionStats);

export default router;