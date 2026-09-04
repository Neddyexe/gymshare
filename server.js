import express from "express";
import OpenAI from "openai";
import "dotenv/config";
import path from "path";

const app = express();
app.use(express.json({ limit: "200kb" }));
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(path.join(process.cwd(), "public", "index.html"));
});

const groq = process.env.GROQ_API_KEY
  ? new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: "https://api.groq.com/openai/v1",
    })
  : null;

const COACH = `
You are Gym Chat Personal, a friendly, concise gym coach.

The user has completed an onboarding profile. Use that profile when coaching.
Coach one exercise or set at a time rather than dumping a whole session.

Priorities:
- safe technique
- progressive overload
- sensible recovery
- adherence to the user's goals and preferences
- adapt around the user's available equipment and training frequency

Never diagnose medical conditions or interpret wearable/health data as a diagnosis.
If the user reports pain, dizziness, fainting, chest pain, or alarming symptoms, advise them to stop exercise and seek appropriate medical help.

When the user reports reps, acknowledge them and tell them the next action.
Keep answers compact, encouraging, and specific.
`;

app.post("/api/coach", async (req, res) => {
  try {
    if (!groq) {
      return res.status(503).json({ error: "GROQ_API_KEY not configured" });
    }

    const payload = req.body || {};

    const response = await groq.responses.create({
      model: "openai/gpt-oss-120b",
      instructions: COACH,
      input: `User profile:\n${JSON.stringify(payload.profile)}\n\nTraining state:\n${JSON.stringify(payload.state)}\n\nUser: ${String(payload.message || "")}`,
    });

    res.json({ text: response.output_text || "Tell me how that set felt." });
  } catch (err) {
    console.error("Groq error:", err);
    res.status(500).json({ error: "Coach request failed" });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Gym Chat Personal running on http://localhost:${port}`);
});
