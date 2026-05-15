import { Router } from "express";
import { z } from "zod";
import { createHash } from "crypto";
import { ai } from "@workspace/integrations-gemini-ai";
import { db } from "@workspace/db";
import { semanticCacheTable, syllabusChunksTable } from "@workspace/db";
import { and, eq } from "drizzle-orm";

const router = Router();

const ExplainTopicRequestSchema = z.object({
  topic: z.string().min(1, "Topic is required"),
  subtopic: z.string().optional(),
  subject: z.string().optional(),
  examType: z.string().default("BSC_BIOTECH_PART1"),
  depth: z.enum(["basic", "detailed", "exam-focused"]).default("detailed"),
  pedagogyStyle: z.enum(["english", "hinglish", "mnemonic"]).default("english"),
});

const ExplainTopicResponseSchema = z.object({
  topic: z.string(),
  explanation: z.string(),
  keyPoints: z.array(z.string()),
  relatedTopics: z.array(z.string()),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  mnemonics: z.array(z.string()).optional(),
});

type ExplainTopicRequest = z.infer<typeof ExplainTopicRequestSchema>;
type ExplainTopicResponse = z.infer<typeof ExplainTopicResponseSchema>;

router.post("/topic", async (req, res) => {
  try {
    const { topic, subtopic, subject, examType, depth, pedagogyStyle } = ExplainTopicRequestSchema.parse(req.body);

    const queryHash = createHash("sha256")
      .update(JSON.stringify({ topic, subtopic, subject, examType, depth, pedagogyStyle }))
      .digest("hex");

    const [cachedEntry] = await db
      .select()
      .from(semanticCacheTable)
      .where(eq(semanticCacheTable.queryHash, queryHash))
      .limit(1);

    if (cachedEntry) {
      await db
        .update(semanticCacheTable)
        .set({ hits: cachedEntry.hits + 1, lastHitAt: new Date() })
        .where(eq(semanticCacheTable.id, cachedEntry.id));

      const cachedResponse = JSON.parse(cachedEntry.response) as ExplainTopicResponse;
      return res.json(cachedResponse);
    }

    const syllabusData = await db
      .select()
      .from(syllabusChunksTable)
      .where(and(eq(syllabusChunksTable.topic, topic), eq(syllabusChunksTable.examType, examType)))
      .limit(1);

    let context = "";
    if (syllabusData.length > 0) {
      context = syllabusData[0].content;
    }

    const prompt = `You are an expert B.Sc. Biotechnology tutor. Provide a comprehensive ${depth} explanation for the topic "${topic}" for the ${examType} exam.

${subject ? `Subject: ${subject}\n` : ""}${subtopic ? `Subtopic: ${subtopic}\n` : ""}
${context ? `Use this syllabus context as reference:\n${context}\n\n` : ""}
Use the pedagogy style: ${pedagogyStyle}. Include definitions, examples, exam tips, mnemonic memory aids where relevant, and a clear structure for undergraduate students.

Please structure your response as a JSON object with the following fields:
- topic: The topic name
- explanation: A detailed, engaging explanation with examples and exam-focused guidance
- keyPoints: Array of 5-8 key learning points
- relatedTopics: Array of 3-5 related topics to study next
- difficulty: "beginner", "intermediate", or "advanced"
- mnemonics: Array of mnemonic phrases or memory aids

Response must be valid JSON only.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { maxOutputTokens: 2000, temperature: 0.7 },
    });

    if (!response.text) {
      throw new Error("Failed to generate explanation");
    }

    let explanationData: ExplainTopicResponse;
    try {
      explanationData = ExplainTopicResponseSchema.parse(JSON.parse(response.text));
    } catch (parseError) {
      explanationData = {
        topic,
        explanation: response.text,
        keyPoints: ["Key concepts covered in the explanation"],
        relatedTopics: ["Related biotechnology topics"],
        difficulty: "intermediate",
        mnemonics: [],
      };
    }

    await db.insert(semanticCacheTable).values({
      queryHash,
      queryText: prompt,
      queryTokens: "",
      response: JSON.stringify(explanationData),
      hits: 0,
      similarity: 1.0,
      createdAt: new Date(),
      lastHitAt: new Date(),
    });

    return res.json(explanationData);
  } catch (error) {
    console.error("Error explaining topic:", error);
    return res.status(500).json({
      error: "Failed to generate topic explanation",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;