const express = require("express")
const bodyParser = require("body-parser")

const app = express()
const TARGET_BASE_URL = "https://reliv-openai-east-us.openai.azure.com"

// Body parser middleware
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

// Custom middleware to log request body
app.use((req, res, next) => {
  console.log("Request Body:", req.body)
  next()
})

// Proxy middleware
app.use("/", (req, res) => {
  const targetUrl = new URL(req.url, TARGET_BASE_URL)
  console.log("Target URL:", targetUrl.toString())

  const headers = { ...req.headers, host: targetUrl.hostname }

  const options = {
    method: req.method,
    headers: headers,
    hostname: targetUrl.hostname,
    port: targetUrl.port,
    path: targetUrl.pathname + targetUrl.search,
    protocol: targetUrl.protocol,
    rejectUnauthorized: false, // Disable SSL certificate validation
  }

  console.log("Proxy options:", options)

  fetch(targetUrl.toString(), {
    method: req.method,
    headers: headers,
    body: JSON.stringify(req.body),
  })
    .then((response) => response.json())
    .then((data) => {
      console.log("Response:", data)
      res.json(data)
    })
    .catch((error) => {
      console.error("Fetch Error:", error)
      res.status(500).send("Fetch Error")
    })
})

module.exports = app
