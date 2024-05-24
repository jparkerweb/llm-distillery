import { llmDistillery } from "./llm-distillery.js";
import fs from 'fs';

const text = await fs.promises.readFile('./example.txt', 'utf8');
const llmDistilleryOptions = {
    targetTokenSize: 700,
    baseUrl: "https://api.together.xyz/v1",
    apiKey: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    llmModel: "Llama-3-70b",
    stopTokens: ["<|eot_id|>"],
    maxDistillationLoops: 10,
    tokenizerModel: "Xenova/bert-base-uncased",
    chunkingThreshold: .175,
    llmContextLength: 8192,
    llmMaxGenLength: 2048,
    llmApiRateLimit: 500,
    logging: true,
}

const distilledText = await llmDistillery(text, llmDistilleryOptions);
console.log(`llm-distillery results ⇢ \n${distilledText}`);
