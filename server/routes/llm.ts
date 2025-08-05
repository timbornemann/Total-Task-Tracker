import { Router } from "express";

export default function createLlmRouter({ getConfig }) {
  const router = Router();

  router.post("/", async (req, res) => {
    try {
      const { llmUrl, llmToken, llmModel } = getConfig();
      if (!llmUrl || !llmToken) throw new Error("LLM not configured");
      const payload = req.body || {};
      const resp = await fetch(llmUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${llmToken}`,
        },
        body: JSON.stringify({ model: llmModel, ...payload }),
      });
      const text = await resp.text();
      res.status(resp.status).type("application/json").send(text);
    } catch {
      res.status(500).json({ error: "llm_error" });
    }
  });

  return router;
}
