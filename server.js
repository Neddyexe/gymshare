import express from "express";
import OpenAI from "openai";
import "dotenv/config";
import path from "path";

const app = express();

app.use(express.json({ limit: "200kb" }));

// Serve the files directly from the repository root
app.use(express.static(process.cwd()));

app.get("/", (req, res) => {
  res.sendFile(
    path.join(
      process.cwd(),
      "index.html"
    )
  );
});

const groq = process.env.GROQ_API_KEY
  ? new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: "https://api.groq.com/openai/v1"
    })
  : null;

const COACH = `
You are Gym Chat Personal, a personalised fitness coach.

Your job is to create and adapt training around the user's own profile,
goals, experience, available equipment, training frequency, and preferences.

Priorities:
- safe, clean technique
- sensible progression
- hypertrophy and strength where appropriate
- conditioning where appropriate
- recovery
- concise coaching
- one clear next action at a time

Use the supplied profile as context.

Do not diagnose medical conditions.
Do not encourage training through dangerous pain or reckless maxing.

Be supportive, specific, and practical.
`;

app.post("/api/coach", async (req, res) => {
  try {
    if (!groq) {
      return res.status(503).json({
        error: "GROQ_API_KEY not configured"
      });
    }

    const payload = req.body || {};

    const response = await groq.responses.create({
      model: "openai/gpt-oss-120b",

      instructions: COACH,

      input: `
User profile:
${JSON.stringify(payload.profile || {})}

Training state:
${JSON.stringify(payload.state || {})}

User:
${String(payload.message || "")}
      `
    });

    res.json({
      text:
        response.output_text ||
        "Tell me what you want to work on today."
    });

  } catch (err) {
    console.error("Groq error:", err);

    res.status(500).json({
      error: "Coach request failed"
    });
  }
});

const port =
  process.env.PORT || 3000;

app.listen(port, () => {
  console.log(
    `Gym Chat Personal running on http://localhost:${port}`
  );
});
