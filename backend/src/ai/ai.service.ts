import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function summarizeText(text: string) {
  const response = await client.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [{ role: "user", content: `Summarize: ${text}` }],
  });
  return response.choices[0].message?.content;
}
