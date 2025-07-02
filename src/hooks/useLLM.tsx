import { useSettings } from "@/hooks/useSettings";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export const useLLM = () => {
  const { llmModel } = useSettings();
  const sendMessage = async (messages: ChatMessage[]) => {
    const res = await fetch("/api/llm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages, model: llmModel }),
    });
    if (!res.ok) throw new Error("LLM request failed");
    return res.json();
  };
  return { sendMessage };
};
