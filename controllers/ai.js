import Transaction from "../models/Transaction.js"
import pythonService from "../services/pythonService.js"

// @route POST api/ai/ask
// @desc Ask a question about finances
// @access Private
export const askQuestion = async (req, res) => {
  const { question } = req.body

  if (!question) {
    return res.status(400).json({ message: "Question is required" })
  }

  try {
    // Try to use Python service if available
    try {
      const aiResponse = await pythonService.askQuestion(req.user.id, question)
      return res.json(aiResponse)
    } catch (pythonError) {
      console.error("Python service unavailable, using fallback:", pythonError)
    }

    // Fallback to simple response generation
    let answer = ""

    if (question.toLowerCase().includes("afford")) {
      // Get total income
      const income = await Transaction.aggregate([
        { $match: { user: req.user._id, category: "Income" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ])

      // Get total expenses
      const expenses = await Transaction.aggregate([
        { $match: { user: req.user._id, category: { $ne: "Income" } } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ])

      const totalIncome = income.length > 0 ? income[0].total : 0
      const totalExpenses = expenses.length > 0 ? expenses[0].total : 0
      const savings = totalIncome - totalExpenses

      answer = `Based on your current financial situation, you have $${savings.toFixed(2)} available for spending. ${
        savings > 100
          ? "You can likely afford this purchase."
          : "You might want to reconsider this purchase to maintain your budget."
      }`
    } else if (question.toLowerCase().includes("spend") || question.toLowerCase().includes("spending")) {
      // Get expenses by category
      const expensesByCategory = await Transaction.aggregate([
        { $match: { user: req.user._id, category: { $ne: "Income" } } },
        { $group: { _id: "$category", total: { $sum: "$amount" } } },
        { $sort: { total: -1 } },
      ])

      if (expensesByCategory.length > 0) {
        const topCategory = expensesByCategory[0]
        answer = `Your highest spending category is ${topCategory._id} at $${Math.abs(topCategory.total).toFixed(2)}. This represents about ${(
          (Math.abs(topCategory.total) / expensesByCategory.reduce((acc, curr) => acc + Math.abs(curr.total), 0)) * 100
        ).toFixed(0)}% of your total expenses.`
      } else {
        answer = "You don't have any recorded expenses yet."
      }
    } else if (question.toLowerCase().includes("save") || question.toLowerCase().includes("saving")) {
      answer =
        "Based on your spending patterns, you could save more by reducing your entertainment expenses and setting up automatic transfers to a savings account at the beginning of each month."
    } else {
      answer =
        "I'm not sure how to answer that question. Try asking about your spending, savings, or whether you can afford a purchase."
    }

    res.json({ answer })
  } catch (error) {
    console.error("Error in askQuestion:", error.message)
    res.status(500).json({ message: "Server error" })
  }
}

// @route GET api/ai/insights
// @desc Get AI-generated insights
// @access Private
export const getInsights = async (req, res) => {
  try {
    // Try to use Python service if available
    try {
      const aiInsights = await pythonService.getInsights(req.user.id)
      return res.json(aiInsights)
    } catch (pythonError) {
      console.error("Python service unavailable, using fallback:", pythonError)
    }

    // Generate static insights as fallback
    const income = await Transaction.aggregate([
      { $match: { user: req.user._id, category: "Income" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ])

    const expenses = await Transaction.aggregate([
      { $match: { user: req.user._id, category: { $ne: "Income" } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ])

    const expensesByCategory = await Transaction.aggregate([
      { $match: { user: req.user._id, category: { $ne: "Income" } } },
      { $group: { _id: "$category", total: { $sum: "$amount" } } },
      { $sort: { total: -1 } },
    ])

    const insights = []
    const totalIncome = income.length > 0 ? income[0].total : 0
    const totalExpenses = expenses.length > 0 ? Math.abs(expenses[0].total) : 0
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0

    if (savingsRate < 20) {
      insights.push(
        "Your current savings rate is below the recommended 20%. Consider reducing discretionary spending to increase your savings.",
      )
    } else {
      insights.push(
        `Great job! Your savings rate of ${savingsRate.toFixed(0)}% is above the recommended minimum of 20%.`,
      )
    }

    if (expensesByCategory.length > 0) {
      const topCategory = expensesByCategory[0]
      const topCategoryPercentage = (Math.abs(topCategory.total) / totalExpenses) * 100
      if (topCategoryPercentage > 30 && topCategory._id !== "Housing") {
        insights.push(
          `Your ${topCategory._id} expenses account for ${topCategoryPercentage.toFixed(0)}% of your total spending, which is relatively high. Consider ways to reduce this category.`,
        )
      }
    }

    if (totalIncome > 0 && totalExpenses > 0) {
      const expenseToIncomeRatio = (totalExpenses / totalIncome) * 100
      if (expenseToIncomeRatio > 90) {
        insights.push(
          "Your expenses are very close to your income. This leaves little room for unexpected costs or emergencies. Try to increase your buffer.",
        )
      }
    }

    if (insights.length < 2) {
      insights.push(
        "Consider setting up automatic transfers to a savings account at the beginning of each month to build your emergency fund.",
      )
    }

    res.json({ insights })
  } catch (error) {
    console.error("Error in getInsights:", error.message)
    res.status(500).json({ message: "Server error" })
  }
}

