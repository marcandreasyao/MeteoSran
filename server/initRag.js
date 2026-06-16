import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { tokenize } from './ragService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure dotenv
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.error("❌ Error: GEMINI_API_KEY is not defined in the environment. Cannot generate embeddings.");
    process.exit(1);
}

const txtPath = path.join(__dirname, 'data', 'world_cup_context.txt');
const outputPath = path.join(__dirname, 'data', 'rag_index.json');

async function main() {
    try {
        if (!fs.existsSync(txtPath)) {
            console.error(`❌ Text file not found at: ${txtPath}`);
            process.exit(1);
        }

        console.log("📖 Reading raw knowledge base...");
        const rawText = fs.readFileSync(txtPath, 'utf8');

        // Simple and robust semantic/section chunking based on [SECTION: ...] headers
        const sections = rawText.split(/\[SECTION:\s*/);
        const chunks = [];

        sections.forEach(sec => {
            if (!sec.trim()) return;
            const lines = sec.split('\n');
            const header = lines[0].replace(']', '').trim();
            const body = lines.slice(1).join('\n').trim();

            if (!body) return;

            // Split body into paragraphs to have finer granular chunks (around 100-150 words)
            const paragraphs = body.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
            
            paragraphs.forEach((p, idx) => {
                chunks.push({
                    id: `${header.toLowerCase().replace(/\s+/g, '_')}_p${idx}`,
                    section: header,
                    text: p
                });
            });
        });

        console.log(`🧩 Created ${chunks.length} chunks. Fetching dense embeddings via Gemini...`);
        const genAI = new GoogleGenAI({ apiKey });

        let totalTokensCount = 0;
        const processedChunks = [];

        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            console.log(`➡️  Embedding chunk ${i + 1}/${chunks.length}: "${chunk.section}"...`);
            
            const response = await genAI.models.embedContent({
                model: 'gemini-embedding-2',
                contents: chunk.text
            });

            console.log("Response keys:", Object.keys(response));
            if (response.embedding) {
                console.log("Found response.embedding");
            } else if (response.embeddings) {
                console.log("Found response.embeddings");
            }
            const embedding = response.embedding?.values || (response.embeddings && response.embeddings[0]?.values);
            if (!embedding) {
                console.log("Full response:", JSON.stringify(response, null, 2));
                throw new Error(`Failed to retrieve embedding values for chunk ${i}`);
            }

            const tokens = tokenize(chunk.text);
            totalTokensCount += tokens.length;

            processedChunks.push({
                ...chunk,
                embedding,
                tokens
            });

            // Sleep a bit to avoid hitting rate limits on free keys
            await new Promise(r => setTimeout(r, 1000));
        }

        console.log("🧮 Computing BM25 Inverse Document Frequency (IDF) index...");
        const N = processedChunks.length;
        const avgDocLen = totalTokensCount / N;

        // Count how many documents contain each token
        const dfDict = {};
        processedChunks.forEach(chunk => {
            const uniqueTokens = new Set(chunk.tokens);
            uniqueTokens.forEach(t => {
                dfDict[t] = (dfDict[t] || 0) + 1;
            });
        });

        // Compute IDF for each unique token: log(1 + (N - df + 0.5) / (df + 0.5))
        const idfDict = {};
        Object.keys(dfDict).forEach(token => {
            const df = dfDict[token];
            idfDict[token] = Math.log(1 + (N - df + 0.5) / (df + 0.5));
        });

        const outputIndex = {
            avgDocLen,
            idf: idfDict,
            chunks: processedChunks.map(c => ({
                id: c.id,
                section: c.section,
                text: c.text,
                embedding: c.embedding,
                tokens: c.tokens
            }))
        };

        // Write index file
        fs.mkdirSync(path.dirname(outputPath), { recursive: true });
        fs.writeFileSync(outputPath, JSON.stringify(outputIndex, null, 2), 'utf8');
        console.log(`✅ Success! Precompiled RAG index written to: ${outputPath}`);

    } catch (err) {
        console.error("❌ Script execution failed:", err);
        process.exit(1);
    }
}

main();
