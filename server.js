import express from "express";
import OpenAI from "openai";
import "dotenv/config";
import path from "path";

const app = express();
const ROOT = process.cwd();

app.use(express.json({ limit: "200kb" }));


// ------------------------------------------------
// FRONTEND FILES
// ------------------------------------------------

app.get("/", (req, res) => {
  res.sendFile(path.join(ROOT, "index.html"));
});

app.get("/styles.css", (req, res) => {
  res.type("text/css");
  res.sendFile(path.join(ROOT, "styles.css"));
});

app.get("/app.js", (req, res) => {
  res.type("application/javascript");
  res.sendFile(path.join(ROOT, "app.js"));
});

app.get("/manifest.webmanifest", (req, res) => {
  res.type("application/manifest+json");
  res.sendFile(path.join(ROOT, "manifest.webmanifest"));
});

app.get("/sw.js", (req, res) => {
  res.type("application/javascript");
  res.set("Cache-Control", "no-store");
  res.sendFile(path.join(ROOT, "sw.js"));
});

app.get("/icon-192.png", (req, res) => {
  res.type("image/png");
  res.sendFile(path.join(ROOT, "icon-192.png"));
});

app.get("/icon-512.png", (req, res) => {
  res.type("image/png");
  res.sendFile(path.join(ROOT, "icon-512.png"));
});


// ------------------------------------------------
// GROQ AI
// ------------------------------------------------

const groq = process.env.GROQ_API_KEY
  ? new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: "https://api.groq.com/openai/v1"
    })
  : null;


const COACH = `
You are Gym Chat Personal, a personalised fitness coach.

Build and adapt training around the user's individual profile,
goals, experience, equipment, schedule and preferences.

Priorities:
- safe technique
- sensible progression
- strength and muscle development where appropriate
- conditioning where appropriate
- recovery
- one clear next action at a time

Use the supplied user profile as important context.

Be gender-neutral unless the user explicitly tells you otherwise.

Never assume someone's goals based on gender.

Do not diagnose medical conditions.

Do not encourage training through dangerous pain,
injury symptoms or reckless max attempts.

Be concise, supportive and practical.
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
USER PROFILE
${JSON.stringify(payload.profile || {}, null, 2)}

TRAINING STATE
${JSON.stringify(payload.state || {}, null, 2)}

USER MESSAGE
${String(payload.message || "")}
      `

    });


    res.json({

      text:
        response.output_text ||
        "Tell me what you would like to work on today."

    });


  } catch (err) {

    console.error("Groq error:", err);

    res.status(500).json({
      error: "Coach request failed"
    });

  }

});


// ------------------------------------------------
// SERVER
// ------------------------------------------------

const port = process.env.PORT || 3000;

app.listen(port, () => {

  console.log(
    `Gym Chat Personal running on http://localhost:${port}`
  );

});
