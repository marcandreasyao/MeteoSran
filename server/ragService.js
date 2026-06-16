import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load or search the precompiled RAG JSON index.
let ragIndex = null;
const INDEX_PATH = path.join(__dirname, 'data', 'rag_index.json');

function loadIndex() {
    if (ragIndex) return true;
    try {
        if (fs.existsSync(INDEX_PATH)) {
            const raw = fs.readFileSync(INDEX_PATH, 'utf8');
            ragIndex = JSON.parse(raw);
            console.log(`[MeteoSran RAG] Loaded RAG index with ${ragIndex.chunks.length} chunks.`);
            return true;
        }
    } catch (err) {
        console.error("[MeteoSran RAG] Failed to load RAG index:", err);
    }
    return false;
}

// Tokenize text for BM25
export function tokenize(text) {
    return text.toLowerCase()
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, "")
        .split(/\s+/)
        .filter(t => t.length > 1);
}

// Cosine Similarity between two arrays
function cosineSimilarity(vecA, vecB) {
    let dotProduct = 0.0;
    let normA = 0.0;
    let normB = 0.0;
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// BM25 scoring for a document chunk
function scoreBM25(queryTokens, chunk, avgDocLen, N, idfDict, k1 = 1.2, b = 0.75) {
    let score = 0;
    const docTokens = chunk.tokens;
    const docLen = docTokens.length;

    // Calculate term counts in document
    const termCounts = {};
    for (const t of docTokens) {
        termCounts[t] = (termCounts[t] || 0) + 1;
    }

    for (const token of queryTokens) {
        if (!idfDict[token]) continue;
        const tf = termCounts[token] || 0;
        const idf = idfDict[token];
        
        // Standard BM25 formula
        const numerator = tf * (k1 + 1);
        const denominator = tf + k1 * (1 - b + b * (docLen / avgDocLen));
        score += idf * (numerator / denominator);
    }
    return score;
}

/**
 * Retrieve relevant chunks using Hybrid RAG (Dense + BM25) combined via Reciprocal Rank Fusion (RRF).
 */
export async function retrieveHybrid(queryText, apiKey, topK = 3) {
    if (!loadIndex()) {
        console.warn("[MeteoSran RAG] Index not available. Skipping retrieval.");
        return [];
    }

    try {
        const queryTokens = tokenize(queryText);
        if (queryTokens.length === 0) return [];

        // 1. DENSE RETRIEVAL (Embeddings)
        const genAI = new GoogleGenAI({ apiKey });
        const embedResponse = await genAI.models.embedContent({
            model: 'gemini-embedding-2',
            contents: queryText
        });
        const queryEmbedding = embedResponse.embedding?.values;
        if (!queryEmbedding) {
            throw new Error("Could not extract query embedding values");
        }

        // Rank by Cosine Similarity
        const denseRankings = ragIndex.chunks.map((chunk, idx) => {
            const similarity = cosineSimilarity(queryEmbedding, chunk.embedding);
            return { idx, similarity };
        }).sort((a, b) => b.similarity - a.similarity);

        // 2. SPARSE RETRIEVAL (BM25)
        const N = ragIndex.chunks.length;
        const avgDocLen = ragIndex.avgDocLen;
        const idfDict = ragIndex.idf;

        const sparseRankings = ragIndex.chunks.map((chunk, idx) => {
            const score = scoreBM25(queryTokens, chunk, avgDocLen, N, idfDict);
            return { idx, score };
        }).sort((a, b) => b.score - a.score);

        // 3. RECIPROCAL RANK FUSION (RRF)
        // Score(d) = sum( 1 / (60 + rank_in_system) )
        const rrfScores = {};
        
        // Add dense rankings (only top 20 to speed up)
        denseRankings.slice(0, 20).forEach((item, rank) => {
            rrfScores[item.idx] = (rrfScores[item.idx] || 0) + (1 / (60 + rank + 1));
        });

        // Add sparse rankings (only top 20)
        sparseRankings.slice(0, 20).forEach((item, rank) => {
            if (item.score > 0) { // Only fuse if there's keyword relevance
                rrfScores[item.idx] = (rrfScores[item.idx] || 0) + (1 / (60 + rank + 1));
            }
        });

        // Sort by RRF score
        const fusedResults = Object.keys(rrfScores).map(idxStr => {
            const idx = parseInt(idxStr, 10);
            return {
                chunk: ragIndex.chunks[idx],
                rrfScore: rrfScores[idx]
            };
        }).sort((a, b) => b.rrfScore - a.rrfScore);

        return fusedResults.slice(0, topK).map(res => res.chunk.text);
    } catch (err) {
        console.error("[MeteoSran RAG] Hybrid retrieval failed:", err);
        return [];
    }
}
