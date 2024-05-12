// import environment variables from .env file
import dotenv from 'dotenv';
dotenv.config();

const LLM_TEMPERATURE = parseFloat(process.env.LLM_TEMPERATURE);

// ---------------------------
// -- Import the OpenAI API --
// ---------------------------
import OpenAI from 'openai';


// ---------------------------------------------------
// -- Function to fetch the completion from the LLM --
// ---------------------------------------------------
export async function fetchChatCompletion(prompt, baseUrl, apiKey, llmModel, stopTokens, llmMaxGenLength) {
    const openai = new OpenAI({
        baseURL: baseUrl,
        apiKey: apiKey,
    });

    if (typeof prompt === 'string') {
        prompt = JSON.parse(prompt);
    }

    let stop = stopTokens;
    if (typeof stop === 'string') {
        stop = JSON.parse(stop);
    }

    const chatCompletion = await openai.chat.completions.create({
        messages: prompt,
        model: llmModel,
        max_tokens: llmMaxGenLength,
        stop: stop,
        temperature: LLM_TEMPERATURE,
        top_p: 0.7,
        stream: false,
    })

    let chatCompletionResponse;
    if (typeof chatCompletion === 'string') {
        chatCompletionResponse = JSON.parse(chatCompletion).choices[0]?.message?.content;
    } else {
        chatCompletionResponse = chatCompletion.choices[0]?.message?.content;
    }

    return chatCompletionResponse;
}
