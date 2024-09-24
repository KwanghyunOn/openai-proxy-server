const express = require("express")
const { createProxyMiddleware } = require("http-proxy-middleware")
const morgan = require("morgan")
const zlib = require("zlib")

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
    const buffer = Buffer.concat(chunks)

    const contentEncoding = res.getHeader("content-encoding")
    const contentType = res.getHeader("content-type")

    console.log(`Response: ${res.statusCode}`)
    console.log(`Content-Type: ${contentType}`)
    console.log(`Content-Encoding: ${contentEncoding}`)

    if (contentType?.includes("text/event-stream")) {
      // Parse OpenAI streaming response
      // This is independent of the content encoding
      const events = bodyBuffer.toString("utf8").split("\n\n")
      let finalResponse = ""
      for (const event of events) {
        if (event.startsWith("data: ")) {
          try {
            const jsonData = JSON.parse(event.slice("data: ".length))
            if (jsonData.choices && jsonData.choices[0].delta.content) {
              finalResponse += jsonData.choices[0].delta.content
            }
          } catch (error) {
            console.error("Error parsing event data:", error)
          }
        }
      }
      console.log("Final streaming response:", finalResponse)
    } else {
      let body
      try {
        if (contentEncoding === "gzip") {
          body = zlib.gunzipSync(buffer).toString("utf8")
        } else if (contentEncoding === "deflate") {
          body = zlib.inflateSync(buffer).toString("utf8")
        } else if (contentEncoding === "br") {
          body = zlib.brotliDecompressSync(buffer).toString("utf8")
        } else {
          body = buffer.toString("utf8")
        }
        console.log(`Response body: ${body}`)
      } catch (error) {
        console.error(`Error decoding response body: ${error.message}`)
        console.log(`Raw response body (hex): ${buffer.toString("hex")}`)
      }
    }

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
