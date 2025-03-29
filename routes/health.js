import express from "express"
import mongoose from "mongoose"

const router = express.Router()

// @route   GET api/health
// @desc    Check server health
// @access  Public
router.get("/", (req, res) => {
  const dbState = mongoose.connection.readyState
  const states = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  }

  res.status(200).json({
    status: "ok",
    message: "Server is running",
    timestamp: new Date().toISOString(),
    mongodb: states[dbState],
    environment: process.env.NODE_ENV || "development",
    nodeVersion: process.version,
  })
})

// @route   GET api/health/db
// @desc    Check database connection
// @access  Public
router.get("/db", (req, res) => {
  const dbState = mongoose.connection.readyState
  const states = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  }

  if (dbState === 1) {
    return res.status(200).json({
      status: "ok",
      message: "Database is connected",
      connection: {
        state: states[dbState],
        host: mongoose.connection.host,
        name: mongoose.connection.name,
      },
    })
  }

  res.status(503).json({
    status: "error",
    message: "Database is not connected",
    connection: {
      state: states[dbState],
    },
  })
})

// @route   GET api/health/echo
// @desc    Echo back request data for testing
// @access  Public
router.get("/echo", (req, res) => {
  res.status(200).json({
    headers: req.headers,
    query: req.query,
    timestamp: new Date().toISOString(),
  })
})

export default router

