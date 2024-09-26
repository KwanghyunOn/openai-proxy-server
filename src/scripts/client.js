const axios = require("axios")
require("dotenv").config()

const PORT = 3000
// const PROXY_ENDPOINT = `http://localhost:${PORT}/v1`
const PROXY_ENDPOINT = "https://openai-proxy-server.vercel.app/v1"
const AZURE_OPENAI_ENDPOINT = "https://reliv-openai-east-us.openai.azure.com"
const AZURE_OPENAI_DEPLOYMENT_NAME = "gpt-4o-2024-08-06"
const AZURE_OPENAI_API_KEY = process.env.AZURE_OPENAI_API_KEY

const OPENAI_ENDPOINT = "https://api.openai.com/v1"
const OPENAI_API_KEY = process.env.OPENAI_API_KEY

async function fetchProxyServer() {
  try {
    // const azureOpenAIResponse = await axios({
    //   method: "post",
    //   url: `${PROXY_ENDPOINT}/openai/deployments/${AZURE_OPENAI_DEPLOYMENT_NAME}/chat/completions?api-version=2024-06-01`,
    //   headers: {
    //     "Content-Type": "application/json",
    //     "api-key": AZURE_OPENAI_API_KEY,
    //   },
    //   data: {
    //     messages: [
    //       { role: "system", content: "You are a helpful assistant." },
    //       { role: "user", content: "What is the capital of France?" },
    //     ],
    //     max_tokens: 2048,
    //   },
    // })

    const openAIResponse = await axios({
      method: "post",
      url: `${PROXY_ENDPOINT}/chat/completions`,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      data: {
        messages: [
          {
            role: "system",
            content: "You are a test assistant.",
          },
          {
            role: "user",
            content: "Testing. Just say hi and nothing else.",
          },
        ],
        model: "gpt-3.5-turbo",
      },
    })

    console.log("Response:", JSON.stringify(openAIResponse.data, null, 2))
  } catch (error) {
    console.error(
      "Error:",
      error.response ? error.response.data : error.message
    )
  }
}

fetchProxyServer()
