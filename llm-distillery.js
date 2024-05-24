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
import { llmDistilleryVars } from './vars.js';
const LLM_SYSTEM_PROMPT = llmDistilleryVars.LLM_SYSTEM_PROMPT;
const DEFAULT_TOKENIZER_MODEL = llmDistilleryVars.DEFAULT_TOKENIZER_MODEL;
import { chunkit } from 'semantic-chunking';
import { getTokenSize } from './get-token-size.js';
import { fetchChatCompletion } from './llm-api.js';
import { asciiArtLogo } from './logo.js';


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
            llmContextLength=4096,
            llmMaxGenLength=2048,
            llmApiRateLimit=500,
            logging = false,
        } = {}
    ) {

    let currentText = text;
    let processedText = '';
    let isUnderTokenLimit = false;
    let compressionLoop = 0;
    let tokenSize = await getTokenSize(text, tokenizerModel, false);
    let originalLength = text.length;
    let originaiTokenSize = tokenSize;
    let chunkingTokenSize = (llmContextLength - (LLM_SYSTEM_PROMPT.length * 1.5));

    if (logging) {
        console.log(`target token size ${targetTokenSize}`);
        console.log(`initial token size ${tokenSize}`);
    }

    if (tokenSize <= targetTokenSize) { isUnderTokenLimit = true; }

    while (!isUnderTokenLimit && compressionLoop < maxDistillationLoops) {
        if (logging) {
            console.log("");
            console.log(`compression loop ${compressionLoop + 1}`);
            console.log(`max compression loops ${maxDistillationLoops}`);
        }

        const chunkitOptions = {
            logging: false,
            maxTokenSize: chunkingTokenSize,
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

            // Log the chunk length and token size
            if (logging) {
                const chunkTokenSize = await getTokenSize(chunk, tokenizerModel, false);
                console.log(`------------------------`);
                console.log(`chunk ${(chunks.indexOf(chunk) + 1)} of ${chunks.length}`);
                console.log(`chunk token size ${chunkTokenSize}`);
                console.log(`chunk length ${chunk.length}`);
            }

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
                const summaryTokenSize = await getTokenSize(summary, tokenizerModel, false);
                console.log(`summary token size ${summaryTokenSize}`);
                console.log(`summary length ${summary.length}`);
                console.log(`percentage of original chunk token size ${(summaryTokenSize / chunkingTokenSize * 100).toFixed(2)}%`);
                console.log(`percentage of original chunk length ${(summary.length / chunk.length * 100).toFixed(2)}%`);
            }
            
            // Add the summary to the total summaries array
            summaries.push(summary);
        }

        processedText = summaries.join(' ');
        tokenSize = await getTokenSize(processedText, tokenizerModel, false);
        if (tokenSize <= targetTokenSize) { isUnderTokenLimit = true; }
        if (logging) {
            if (!isUnderTokenLimit) {
                console.log(`------------------------`);
                console.log(`new token size ${tokenSize}`);
            } else {
                console.log(`========================`);
                console.log(`original token size ${originaiTokenSize}`)
                console.log(`original length ${originalLength}`);
                console.log(`final token size ${tokenSize}`);
                console.log(`final token length ${processedText.length}`);
                console.log(`percentage of original token size ${(tokenSize / originaiTokenSize * 100).toFixed(2)}%`);
                console.log(`percentage of original token length ${(processedText.length / originalLength * 100).toFixed(2)}%`);
                console.log(`========================`);
            }
        }

        // If not under token limit, repeat with smaller target token size
        if (!isUnderTokenLimit) {
            currentText = processedText;
            // Optionally adjust targetTokenSize or the chunking method to progressively reduce the size
        }

        compressionLoop += 1;
    }

    // If the final token size is still over the target token size, force the response to be the target token size
    if (tokenSize > targetTokenSize && tokenSize < 1024) {
        const targetWords = calculateWordsFromTokens(targetTokenSize);
        const prompt = JSON.stringify([{ role: "system", content: `Your reponse must be ${targetWords} words or less, no exceptions! ${LLM_SYSTEM_PROMPT}\n${processedText}`}]);
        const summary = await fetchChatCompletion(prompt, baseUrl, apiKey, llmModel, stopTokens, llmMaxGenLength);
        try {
            let parsed = JSON.parse(summary);
            processedText = parsed.summary || "";
        } catch (error) {
            processedText = "";
        }
        if (logging) {
            const finalForcedToeknSize = await getTokenSize(processedText, tokenizerModel, false);
            console.log(`requested target token size ${targetTokenSize}`)
            console.log(`final forced token size ${finalForcedToeknSize}`);
        }
    }

    if (processedText === '') {
        return text;
    } else {
        return processedText;
    }
}


// --------------------------------------
// -- number of words from token count --
// --------------------------------------
function calculateWordsFromTokens(tokenCount) {
    return Math.floor(tokenCount / 1.45);
}
