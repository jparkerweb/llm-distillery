# LLM Distillery Examples

This folder contains example implementations showing how to use the llm-distillery library.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create your environment variables file:
   ```bash
   cp .env.example .env
   ```

3. Edit `.env` with your actual API credentials:
   ```
   BASE_URL=https://api.together.xyz/v1
   API_KEY=your_actual_api_key_here
   ```

## Running Examples

### Example 1 (Semantic Chunking)
Uses semantic similarity for chunking text:
```bash
npm run example1
```

### Example 2 (Token-based Chunking)
Uses simple token count for chunking (faster but less accurate):
```bash
npm run example2
```

### Web Playground
Interactive web UI for testing and configuring parameters:
```bash
node server.js
```
Then visit http://localhost:3000/

The playground provides:
- Visual interface for all llm-distillery parameters
- Live distillation testing with results display
- Configuration export with code samples
- Dark mode professional UI

Perfect for experimenting with different settings before integrating into your application.

## Environment Variables

- `BASE_URL`: Your OpenAI-compatible API endpoint
- `API_KEY`: Your API key for the LLM service

Both variables are required for the examples to work properly.