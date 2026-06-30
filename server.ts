import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

// Initialize Gemini API client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// JSON parsing middleware with increased limit for brain dumps
app.use(express.json({ limit: "5mb" }));

// API: AI Task Breakdown
app.post("/api/gemini/breakdown", async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title) {
      return res.status(400).json({ error: "Task title is required" });
    }

    const prompt = `Break down the following task into 4 to 6 extremely small, low-friction, ADHD-friendly micro-steps:
Title: "${title}"
${description ? `Description: "${description}"` : ""}

Guidelines for ADHD-friendly steps:
- Make each step highly concrete, action-oriented, and tactically simple.
- Use friendly, non-threatening language.
- The first step must be ridiculously easy to gain momentum (e.g. 'Sit down at the desk', 'Open the document').
- Keep estimated durations short (1 to 15 minutes).`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["steps"],
          properties: {
            steps: {
              type: Type.ARRAY,
              description: "List of micro-steps to accomplish the task",
              items: {
                type: Type.OBJECT,
                required: ["title", "estimatedMinutes", "order"],
                properties: {
                  title: {
                    type: Type.STRING,
                    description: "The concrete micro-action description (e.g., 'Locate the yellow folder' or 'Write just one paragraph')."
                  },
                  estimatedMinutes: {
                    type: Type.INTEGER,
                    description: "Estimated time in minutes (1 to 15)."
                  },
                  order: {
                    type: Type.INTEGER,
                    description: "The order of this step (starting at 1)."
                  }
                }
              }
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response from Gemini");
    }

    const data = JSON.parse(text.trim());
    res.json(data);
  } catch (error: any) {
    console.error("Error in breakdown api:", error);
    res.status(500).json({ error: error.message || "Failed to break down task" });
  }
});

// API: AI Brain Dump Processor
app.post("/api/gemini/brain-dump", async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ error: "Brain dump content is required" });
    }

    const prompt = `You are an expert ADHD organizational coach. The user has inputted a messy, disorganized "brain dump" of thoughts, tasks, feelings, and events. 
Analyze this text and extract:
1. "tasks": Actionable items that can be done. For each task, suggest:
   - "title": Clean, clear title.
   - "energyLevel": Either "low", "medium", or "high" based on focus and energy required.
   - "estimatedMinutes": Suggested duration.
   - "substeps": 2 to 3 micro-steps to get started on this task.
2. "notes": Reminders, ideas, reflections, feelings, or non-actionable thoughts. Categorize each note (e.g., "Idea", "Reflection", "Reminder", "Emotion").

Brain Dump content:
"""
${content}
"""`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["tasks", "notes"],
          properties: {
            tasks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["title", "energyLevel", "estimatedMinutes", "substeps"],
                properties: {
                  title: { type: Type.STRING },
                  energyLevel: { type: Type.STRING, description: "Must be 'low', 'medium', or 'high'" },
                  estimatedMinutes: { type: Type.INTEGER },
                  substeps: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  }
                }
              }
            },
            notes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["content", "category"],
                properties: {
                  content: { type: Type.STRING },
                  category: { type: Type.STRING, description: "Category of the note (e.g., 'Idea', 'Reflection', 'Reminder', 'Emotion')" }
                }
              }
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response from Gemini");
    }

    const data = JSON.parse(text.trim());
    res.json(data);
  } catch (error: any) {
    console.error("Error in brain dump api:", error);
    res.status(500).json({ error: error.message || "Failed to process brain dump" });
  }
});

// Serve static assets / Vite integration
async function startServer() {
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
