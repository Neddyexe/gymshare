# Gym Chat Personal v0.1

A clean, separate project from Gym Chat v2.

## Included
- First-time personal onboarding
- Name, age, height, weight, goals, experience, training days and equipment
- Personal AI coaching via Groq
- Voice input where the browser supports SpeechRecognition
- Local per-device profile/history storage
- Installable PWA shell
- Vercel/Express-ready backend

## Local run
1. Copy `.env.example` to `.env`
2. Add your Groq API key as `GROQ_API_KEY`
3. Run `npm install`
4. Run `npm start`
5. Open `http://localhost:3000`

## Vercel
Create a NEW GitHub repository and NEW Vercel project. Do not deploy over the existing Gym Chat v2 project.

Add this Environment Variable in Vercel:
- `GROQ_API_KEY`

Then redeploy.

## Important
This first version stores each person's profile and history in that browser/device using localStorage. That means sharing the same public link is safe for separate devices, but it is not yet true cloud accounts/sync.

Recommended next version: accounts + cloud sync (e.g. Supabase), then optional native iPhone/HealthKit integration later.
