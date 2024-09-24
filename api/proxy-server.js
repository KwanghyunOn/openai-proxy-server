const express = require("express")
const { createProxyMiddleware } = require("http-proxy-middleware")
const morgan = require("morgan")

const app = express()
const PORT = 3000
const TARGET = "https://api.openai.com"

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"))
}

const proxy = createProxyMiddleware({
  target: TARGET,
  changeOrigin: true,
  onProxyReq: (proxyReq, req, res) => {
    console.log(`Proxying: ${req.method} ${req.url} -> ${TARGET}${req.url}`)
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log(
      `Received response: ${proxyRes.statusCode} for ${req.method} ${req.url}`
    )
  },
  onError: (err, req, res) => {
    console.error("Proxy Error:", err)
    res.status(500).send("Proxy Error")
  },
})

app.use("/", proxy)

module.exports = app

if (process.env.NODE_ENV === "development") {
  app.listen(PORT, () => {
    console.log(
      `Transparent proxy server is running on http://localhost:${PORT}`
    )
  })
}

console.log(`Proxying all requests to ${TARGET}`)
