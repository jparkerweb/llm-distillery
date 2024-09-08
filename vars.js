export const llmDistilleryVars = {
    LLM_TEMPERATURE: 0.1,
    DEFAULT_TOKENIZER_MODEL: "Xenova/paraphrase-multilingual-MiniLM-L12-v2",
    LLM_SYSTEM_PROMPT: `Please summarize the user submitted text snippet below. Ensure that all critical information and key facts are included in the summary. Your response should strictly follow this JSON format: {"summary": "your_summary_here"}. Do not include any additional text or explanation in your response. Here is an example for clarity:

Example input: "The mighty lion roared, its powerful voice echoing through the savannah. Zebras scattered in all directions, their stripes blurring as they fled."
Correct output: {"summary": "A lion's roar causes zebras to flee across the savannah."}
`,
    LLM_USER_PROMPT: `Now, summarize the following text snippet:\ntext_snippet:::\n`,
}
