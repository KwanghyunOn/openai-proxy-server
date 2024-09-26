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
