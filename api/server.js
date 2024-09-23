const express = require("express")
const bodyParser = require("body-parser")
const https = require("https")

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

  const headers = { ...req.headers, host: targetUrl.hostname }

  // Serialize the request body
  let body = null
  if (req.body && Object.keys(req.body).length > 0) {
    body = JSON.stringify(req.body)
    headers["Content-Length"] = Buffer.byteLength(body)
  } else {
    headers["Content-Length"] = 0
  }

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

  const proxyReq = https.request(options, (proxyRes) => {
    let data = ""
    proxyRes.on("data", (chunk) => {
      data += chunk
    })
    proxyRes.on("end", () => {
      try {
        const jsonData = JSON.parse(data)
        console.log("Response:", jsonData)
        res.json(jsonData)
      } catch (error) {
        console.error("Response Parsing Error:", error)
        res.status(500).send("Response Parsing Error")
      }
    })
  })

  proxyReq.on("error", (error) => {
    console.error("Proxy Request Error:", error)
    res.status(500).send("Proxy Request Error")
  })

  if (body) {
    proxyReq.write(body)
  }
  proxyReq.end()
})

if (process.env.NODE_ENV === "development") {
  const PORT = 3000
  app.listen(PORT, () => {
    console.log(`Development server running on http://localhost:${PORT}`)
  })
} else {
  module.exports = app
}
