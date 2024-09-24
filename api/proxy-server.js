const express = require("express")
const { createProxyMiddleware } = require("http-proxy-middleware")
const morgan = require("morgan")

const app = express()
const PORT = 3000
const TARGET = "https://api.openai.com"

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"))
}

app.use((req, res, next) => {
  console.log(`Request: ${req.method} ${req.url}`)

  const oldWrite = res.write
  const oldEnd = res.end
  const chunks = []

  res.write = function (chunk) {
    chunks.push(chunk)
    return oldWrite.apply(res, arguments)
  }

  res.end = function (chunk) {
    if (chunk) chunks.push(chunk)
    const body = Buffer.concat(chunks).toString("utf8")
    console.log(`Response: ${res.statusCode}`)
    console.log(`Response body: ${body}`)
    oldEnd.apply(res, arguments)
  }

  next()
})

const proxy = createProxyMiddleware({
  target: TARGET,
  changeOrigin: true,
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
