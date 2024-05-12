export const llmDistilleryVars = {
    LLM_TEMPERATURE: 0.1,
    DEFAULT_TOKENIZER_MODEL: "Xenova/paraphrase-multilingual-MiniLM-L12-v2",
    LLM_SYSTEM_PROMPT: `Please summarize the text snippet below. Your response should strictly follow this JSON format: {"summary": "your_summary_here"}. Do not include any additional text or explanation in your response. Here is an example for clarity:

Example input: "A big brown fox jumped over the lazy dog."
Correct output: {"summary": "A fox jumped over a dog."}

Now, summarize the following text snippet:\ntext_snippet:::\n`,
}
