import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const OLLAMA_URL = "http://192.168.1.120:11434/api/chat";

app.post("/chat", async (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const prompt = req.body.message;

    const body = {
        model: "BiAS23-AI",
        stream: true,
        messages: [
            { role: "user", content: prompt }
        ]
    };

    const response = await fetch(OLLAMA_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);

        // Ollama output: JSON per baris
        const lines = text.split("\n").filter((l) => l.trim() !== "");

        for (const line of lines) {
            try {
                const json = JSON.parse(line);
                const content = json?.message?.content;

                if (content) {
                    res.write(`data: ${content}\n\n`);
                }
            } catch (e) {
                console.log("Chunk invalid:", line);
            }
        }
    }

    res.write("data: [DONE]\n\n");
    res.end();
});

app.listen(3000, () => {
    console.log("Live Chat berjalan di http://localhost:3000");
});
