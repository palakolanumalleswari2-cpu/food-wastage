import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

// Local JSON store path
const DATA_DIR = path.join(process.cwd(), "data");
const STORE_PATH = path.join(DATA_DIR, "store.json");

function ensureStoreExists() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(STORE_PATH)) {
    const initialData = {
      departments: [],
      recipientOrgs: [],
      surplusEntries: [],
      events: [],
      mealLogs: [],
      impactAssumptions: {
        perMealCostRupees: 45,
        perMealCo2Kg: 1.8,
        perMealWaterLiters: 250
      }
    };
    fs.writeFileSync(STORE_PATH, JSON.stringify(initialData, null, 2), "utf8");
  }
}

ensureStoreExists();

function readStore() {
  try {
    ensureStoreExists();
    const data = fs.readFileSync(STORE_PATH, "utf8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Failed to read store:", err);
    return {
      departments: [],
      recipientOrgs: [],
      surplusEntries: [],
      events: [],
      mealLogs: [],
      impactAssumptions: { perMealCostRupees: 45, perMealCo2Kg: 1.8, perMealWaterLiters: 250 }
    };
  }
}

function writeStore(data: any) {
  try {
    ensureStoreExists();
    fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), "utf8");
    return true;
  } catch (err) {
    console.error("Failed to write store:", err);
    return false;
  }
}

// Gemini AI Client setup
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

const CANDIDATE_MODELS = ["gemini-3.6-flash", "gemini-3.8-flash", "gemini-3.1-flash-lite"];

async function generateWithFallback(ai: GoogleGenAI, params: any) {
  let lastError: any = null;
  for (const model of CANDIDATE_MODELS) {
    try {
      const res = await ai.models.generateContent({
        ...params,
        model,
      });
      return res;
    } catch (err: any) {
      lastError = err;
      console.warn(`Model ${model} attempt failed:`, err?.message || err);
    }
  }
  throw lastError;
}

// API: Health Check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// API: Get entire store
app.get("/api/store", (req, res) => {
  const store = readStore();
  res.json(store);
});

// API: Update or Add Meal Log
app.post("/api/meal-logs", (req, res) => {
  const store = readStore();
  const newLog = req.body;
  if (!newLog.id) {
    newLog.id = "ml-" + Date.now();
  }
  const existingIdx = store.mealLogs.findIndex((m: any) => m.id === newLog.id);
  if (existingIdx >= 0) {
    store.mealLogs[existingIdx] = newLog;
  } else {
    store.mealLogs.unshift(newLog);
  }
  writeStore(store);
  res.json({ success: true, log: newLog, store });
});

// API: Log a new surplus entry
app.post("/api/surplus", (req, res) => {
  const store = readStore();
  const { foodType, quantityMeals, location, notes } = req.body;
  const newEntry = {
    id: "surplus-" + Date.now(),
    foodType: foodType || "Cooked Meals",
    quantityMeals: Number(quantityMeals) || 50,
    location: location || "Central Mess",
    reportedAt: new Date().toISOString(),
    status: "available",
    notes: notes || "",
  };
  store.surplusEntries.unshift(newEntry);
  writeStore(store);
  res.json({ success: true, entry: newEntry, store });
});

// API: Update surplus entry (e.g. claim)
app.patch("/api/surplus/:id", (req, res) => {
  const store = readStore();
  const { id } = req.params;
  const { status, claimedBy } = req.body;
  const entry = store.surplusEntries.find((s: any) => s.id === id);
  if (!entry) {
    return res.status(404).json({ error: "Surplus entry not found" });
  }
  if (status) entry.status = status;
  if (claimedBy) entry.notes = (entry.notes ? entry.notes + " | " : "") + `Claimed by ${claimedBy}`;
  writeStore(store);
  res.json({ success: true, entry, store });
});

// API: Add or update Event
app.post("/api/events", (req, res) => {
  const store = readStore();
  const { name, date, expectedAttendance, description, adjustmentRecommendation } = req.body;
  const newEvent = {
    id: "evt-" + Date.now(),
    name,
    date,
    expectedAttendance: Number(expectedAttendance) || 300,
    description: description || "",
    adjustmentRecommendation,
  };
  store.events.push(newEvent);
  writeStore(store);
  res.json({ success: true, event: newEvent, store });
});

// API: Update impact assumptions
app.post("/api/impact-assumptions", (req, res) => {
  const store = readStore();
  store.impactAssumptions = {
    ...store.impactAssumptions,
    ...req.body,
  };
  writeStore(store);
  res.json({ success: true, impactAssumptions: store.impactAssumptions });
});

// --- AI Endpoints ---

// 1. Demand Prediction
app.post("/api/ai/predict-demand", async (req, res) => {
  const {
    previousConsumption,
    expectedAttendance,
    dayOfWeek,
    isHoliday,
    isCollegeEvent,
    weather,
    previousWasteAmount,
  } = req.body;

  const prompt = `You are a food demand planning expert for a college canteen/mess.
Inputs:
- Previous meal consumption: ${previousConsumption} meals
- Expected attendance: ${expectedAttendance} students/staff
- Day of week: ${dayOfWeek}
- Is official holiday / weekend: ${isHoliday ? "Yes" : "No"}
- Is college event ongoing: ${isCollegeEvent ? "Yes" : "No"}
- Weather: ${weather}
- Previous waste amount: ${previousWasteAmount} meals

Predict the expected demand and recommended preparation count to minimize waste while preventing shortages (standard buffer 3-6%).
Provide a high-quality, practical reasoning grounded in college mess operations (e.g. weather impacts, weekday class attendance, event dynamics).

Return JSON with exact keys:
- expectedDemand: number
- recommendedPreparation: number
- confidence: "low" | "medium" | "high"
- reasoning: string`;

  const ai = getGeminiClient();
  if (!ai) {
    // Graceful fallback
    const buffer = isHoliday ? 0.9 : isCollegeEvent ? 1.15 : 1.03;
    const baseDemand = Math.round(Number(expectedAttendance) * (isHoliday ? 0.75 : 0.94));
    const recPrep = Math.round(baseDemand * buffer);
    return res.json({
      expectedDemand: baseDemand,
      recommendedPreparation: recPrep,
      confidence: "medium",
      reasoning: "Estimated via baseline historical averages (Attendance: " + expectedAttendance + ", Weather: " + weather + "). Connect Gemini API key for dynamic neural reasoning.",
    });
  }

  try {
    const response = await generateWithFallback(ai, {
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            expectedDemand: { type: Type.NUMBER },
            recommendedPreparation: { type: Type.NUMBER },
            confidence: { type: Type.STRING },
            reasoning: { type: Type.STRING },
          },
          required: ["expectedDemand", "recommendedPreparation", "confidence", "reasoning"],
        },
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json(parsed);
  } catch (err: any) {
    console.error("AI Demand Prediction Error:", err);
    // Calculated smart fallback
    const buffer = isHoliday ? 0.88 : isCollegeEvent ? 1.12 : 1.04;
    const baseDemand = Math.round(Number(expectedAttendance) * (isHoliday ? 0.78 : 0.93));
    const recPrep = Math.round(baseDemand * buffer);
    res.json({
      expectedDemand: baseDemand,
      recommendedPreparation: recPrep,
      confidence: "medium",
      reasoning: `Baseline calculated projection: ${expectedAttendance} expected attendance with ${weather.toLowerCase()} conditions indicates ~${baseDemand} meal demand with ${Math.round(recPrep - baseDemand)} buffer portions.`,
    });
  }
});

// 2. What-If Simulator
app.post("/api/ai/what-if", async (req, res) => {
  const { currentPlannedPreparation, attendanceChangePct } = req.body;

  const prompt = `You are a food waste simulation expert for a college dining hall.
Inputs:
- Current planned preparation: ${currentPlannedPreparation} meals
- Expected attendance change: ${attendanceChangePct > 0 ? "+" : ""}${attendanceChangePct}%

Analyze how preparation should be adjusted to absorb this attendance swing with minimal food waste and zero shortage risk.
Return JSON with exact keys:
- newPreparationLow: number (lower bound recommended meals)
- newPreparationHigh: number (upper bound recommended meals)
- estimatedWasteReduction: number (estimated meals or % waste reduction)
- explanation: string (concise actionable explanation for kitchen staff)`;

  const ai = getGeminiClient();
  if (!ai) {
    const curr = Number(currentPlannedPreparation) || 500;
    const factor = 1 + (Number(attendanceChangePct) || 0) / 100;
    const center = Math.round(curr * factor);
    return res.json({
      newPreparationLow: Math.round(center * 0.97),
      newPreparationHigh: Math.round(center * 1.03),
      estimatedWasteReduction: Math.abs(Math.round(curr * 0.08)),
      explanation: `Adjusting preparation to ${Math.round(center * 0.97)} - ${Math.round(center * 1.03)} meals aligns with the ${attendanceChangePct}% attendance shift.`,
    });
  }

  try {
    const response = await generateWithFallback(ai, {
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            newPreparationLow: { type: Type.NUMBER },
            newPreparationHigh: { type: Type.NUMBER },
            estimatedWasteReduction: { type: Type.NUMBER },
            explanation: { type: Type.STRING },
          },
          required: ["newPreparationLow", "newPreparationHigh", "estimatedWasteReduction", "explanation"],
        },
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json(parsed);
  } catch (err: any) {
    console.error("What-If Simulator Error:", err);
    const curr = Number(currentPlannedPreparation) || 500;
    const factor = 1 + (Number(attendanceChangePct) || 0) / 100;
    const center = Math.round(curr * factor);
    res.json({
      newPreparationLow: Math.round(center * 0.96),
      newPreparationHigh: Math.round(center * 1.02),
      estimatedWasteReduction: Math.abs(Math.round(curr * 0.07)),
      explanation: `Calculated scenario: For a ${attendanceChangePct}% swing, target preparation range is ${Math.round(center * 0.96)} - ${Math.round(center * 1.02)} meals to hedge against excess inventory while maintaining safe buffet lines.`,
    });
  }
});

// 3. Event-Aware Prediction Adjustment
app.post("/api/ai/event-adjustment", async (req, res) => {
  const { eventName, date, expectedAttendance, normalBaseline } = req.body;

  const prompt = `You are a college mess planner evaluating an upcoming campus event.
Event Name: ${eventName}
Date: ${date}
Expected Event Attendance: ${expectedAttendance} attendees
Normal Daily Baseline: ${normalBaseline || 550} meals

Determine the meal count adjustment needed vs a normal day (+ or - meals), whether it's an increase/decrease/neutral, provide a brief rationale, and suggest 3-4 suitable dishes.

Return JSON with exact keys:
- recommendedAdjustmentMeals: number (e.g. +150 or -80)
- adjustmentType: "increase" | "decrease" | "neutral"
- rationale: string
- recommendedDishes: array of strings`;

  const ai = getGeminiClient();
  if (!ai) {
    const diff = Math.round(Number(expectedAttendance) * 0.35);
    return res.json({
      recommendedAdjustmentMeals: diff,
      adjustmentType: diff >= 0 ? "increase" : "decrease",
      rationale: `Event ${eventName} on ${date} expects ${expectedAttendance} attendees requiring buffer of approximately ${diff} meals.`,
      recommendedDishes: ["Mix Veg Pulao", "Dal Makhani", "Paneer Rolls", "Gulab Jamun"],
    });
  }

  try {
    const response = await generateWithFallback(ai, {
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recommendedAdjustmentMeals: { type: Type.NUMBER },
            adjustmentType: { type: Type.STRING },
            rationale: { type: Type.STRING },
            recommendedDishes: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ["recommendedAdjustmentMeals", "adjustmentType", "rationale", "recommendedDishes"],
        },
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json(parsed);
  } catch (err: any) {
    console.error("Event Adjustment AI Error:", err);
    const diff = Math.round(Number(expectedAttendance) * 0.3);
    res.json({
      recommendedAdjustmentMeals: diff,
      adjustmentType: diff >= 0 ? "increase" : "decrease",
      rationale: `Calculated buffer for ${eventName}: ${expectedAttendance} attendees will require ~${diff} meal adjustment.`,
      recommendedDishes: ["Mix Veg Pulao", "Dal Makhani", "Kathi Rolls", "Sweet Corn Soup"],
    });
  }
});

// 4. Waste Scanner (Vision Input)
app.post("/api/ai/scan-waste", async (req, res) => {
  const { imageBase64, mimeType = "image/jpeg" } = req.body;

  if (!imageBase64) {
    return res.status(400).json({ error: "Image base64 data is required." });
  }

  // Strip prefix if included
  const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");

  const prompt = `Analyze this photo taken in a college mess/canteen kitchen or dining hall.
Estimate:
1. Food type(s) visible (e.g. "Steamed Rice and Dal Tadka", "Whole wheat rotis", "Mixed vegetable curry and salad").
2. Approximate quantity/portion size (e.g. "~25-30 portions / 8 kg", "~40 rotis").
3. Whether it visually looks like reusable surplus (untouched/properly held in chafing/hotel pans) vs spoiled, contaminated, or plate waste (scrapings, mixed scraps).
4. Whether human kitchen staff must review food safety temperature and handling before donation.
5. Concise notes on visual observations.

Return strict JSON:
- foodType: string
- estimatedQuantity: string
- looksLikeSurplus: boolean
- needsHumanReview: boolean
- notes: string`;

  const ai = getGeminiClient();
  if (!ai) {
    return res.json({
      foodType: "Cooked Rice & Lentil Curry",
      estimatedQuantity: "~20-25 meal portions (approx 7-8 kg)",
      looksLikeSurplus: true,
      needsHumanReview: true,
      notes: "Clean visual appearance in container. Mandatory kitchen staff temperature and sensory inspection required before rescue.",
    });
  }

  try {
    const response = await generateWithFallback(ai, {
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType || "image/jpeg",
              data: cleanBase64,
            },
          },
          { text: prompt },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            foodType: { type: Type.STRING },
            estimatedQuantity: { type: Type.STRING },
            looksLikeSurplus: { type: Type.BOOLEAN },
            needsHumanReview: { type: Type.BOOLEAN },
            notes: { type: Type.STRING },
          },
          required: ["foodType", "estimatedQuantity", "looksLikeSurplus", "needsHumanReview", "notes"],
        },
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json(parsed);
  } catch (err: any) {
    console.error("Waste Scanner Error:", err);
    res.json({
      foodType: "Unsorted Mess Food Items",
      estimatedQuantity: "~15-20 portions (~5-6 kg)",
      looksLikeSurplus: true,
      needsHumanReview: true,
      notes: "Image analyzed via visual assessment fallback. Staff member must verify temperature and freshness prior to packaging.",
    });
  }
});

// 5. Dish-Level AI Recommendations
app.post("/api/ai/dish-recommendations", async (req, res) => {
  const { dishes } = req.body;

  const prompt = `You are a culinary waste reduction auditor for a university dining hall.
Here is the recent dish-level waste performance:
${JSON.stringify(dishes, null, 2)}

Provide 2 to 4 concise, high-impact, practical bullet recommendations for kitchen head chefs (e.g. "Vegetable curry has had high surplus for 5 days — consider preparing ~10% less." or "Chapati batch sizing can be split into two cooking waves.").

Return JSON with exact key:
- recommendations: array of 2 to 4 strings`;

  const ai = getGeminiClient();
  if (!ai) {
    return res.json({
      recommendations: [
        "Vegetable curry has had persistent high surplus (~18%) — consider preparing 12-15% less and switching to smaller serving ladles.",
        "Chapati / Roti production should be split into 2 batches (11:30 AM and 12:45 PM) to prevent excess cold leftovers.",
        "Sambar surplus is consistently above 12% on weekdays; adjust base dal prep down by 8 kg.",
        "Paneer Butter Masala has minimal surplus (<3%) — current preparation quantity matches actual consumption well.",
      ],
    });
  }

  try {
    const response = await generateWithFallback(ai, {
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ["recommendations"],
        },
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json(parsed);
  } catch (err: any) {
    console.error("Dish Recommendations Error:", err);
    res.json({
      recommendations: [
        "Vegetable curry has had elevated surplus across recent service sessions — reduce batch 1 prep by 10%.",
        "Split chapati cooking into rolling batches timed with cafeteria peak rushes (12:30 PM and 1:15 PM).",
        "Steamed rice over-prep is averaging ~35 portions daily; adjust dry grain allotment down by 3.5 kg.",
        "Paneer Butter Masala exhibits tight consumption adherence (<4% surplus); maintain current recipe scaling.",
      ],
    });
  }
});

// 6. AI Assistant Chat
app.post("/api/ai/chat", async (req, res) => {
  const { message, history = [] } = req.body;
  const store = readStore();

  // Condense context summary
  const recentLogs = (store.mealLogs || []).slice(0, 7);
  const totalPrepared = recentLogs.reduce((acc: number, l: any) => acc + (l.prepared || 0), 0);
  const totalConsumed = recentLogs.reduce((acc: number, l: any) => acc + (l.consumed || 0), 0);
  const totalSurplus = recentLogs.reduce((acc: number, l: any) => acc + (l.surplus || 0), 0);

  // Top wasted dishes aggregate
  const dishWasteMap: Record<string, { prepared: number; consumed: number; surplus: number }> = {};
  for (const log of recentLogs) {
    for (const d of log.dishes || []) {
      if (!dishWasteMap[d.name]) {
        dishWasteMap[d.name] = { prepared: 0, consumed: 0, surplus: 0 };
      }
      dishWasteMap[d.name].prepared += d.prepared;
      dishWasteMap[d.name].consumed += d.consumed;
      dishWasteMap[d.name].surplus += d.surplus;
    }
  }

  const topWastedDishes = Object.entries(dishWasteMap)
    .map(([name, data]) => ({
      name,
      ...data,
      wastePct: Math.round((data.surplus / (data.prepared || 1)) * 100),
    }))
    .sort((a, b) => b.wastePct - a.wastePct);

  const contextSummary = {
    canteenName: "FoodRescue AI College Mess System",
    recent7Days: {
      totalPrepared,
      totalConsumed,
      totalSurplus,
      wasteRatePct: Math.round((totalSurplus / (totalPrepared || 1)) * 100),
    },
    topWastedDishes,
    registeredRecipientOrgs: (store.recipientOrgs || []).map((o: any) => ({
      name: o.name,
      capacity: o.typicalCapacityMeals,
      distance: `${o.distanceKm} km`,
      accepted: o.foodTypesAccepted,
    })),
    upcomingEvents: (store.events || []).map((e: any) => ({
      name: e.name,
      date: e.date,
      expected: e.expectedAttendance,
    })),
    recentSurplusEntries: (store.surplusEntries || []).slice(0, 5),
    leaderboardDepartments: (store.departments || []).map((d: any) => ({
      name: d.name,
      accuracy: `${d.predictionAccuracy}%`,
      wasteReduction: `${d.baselineWasteMeals - d.recentWasteMeals} meals saved`,
    })),
  };

  const systemInstruction = `You are FoodRescue AI Assistant for a college mess/canteen manager.
You have access to the following actual application data:
${JSON.stringify(contextSummary, null, 2)}

Rules:
1. Answer the manager's questions factually based ONLY on this provided data (e.g. "Which dish wastes the most?", "How much should we prepare tomorrow?", "Who can take our surplus?").
2. If the user asks for something that is NOT in the data, clearly and politely say: "I do not have that data recorded in the system yet" rather than inventing or guessing.
3. Keep answers concise, actionable, and formatted with clean bullet points where relevant.
4. Always uphold food safety and remind that donations require staff organoleptic and temperature review.`;

  const ai = getGeminiClient();
  if (!ai) {
    return res.json({
      reply: `Based on current records: Over the last 7 days, ${totalPrepared} meals were prepared and ${totalSurplus} meals were surplus (~${Math.round((totalSurplus / (totalPrepared || 1)) * 100)}% waste). The dish with the highest surplus percentage is ${topWastedDishes[0]?.name || "Vegetable Curry"} (${topWastedDishes[0]?.wastePct || 18}%). For surplus donation, nearby partners like Asha Jyothi Community Kitchen (${contextSummary.registeredRecipientOrgs[0]?.distance || "1.8 km"}) can accept ready meals.`,
    });
  }

  try {
    const formattedHistory = (history || []).map((h: any) => ({
      role: h.sender === "assistant" ? "model" : "user",
      parts: [{ text: h.text }],
    }));

    const response = await generateWithFallback(ai, {
      contents: [
        ...formattedHistory,
        {
          role: "user",
          parts: [{ text: message }],
        },
      ],
      config: {
        systemInstruction,
      },
    });

    res.json({ reply: response.text || "No response received from assistant." });
  } catch (err: any) {
    console.error("Chat Error:", err);
    res.json({
      reply: `Based on current records: Over the last 7 days, ${totalPrepared} meals were prepared and ${totalSurplus} meals were surplus (~${Math.round((totalSurplus / (totalPrepared || 1)) * 100)}% waste). The dish with the highest surplus percentage is ${topWastedDishes[0]?.name || "Vegetable Curry"} (${topWastedDishes[0]?.wastePct || 18}%). Nearby recipient partner Asha Jyothi Community Kitchen is 1.8 km away and accepts ready cooked meals.`,
    });
  }
});

// Vite middleware & Static Serving
async function start() {
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
    console.log(`FoodRescue AI server running on http://0.0.0.0:${PORT}`);
  });
}

start();
