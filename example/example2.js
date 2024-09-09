// ----------------
// -- example2.js --
// ---------------------------------------------------------------------------------------------------------
// This example shows how to use the llm-distillery library to distill a text file.
// The text file is read from the ./example.txt file.
// The distilled text is then logged to the console.
// useChunkingThreshold is set to false, so the text is only chunked based on a token count (this is faster,
//   but less accurate than using the chunking threshold).
// The chunking threshold is set to 1000, which means that chunks that are 1000 tokens long are combined.
// The tokenizer model is set to "Xenova/bert-base-uncased", which is a BERT model.
// The model is set to "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo", which is a Meta Llama 3.1 model.
// The stop tokens are set to ["<|eot_id|>","<|eom_id|>"], which are the stop tokens for the model.
// The max distillation loops is set to 10, which means that the distillation process will loop 10 times.
// The logging is set to true, which means that the distillation process will log to the console.   
// ---------------------------------------------------------------------------------------------------------

import { llmDistillery } from "../llm-distillery.js"; // this is typically just "import { llmDistillery } from 'llm-distillery';", but this is a local test
import fs from 'fs';

const text = await fs.promises.readFile('./example.txt', 'utf8'); // the text to distill
const llmDistilleryOptions = {
    targetTokenSize: 1000,                                   // the target token size for the distilled text
    baseUrl: "https://api.together.xyz/v1",                  // the base URL for your openAI-compatible API
    apiKey: "xxxxxxxxxxxxxxxxxxxxxxxxxxxx",                  // your API key
    llmModel: "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo", // the model to use for distillation
    stopTokens: ["<|eot_id|>","<|eom_id|>"],                 // the stop tokens to use for distillation
    maxDistillationLoops: 10,                                // the maximum number of distillation loops to perform
    tokenizerModel: "Xenova/bert-base-uncased",              // the tokenizer model to use for chunking
    useChunkingThreshold: false,                             // whether to use the chunking threshold for chunking
    llmContextLength: 8000,                                  // the context length to use for the model
    llmMaxGenLength: 2048,                                   // the maximum generation length for the model
    llmApiRateLimit: 500,                                    // the rate limit for the model
    logging: true,                                           // whether to log the distillation process to console
}

const distilledText = await llmDistillery(text, llmDistilleryOptions); // perform the distillation
console.log(`llm-distillery results ⇢ \n${distilledText}`);           // the distilled text
