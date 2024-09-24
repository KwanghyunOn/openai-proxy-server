const express = require("express")
const {
  createProxyMiddleware,
  responseInterceptor,
} = require("http-proxy-middleware")
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
  selfHandleResponse: true,
  on: {
    proxyReq: (proxyReq, req, res) => {
      console.log(`${req.method} ${req.url}`)
      req.on("data", (chunk) => {
        console.log(`onProxyReq: ${chunk}`)
      })
    },
    proxyRes: responseInterceptor(
      async (responseBuffer, proxyRes, req, res) => {
        const response = responseBuffer.toString("utf8") // convert buffer to string
        console.log("onProxyRes", response)
        return response
      }
    ),
    error: (err, req, res) => {
      console.error("Proxy Error:", err)
      res.status(500).send("Proxy Error")
    },
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
