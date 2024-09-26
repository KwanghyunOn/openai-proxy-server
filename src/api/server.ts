import express, { Request, Response } from "express"
import {
  createProxyMiddleware,
  responseInterceptor,
} from "http-proxy-middleware"
import morgan from "morgan"
import { addLogEntry } from "../utils/supabase"
import {
  parseOpenAIStreamingResponse,
  parseWebsearchResults,
} from "../utils/parse"
import { Socket } from "net"

const app = express()
const PORT = 3000
const TARGET = "https://api.openai.com"

const proxy = createProxyMiddleware({
  target: TARGET,
  changeOrigin: true,
  timeout: undefined,
  proxyTimeout: undefined,
  selfHandleResponse: true,
  on: {
    proxyReq: (proxyReq, req: Request, res: Response) => {
      console.log(`${req.method} ${req.url}`)
      let rawBody = ""
      req.on("data", (chunk: Buffer) => {
        rawBody += chunk.toString()
      })
      req.on("end", () => {
        const decodedBody = Buffer.from(rawBody).toString("utf8")
        console.log(`onProxyReq: ${decodedBody}`)

        // log request
        addLogEntry({
          type: "request",
          method: req.method,
          url: req.url,
          body: decodedBody,
        })

        // log websearch results
        const websearchResults = parseWebsearchResults(JSON.parse(decodedBody))
        if (websearchResults.length > 0) {
          for (const result of websearchResults) {
            addLogEntry({
              type: "websearch",
              url: result.url,
              content: result.content,
            })
          }
        }
      })
    },
    proxyRes: responseInterceptor(
      async (responseBuffer, proxyRes, req: Request, res: Response) => {
        const response = responseBuffer.toString("utf8")
        const contentType = res.getHeader("content-type")
        if (
          contentType &&
          typeof contentType !== "number" &&
          contentType.includes("text/event-stream")
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
            response,
          })
        }
        return response
      }
    ),
    error: (err: Error, req: Request, res: Response | Socket) => {
      console.error("Proxy Error:", err)
      if (res instanceof Response) {
        ;(res as express.Response).status(500).send("Proxy Error")
      }
    },
  },
})

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"))
}

app.use("/", proxy)

if (process.env.NODE_ENV === "development") {
  app.listen(PORT, () => {
    console.log(
      `Transparent proxy server is running on http://localhost:${PORT}`
    )
  })
}

console.log(`Proxying all requests to ${TARGET}`)

export default app
