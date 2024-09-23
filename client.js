const axios = require("axios")

const PORT = 3000
const PROXY_ENDPOINT = `http://localhost:${PORT}`
const TARGET_ENDPOINT = "https://reliv-openai-east-us.openai.azure.com"
const DEPLOYMENT_NAME = "gpt-4o-2024-08-06"
const API_KEY = "d4b2919d120e4f089669c15543988a96"

async function callAzureOpenAI() {
  try {
    // const expectedResponse = await axios({
    //   method: "post",
    //   url: `${TARGET_ENDPOINT}/openai/deployments/${DEPLOYMENT_NAME}/chat/completions?api-version=2024-06-01`,
    //   headers: {
    //     "Content-Type": "application/json",
    //     "api-key": API_KEY,
    //   },
    //   data: {
    //     messages: [
    //       { role: "system", content: "You are a helpful assistant." },
    //       { role: "user", content: "What is the capital of France?" },
    //     ],
    //     max_tokens: 2048,
    //   },
    // })
    // console.log(
    //   "Expected Response:",
    //   JSON.stringify(expectedResponse.data, null, 2)
    // )

    const response = await axios({
      method: "post",
      url: `${PROXY_ENDPOINT}/openai/deployments/${DEPLOYMENT_NAME}/chat/completions?api-version=2024-06-01`,
      headers: {
        "Content-Type": "application/json",
        "api-key": API_KEY,
      },
      data: {
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: "What is the capital of France?" },
        ],
        max_tokens: 2048,
      },
    })

    console.log("Response:", JSON.stringify(response.data, null, 2))
  } catch (error) {
    console.error(
      "Error:",
      error.response ? error.response.data : error.message
    )
  }
}

callAzureOpenAI()
