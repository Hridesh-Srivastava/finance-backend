import axios from "axios";

// Create an axios instance for the Python service
const pythonApi = axios.create({
  baseURL: process.env.PYTHON_SERVICE_URL || "http://localhost:5001/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Service functions
const pythonService = {
  // Ask a question to the AI
  askQuestion: async (userId, question) => {
    try {
      const response = await pythonApi.post("/ai/ask", {
        user_id: userId,
        question,
      });

      return response.data;
    } catch (error) {
      console.error("Error asking question to Python service:", error);
      throw new Error("Failed to get AI response");
    }
  },

  // Get AI-generated insights
  getInsights: async (userId) => {
    try {
      const response = await pythonApi.get("/ai/insights", {
        params: { user_id: userId },
      });

      return response.data;
    } catch (error) {
      console.error("Error getting insights from Python service:", error);
      throw new Error("Failed to get AI insights");
    }
  },

  // Import transactions to the Python service
  importTransactions: async (userId, transactions) => {
    try {
      const response = await pythonApi.post("/transactions/import", {
        user_id: userId,
        transactions,
      });

      return response.data;
    } catch (error) {
      console.error("Error importing transactions to Python service:", error);
      throw new Error("Failed to import transactions to AI service");
    }
  },
};

export default pythonService;