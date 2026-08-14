import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // AI Slide Generation endpoint
  app.post("/api/generate-slides", async (req, res) => {
    try {
      const { prompt } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "GEMINI_API_KEY is not configured on the server." });
      }

      const ai = new GoogleGenAI({ apiKey });
      const systemInstruction = `You are an expert presentation designer and educator. The user will ask for a presentation topic. Generate a structured JSON array of 5 to 7 slides.
Each slide object must strictly adhere to this TypeScript structure:
{
  "id": "string",
  "title": "string",
  "subtitle": "string",
  "layout": "hero" | "bullets" | "split" | "stats" | "quote" | "conclusion",
  "badge": "string (short category tag)",
  "content": ["bullet point 1", "bullet point 2", "bullet point 3"],
  "stats": [{"label": "string", "value": "string"}], // optional, for stats layout
  "quote": "string", // optional, for quote layout
  "quoteAuthor": "string", // optional, for quote layout
  "speakerNotes": "string (notes for the presenter)"
}
Return ONLY valid JSON wrapped in a markdown code block or as raw JSON array. No extra conversational filler.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [prompt],
        config: {
          systemInstruction,
          responseMimeType: "application/json",
        },
      });

      const text = response.text;
      if (!text) {
        throw new Error("No response generated from Gemini");
      }

      const slides = JSON.parse(text);
      res.json({ slides });
    } catch (error: any) {
      console.error("Error generating slides:", error);
      res.status(500).json({ error: error.message || "Failed to generate slides" });
    }
  });

  // Vite middleware for development or static file serving for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
