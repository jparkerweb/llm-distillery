// ====================
// == llm-distillery ==
// ======================================================
// == Utalizes a map-reduce approach to distile text   == 
// == into a "right size", fiting within your target   ==
// == token limit.                                     ==
// ======================================================

// -----------------
// -- import libs --
// -----------------
import dotenv from 'dotenv';
dotenv.config();
const LLM_SYSTEM_PROMPT = process.env.LLM_SYSTEM_PROMPT;
const DEFAULT_TOKENIZER_MODEL = process.env.DEFAULT_TOKENIZER_MODEL;
import { chunkit } from 'semantic-chunking';
import { getTokenSize } from './get-token-size.js';
import { fetchChatCompletion } from './llm-api.js';


// --------------------------------------------------
// -- llmDistillery: distill text into target size --
// --------------------------------------------------
export async function llmDistillery(
        text,
        {
            targetTokenSize = 2048,
            baseUrl = "https://api.together.xyz/v1",
            apiKey = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
            llmModel = "meta-llama/Llama-3-70b-chat-hf",
            stopTokens = ["<|eot_id|>"],
            maxDistillationLoops = 5,
            tokenizerModel = DEFAULT_TOKENIZER_MODEL,
            chunkingThreshold = .25,
            llmMaxGenLength=2048,
            llmApiRateLimit=500,
            logging = false,
        } = {}
    ) {

    let currentText = text;
    let processedText = '';
    let isUnderTokenLimit = false;
    let compressionLoop = 0;
    let tokenSize = await getTokenSize(text, tokenizerModel, logging);
    let originaiTokenSize = tokenSize;

    if (logging) { console.log(`initial token size ${tokenSize}`); }

    if (tokenSize <= targetTokenSize) { isUnderTokenLimit = true; }

    while (!isUnderTokenLimit && compressionLoop < maxDistillationLoops) {
        if (logging) {
            console.log("");
            console.log(`compression loop ${compressionLoop + 1}`);
            console.log(`max compression loops ${maxDistillationLoops}`);
        }

        const chunkitOptions = {
            logging: false,
            maxTokenSize: targetTokenSize,
            similarityThreshold: chunkingThreshold, // higher value requires higher similarity to be included (less inclusive)
            dynamicThresholdLowerBound: .1,         // lower bound for dynamic threshold
            dynamicThresholdUpperBound: .9,         // upper bound for dynamic threshold
            numSimilaritySentencesLookahead: 3,
            combineChunks: true,
            combineChunksSimilarityThreshold: (chunkingThreshold - .1), // lower value will combine more chunks (more inclusive)
            onnxEmbeddingModel: "Xenova/paraphrase-multilingual-MiniLM-L12-v2",
            onnxEmbeddingModelQuantized: true,
        }
        const chunks = await chunkit(currentText, chunkitOptions);
        const summaries = [];

        for (const chunk of chunks) {
            // Add the system prompt to the chunk
            const prompt = JSON.stringify([{ role: "system", content: `${LLM_SYSTEM_PROMPT}\n${chunk}`}]);

            // wait for the rate limit delay before making the request
            await new Promise(resolve => setTimeout(resolve, llmApiRateLimit));
            
            // Parse the stop tokens
            if (typeof stopTokens === 'string') { stopTokens = JSON.parse(stopTokens); }

            // Log the chunk length
            if (logging) { console.log(`------------------------\noriginal chunk length ${chunk.length}`); }

            // Fetch the completion from the LLM
            let summary = await fetchChatCompletion(prompt, baseUrl, apiKey, llmModel, stopTokens, llmMaxGenLength);
            if (logging) { console.log(`summary response: ${summary}`); }
            try {
                let parsed = JSON.parse(summary);
                summary = parsed.summary || "";
            } catch (error) {
                summary = "";
            }

            // Log the summary length
            if (logging) {
                console.log(`summary length ${summary.length}`);
                console.log(`percentage of original chunk length ${(summary.length / chunk.length * 100).toFixed(2)}%`);
            }
            
            // Add the summary to the total summaries array
            summaries.push(summary);
        }

        processedText = summaries.join(' ');
        tokenSize = await getTokenSize(processedText, tokenizerModel, logging);
        if (tokenSize <= targetTokenSize) { isUnderTokenLimit = true; }
        if (logging) {
            if (!isUnderTokenLimit) {
                console.log(`------------------------`);
                console.log(`new token size ${tokenSize}`);
            } else {
                console.log(`========================`);
                console.log(`original token size ${originaiTokenSize}`)
                console.log(`final token size ${tokenSize}`);
                console.log(`percentage of original token size ${(tokenSize / originaiTokenSize * 100).toFixed(2)}%`);
            }
        }

        // If not under token limit, repeat with smaller target token size
        if (!isUnderTokenLimit) {
            currentText = processedText;
            // Optionally adjust targetTokenSize or the chunking method to progressively reduce the size
        }

        compressionLoop += 1;
    }

    if (processedText === '') {
        return text;
    } else {
        return processedText;
    }
}

