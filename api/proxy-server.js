const express = require("express")
const {
  createProxyMiddleware,
  responseInterceptor,
} = require("http-proxy-middleware")
const morgan = require("morgan")
const { addLogEntry } = require("../utils/supabase")
const { parseOpenAIStreamingResponse } = require("../utils/parse")

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
      let rawBody = ""
      req.on("data", (chunk) => {
        rawBody += chunk
      })
      req.on("end", () => {
        const decodedBody = Buffer.from(rawBody).toString("utf8")
        console.log(`onProxyReq: ${decodedBody}`)
        addLogEntry({
          type: "request",
          method: req.method,
          url: req.url,
          body: decodedBody,
        })
      })
    },
    proxyRes: responseInterceptor(
      async (responseBuffer, proxyRes, req, res) => {
        const response = responseBuffer.toString("utf8")
        if (
          res.getHeader("content-type") &&
          res.getHeader("content-type").includes("text/event-stream")
        ) {
          const parsedResponse = parseOpenAIStreamingResponse(response)
          console.log("parsedResponse:\n", parsedResponse)
          addLogEntry({
            type: "response",
            method: req.method,
            url: req.url,
            parsedResponse,
          })
        } else {
          console.log("response", response)
          addLogEntry({
            type: "response",
            method: req.method,
            url: req.url,
            response: response,
          })
        }
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
