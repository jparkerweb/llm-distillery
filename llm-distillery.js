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
import { chunkit, cramit } from 'semantic-chunking';
import { getTokenSize } from './get-token-size.js';
import { fetchChatCompletion } from './llm-api.js';

const { LLM_SYSTEM_PROMPT, LLM_USER_PROMPT, DEFAULT_TOKENIZER_MODEL, DEFAULT_SEMANTIC_EMBEDDING_MODEL, DEFAULT_SEMANTIC_EMBEDDING_MODEL_QUANTIZED } = llmDistilleryVars;

// --------------------------------------------------
// -- llmDistillery: distill text into target size --
// --------------------------------------------------
export async function llmDistillery(
    text,
    {
        targetTokenSize = 2048,
        baseUrl = "https://api.together.xyz/v1",
        apiKey = "xxxxxxxxxxxxxxxxxxxxxxxxxxxx",
        llmModel = "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo",
        stopTokens = ["<|eot_id|>","<|eom_id|>"],
        maxDistillationLoops = 5,
        tokenizerModel = DEFAULT_TOKENIZER_MODEL,
        semanticEmbeddingModel = DEFAULT_SEMANTIC_EMBEDDING_MODEL,
        semanticEmbeddingModelQuantized = DEFAULT_SEMANTIC_EMBEDDING_MODEL_QUANTIZED,
        modelCacheDir = null,
        useChunkingThreshold = true,
        chunkingThreshold = .25,
        llmContextLength = 4096,
        llmMaxGenLength = 2048,
        llmApiRateLimit = 500,
        logging = false,
    } = {}
) {
    let currentText = text;
    let processedText = '';
    let tokenSize = await getTokenSize(text, tokenizerModel, modelCacheDir, false);
    const originalLength = text.length;
    const originalTokenSize = tokenSize;
    const chunkingTokenSize = llmContextLength - (LLM_SYSTEM_PROMPT.length * 1.5);

    if (logging) {
        console.log(`target token size ${targetTokenSize}`);
        console.log(`initial token size ${tokenSize}`);
    }

    for (let compressionLoop = 0; compressionLoop < maxDistillationLoops && tokenSize > targetTokenSize; compressionLoop++) {
        if (logging) {
            console.log("");
            console.log(`compression loop ${compressionLoop + 1}`);
            console.log(`max compression loops ${maxDistillationLoops}`);
        }

        const chunkitOptions = {
            logging: false,
            maxTokenSize: chunkingTokenSize,
            similarityThreshold: chunkingThreshold,
            dynamicThresholdLowerBound: .1,
            dynamicThresholdUpperBound: .9,
            numSimilaritySentencesLookahead: 3,
            combineChunks: true,
            combineChunksSimilarityThreshold: chunkingThreshold - .1,
            onnxEmbeddingModel: semanticEmbeddingModel,
            onnxEmbeddingModelQuantized: semanticEmbeddingModelQuantized,
        };

        const chunks = await (useChunkingThreshold ? chunkit : cramit)(currentText, chunkitOptions);
        const summaries = [];

        for (const chunk of chunks) {
            const prompt = JSON.stringify([
                { role: "system", content: `${LLM_SYSTEM_PROMPT}\n` },
                { role: "user", content: `${LLM_USER_PROMPT}\n${chunk}` },
                { role: "assistant", content: "" }
            ]);

            await new Promise(resolve => setTimeout(resolve, llmApiRateLimit));
            
            if (typeof stopTokens === 'string') stopTokens = JSON.parse(stopTokens);

            if (logging) {
                const chunkTokenSize = await getTokenSize(chunk, tokenizerModel, modelCacheDir, false);
                console.log(`------------------------`);
                console.log(`chunk ${chunks.indexOf(chunk) + 1} of ${chunks.length}`);
                console.log(`chunk token size ${chunkTokenSize}`);
                console.log(`chunk length ${chunk.length}`);
            }

            let summary = await fetchChatCompletion(prompt, baseUrl, apiKey, llmModel, stopTokens, llmMaxGenLength);
            if (logging) console.log(`summary response: ${summary}`);
            
            try {
                summary = JSON.parse(summary)?.summary || "";
            } catch (error) {
                summary = "";
            }

            if (logging) {
                const summaryTokenSize = await getTokenSize(summary, tokenizerModel, modelCacheDir, false);
                console.log(`summary token size ${summaryTokenSize}`);
                console.log(`summary length ${summary.length}`);
                console.log(`percentage of original chunk token size ${(summaryTokenSize / chunkingTokenSize * 100).toFixed(2)}%`);
                console.log(`percentage of original chunk length ${(summary.length / chunk.length * 100).toFixed(2)}%`);
            }
            
            summaries.push(summary);
        }

        processedText = summaries.join(' ');
        tokenSize = await getTokenSize(processedText, tokenizerModel, false);
        
        if (logging) {
            console.log(`------------------------`);
            console.log(`new token size ${tokenSize}`);
            if (tokenSize <= targetTokenSize) {
                console.log(`========================`);
                console.log(`original token size ${originalTokenSize}`);
                console.log(`original length ${originalLength}`);
                console.log(`final token size ${tokenSize}`);
                console.log(`final token length ${processedText.length}`);
                console.log(`percentage of original token size ${(tokenSize / originalTokenSize * 100).toFixed(2)}%`);
                console.log(`percentage of original token length ${(processedText.length / originalLength * 100).toFixed(2)}%`);
                console.log(`========================`);
            }
        }

        currentText = processedText;
    }

    if (tokenSize > targetTokenSize && tokenSize < 1024) {
        const targetWords = calculateWordsFromTokens(targetTokenSize);
        const prompt = JSON.stringify([
            { role: "system", content: `Your response must be ${targetWords} words or less, no exceptions! ${LLM_SYSTEM_PROMPT}\n` },
            { role: "user", content: `${LLM_USER_PROMPT}\n${processedText}` },
            { role: "assistant", content: "" }
        ]);
        const summary = await fetchChatCompletion(prompt, baseUrl, apiKey, llmModel, stopTokens, llmMaxGenLength);
        try {
            processedText = JSON.parse(summary)?.summary || "";
        } catch (error) {
            processedText = "";
        }
        if (logging) {
            const finalForcedTokenSize = await getTokenSize(processedText, tokenizerModel, modelCacheDir, false);
            console.log(`requested target token size ${targetTokenSize}`);
            console.log(`final forced token size ${finalForcedTokenSize}`);
        }
    }

    return processedText || text;
}

const calculateWordsFromTokens = tokenCount => Math.floor(tokenCount / 1.45);
