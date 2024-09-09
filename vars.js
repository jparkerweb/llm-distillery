export const llmDistilleryVars = {
    LLM_TEMPERATURE: 0.1, // temperature for the LLM (0.1 is a good default)
    DEFAULT_TOKENIZER_MODEL: "Xenova/paraphrase-multilingual-MiniLM-L12-v2", // default tokenizer model (see https://github.com/jparkerweb/llm-distillery?tab=readme-ov-file#tokenizer-models for options)

    DEFAULT_SEMANTIC_EMBEDDING_MODEL: "Xenova/paraphrase-multilingual-MiniLM-L12-v2", // default semantic embedding model (see https://github.com/jparkerweb/semantic-chunking?tab=readme-ov-file#curated-onnx-embedding-models for options)
    DEFAULT_SEMANTIC_EMBEDDING_MODEL_QUANTIZED: true, // whether to use the quantized version of the embedding model (default: true)
    DEFAULT_MODEL_CACHE_DIR: null, // set to null to use default cache dir, or set to a string for a custom cache dir (example: "models/")

    LLM_SYSTEM_PROMPT: `Please summarize the user submitted text snippet below. Ensure that all critical information and key facts are included in the summary. Your response should strictly follow this JSON format: {"summary": "your_summary_here"}. Do not include any additional text or explanation in your response. Here is an example for clarity:

Example input: "The mighty lion roared, its powerful voice echoing through the savannah. Zebras scattered in all directions, their stripes blurring as they fled."
Correct output: {"summary": "A lion's roar causes zebras to flee across the savannah."}
`,
    LLM_USER_PROMPT: `Now, summarize the following text snippet:\ntext_snippet:::\n`,
}
