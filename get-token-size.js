// ====================
// == Get Token Size ==
// ============================================================
// == Description: This script will return the token size of ==
// == a given string based on the model's tokenizer.         ==
// ============================================================

// -----------------
// -- import libs --
// -----------------
import { env, AutoTokenizer } from '@xenova/transformers';
import { tokenizerModels } from './tokenizer-models.js';


// --------------------------
// -- get total token size --
// --------------------------
export async function getTokenSize(text, onnxModel, modelCacheDir, logging = false) {
    // --------------------------
    // -- set model variables --
    // --------------------------
    if (modelCacheDir) {    
        env.localModelPath = modelCacheDir; // local model path
        env.cacheDir = modelCacheDir;       // downloaded model cache directory
    }
    env.allowRemoteModels = true;       // allow remote models (required for models to be be downloaded)

    // find the tokenizer model in the list
    const model = tokenizerModels.find(m => m.model_name === onnxModel);
    if (!model) {
        throw new Error(`Model ${onnxModel} not found in the list of tokenizer models`);
    }

    const tokenizer = await AutoTokenizer.from_pretrained(model.model_name);
    const maxLength = model.max_tokens;
    let totalTokenCount = 0;
    let startPosition = 0;
    let endPosition = maxLength;

    // Split text and process in chunks
    while (startPosition < text.length) {
        const segment = text.slice(startPosition, endPosition);
        const tokenSize = await tokenizer(segment, {
            padding: false,      // No need to pad since we're not batching
            truncation: true,    // Ensure each segment fits the max length
            maxLength: maxLength // model's max length
        }).input_ids.size;
        totalTokenCount += tokenSize;
        if (logging) {
            console.log(`Processed segment from ${startPosition} to ${endPosition}, token size: ${tokenSize}`);
        }
        startPosition = endPosition + 1;
        endPosition = startPosition + maxLength;
    }

    return totalTokenCount;
}
