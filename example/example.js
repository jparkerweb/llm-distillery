// ----------------
// -- example.js --
// --------------------------------------------------------------------------------------------------------------
// This example shows how to use the llm-distillery library to distill a text file.
// The text file is read from the ./example.txt file.
// The distilled text is then logged to the console.
// useChunkingThreshold is set to true, so the text is chunked based on a similarity threshold.
// The chunking threshold is set to 0.2, which means that chunks that are 20% similar to each other are combined.
// The tokenizer model is set to "Xenova/bert-base-uncased", which is a BERT model.
// The model is set to "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo", which is a Meta Llama 3.1 model.
// The stop tokens are set to ["<|eot_id|>","<|eom_id|>"], which are the stop tokens for the model.
// The max distillation loops is set to 10, which means that the distillation process will loop 10 times.
// The logging is set to true, which means that the distillation process will log to the console.   
// --------------------------------------------------------------------------------------------------------------


import { llmDistillery } from 'llm-distillery';
import fs from 'fs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file in the example directory
dotenv.config({ path: path.join(__dirname, '.env') });
 
const text = await fs.promises.readFile('./example2.txt', 'utf8'); // the text to distill
const llmDistilleryOptions = {
    targetTokenSize: 300,                                     // the target token size for the distilled text
    baseUrl: process.env.BASE_URL,                            // your base URL for your openAI-compatible API
    apiKey: process.env.API_KEY,                              // your API key
    llmModel: "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo",  // the model to use for distillation
    stopTokens: ["<|eot_id|>","<|eom_id|>"],                  // the stop tokens to use for distillation
    maxDistillationLoops: 10,                                 // the maximum number of distillation loops to perform
    tokenizerModel: "Xenova/bert-base-uncased",               // the tokenizer model to use for chunking
    semanticEmbeddingModel: "nomic-ai/nomic-embed-text-v1.5", // the semantic embedding model to use for chunking
    semanticEmbeddingModelQuantized: true,                    // whether to use the quantized semantic embedding model
    modelCacheDir: "models",                                  // the directory to cache the models in    
    useChunkingThreshold: true,                               // whether to use the chunking threshold for chunking
    chunkingThreshold: .4,                                    // the chunking threshold to use for chunking
    llmContextLength: 8000,                                   // the context length to use for the model
    llmMaxGenLength: 2048,                                    // the maximum generation length for the model
    llmApiRateLimit: 500,                                     // the rate limit for the model
    logging: false,                                            // whether to log the distillation process to console
}

const distilledText = await llmDistillery(text, llmDistilleryOptions); // perform the distillation
console.log(`llm-distillery results ⇢ \n${distilledText}`);           // the distilled text
