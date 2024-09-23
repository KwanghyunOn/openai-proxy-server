const express = require("express")

const app = express()
// const TARGET_BASE_URL = "https://reliv-openai-east-us.openai.azure.com"
const TARGET_BASE_URL = "https://api.openai.com/v1"

// Body parser middleware
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Custom middleware to log request body
app.use((req, res, next) => {
  console.log("Request Body:", req.body)
  next()
})

// Proxy middleware
app.use("/", (req, res) => {
  const targetUrl = new URL(req.url, TARGET_BASE_URL)
  console.log("Target URL:", targetUrl.toString())

  const body = JSON.stringify(req.body)

  const headers = {
    ...req.headers,
    host: targetUrl.hostname,
    "content-length": Buffer.byteLength(body),
  }

  const options = {
    method: req.method,
    headers: headers,
    body: body,
  }

  console.log("Proxy options:", options)

  fetch(targetUrl.toString(), options)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Fetch Error: ${response.statusText}`)
      }
      return response.json()
    })
    .then((data) => {
      console.log("Response:", data)
      res.json(data)
    })
    .catch((error) => {
      console.error("Fetch Error:", error)
      res.status(500).send("Fetch Error")
    })
})

if (process.env.NODE_ENV === "development") {
  const PORT = 3000
  app.listen(PORT, () => {
    console.log(`Development server running on http://localhost:${PORT}`)
  })
} else {
  module.exports = app
}
