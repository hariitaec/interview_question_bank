import express from "express";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataPath = path.join(__dirname, "data", "questions.json");
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

async function getQuestions() {
  return JSON.parse(await readFile(dataPath, "utf8"));
}

app.get("/api/questions", async (_req, res) => res.json(await getQuestions()));

app.post("/api/questions", async (req, res) => {
  const questions = await getQuestions();
  const question = {
    id: crypto.randomUUID(),
    title: String(req.body.title || "Untitled question").trim(),
    answer: String(req.body.answer || "").trim(),
    category: String(req.body.category || "General"),
    difficulty: String(req.body.difficulty || "Medium"),
    tags: Array.isArray(req.body.tags) ? req.body.tags : [],
    starred: false,
    createdAt: new Date().toISOString()
  };
  questions.unshift(question);
  await writeFile(dataPath, JSON.stringify(questions, null, 2));
  res.status(201).json(question);
});

app.patch("/api/questions/:id", async (req, res) => {
  const questions = await getQuestions();
  const question = questions.find((item) => item.id === req.params.id);
  if (!question) return res.status(404).json({ error: "Question not found" });
  if (typeof req.body.starred === "boolean") question.starred = req.body.starred;
  await writeFile(dataPath, JSON.stringify(questions, null, 2));
  res.json(question);
});

app.listen(process.env.PORT || 3000, () => console.log("Interview Vault is running at http://localhost:3000"));
