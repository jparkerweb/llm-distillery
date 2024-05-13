# 🍶 LLM Distillery
Use LLMs to distill large texts down to a manageable size by utilizing a map-reduce approach. This ensures that the text fits within a specified token limit, which is crucial when interfacing with Large Language Models (LLMs) in downstreams tasks.

---

## Features

- **Text Distillation**: Reduces the size of text based on token count without losing the essence of the content.
- **Chunking and Summarization**: Uses the `semantic-chunking` library to intelligently split text into manageable chunks that are then summarized.
- **Customizable Parameters**: Allows fine-tuning of various parameters like target token size, API base URL, and chunking thresholds.

## Getting Started

### Prerequisites

- Node.js installed on your system.
- An API key for running inference of OpenAI API compatible LLM models (together.ai, etc.).

### Installation

Add this lib to your code page via npm install

```bash
npm install llm-distillery
```

---

## Basic Usage

The `llmDistillery` function can be imported and used in your Node.js applications as follows:

```javascript
import { llmDistillery } from 'llm-distillery';

const text = "Your long text here...";
const options = {
    targetTokenSize: 2048,                          // adjust as needed
    baseUrl: "<openai-api-compatible-url-endpoint>" // example: https://api.together.xyz/v1
    apiKey: "<your_llm_api_key>",
    llmModel: "<llm_model>",                        // example: meta-llama/Llama-3-70b-chat-hf (Llama 3 model name on together.ai)
    stopTokens: ["<|eot_id|>"],                     // stop tokens for Llama 3
    logging: true                                   // set to true for verbose logging
};

llmDistillery(text, options)
    .then(processedText => console.log(processedText))
    .catch(error => console.error(error));
```

### Options Object Parameters
- `targetTokenSize`: Desired token size limit for distilled text. (default: `2048`)
- `baseUrl`: The base URL for the OpenAI API compatible endpoint. (default: `"https://api.together.xyz/v1"`)
- `apiKey`: Your API key for accessing LLM endpoint.
- `llmModel`: The model identifier of the LLM for your chosen endpoint. (default: `"meta-llama/Llama-3-70b-chat-hf"` on together.ai)
- `stopTokens`: Array representing stopping tokens for LLM responses based on your chosen model. (default `["<|eot_id|>"]`)
- `maxDistillationLoops`: Maximum number of iterations while running distillation (default: `5`)
- `tokenizerModel`: Tokenizer model used to calculate token sizes. (See table below for options; default `"Xenova/paraphrase-multilingual-MiniLM-L12-v2"`)
- `chunkingThreshold`: Threshold for segmenting text into chunks for summarization and distillation. Can be a number between 0 and 1. A lower number will result in greater distillation for each iteration, and will be faster. (default `.25`)
- `llmMaxGenLength`: Maximum generation length for the large language model (LLM) you are using. It denotes the maximum number of tokens the LLM can generate in a single response. (default `2048`),
- `llmApiRateLimit`: Delay in milliseconds between API calls to your chosen LLM provider. This helps to manage the rate at which requests are sent, ensuring that your application does not overload the service or exceed usage policies. (default `500`; set to 0 to disable)
- `logging`: Enable logging to monitor the various stages of distillation, compression percentages of the original text, etc. (default `false`)

### Tokenizer Models

| model name                                   |
|----------------------------------------------|
| Xenova/all-MiniLM-L6-v2                      |
| Xenova/paraphrase-multilingual-MiniLM-L12-v2 |
| Xenova/bert-base-uncased                     |
| Xenova/gpt2                                  |
| Xenova/roberta-base                          |
| Xenova/all-distilroberta-v1                  |
| Xenova/multilingual-e5-large                 |
| Xenova/bert-base-multilingual-uncased        |
| Xenova/xlm-roberta-base                      |
| BAAI/bge-base-en-v1.5                        |
  
NOTE 🚨 The initial run of `llm-distillery` might take a moment as the Tokenizer Model will be downloaded and saved to this package's cache directory.
