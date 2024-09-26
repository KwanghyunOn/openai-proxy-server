import { ChatCompletionMessageParam } from "openai/resources/chat"

export const parseOpenAIStreamingResponse = (response: string) => {
  const events = response.split("\n\n")
  let finalResponse = ""

  for (const event of events) {
    if (event.startsWith("data: [DONE]")) {
      break
    }
    if (event.startsWith("data: ")) {
      const jsonData = JSON.parse(event.slice(6))
      if (jsonData.choices && jsonData.choices[0].delta.content) {
        finalResponse += jsonData.choices[0].delta.content
      }
    }
  }
  return finalResponse
}

export const parseWebsearchResults = (
  messages: ChatCompletionMessageParam[]
):
  | {
      url: string
      content: string
    }[] => {
  console.log("messages", messages)
  const websearchMessage = messages.find(
    (msg) =>
      msg.role === "user" &&
      typeof msg.content === "string" &&
      msg.content.includes(
        "# Inputs\n\n### Potentially Relevant Websearch Results"
      )
  )

  if (!websearchMessage || typeof websearchMessage.content !== "string") {
    return []
  }

  const regex = /Website URL: (.*?)\nWebsite content:([\s\S]*?)(?=\n____|\n$)/g
  const matches = [...websearchMessage.content.matchAll(regex)]

  return matches.map((match) => ({
    url: match[1],
    content: match[2].trim(),
  }))
}
