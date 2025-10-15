// ===============================
// == LLM Distillery Playground ==
// == Frontend JavaScript        ==
// ===============================

// DOM Elements
const elements = {
    inputText: document.getElementById('inputText'),
    fileUpload: document.getElementById('fileUpload'),
    fileName: document.getElementById('fileName'),
    distillBtn: document.getElementById('distillBtn'),
    exportBtn: document.getElementById('exportBtn'),
    resultsSection: document.getElementById('resultsSection'),
    statusMessage: document.getElementById('statusMessage'),
    exportModal: document.getElementById('exportModal'),
    closeModal: document.getElementById('closeModal'),
    advancedToggle: document.getElementById('advancedToggle'),
    advancedContent: document.getElementById('advancedContent'),

    // Form inputs
    targetTokenSize: document.getElementById('targetTokenSize'),
    baseUrl: document.getElementById('baseUrl'),
    apiKey: document.getElementById('apiKey'),
    llmModel: document.getElementById('llmModel'),
    stopTokens: document.getElementById('stopTokens'),
    maxDistillationLoops: document.getElementById('maxDistillationLoops'),
    tokenizerModel: document.getElementById('tokenizerModel'),
    semanticEmbeddingModel: document.getElementById('semanticEmbeddingModel'),
    semanticEmbeddingModelQuantized: document.getElementById('semanticEmbeddingModelQuantized'),
    modelCacheDir: document.getElementById('modelCacheDir'),
    useChunkingThreshold: document.getElementById('useChunkingThreshold'),
    chunkingThreshold: document.getElementById('chunkingThreshold'),
    llmContextLength: document.getElementById('llmContextLength'),
    llmMaxGenLength: document.getElementById('llmMaxGenLength'),
    llmApiRateLimit: document.getElementById('llmApiRateLimit'),
    logging: document.getElementById('logging'),

    // Results
    originalTokens: document.getElementById('originalTokens'),
    distilledTokens: document.getElementById('distilledTokens'),
    compressionPercent: document.getElementById('compressionPercent'),
    processingTime: document.getElementById('processingTime'),
    distilledText: document.getElementById('distilledText'),
    copyResultBtn: document.getElementById('copyResultBtn'),

    // Export modal
    exportCode: document.getElementById('exportCode'),
    exportParams: document.getElementById('exportParams')
};

// State
let currentResult = null;

// ==================
// == File Upload  ==
// ==================
elements.fileUpload.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
        const text = await file.text();
        elements.inputText.value = text;
        elements.fileName.textContent = file.name;
        showStatus('File loaded successfully', 'success');
    }
});

// =======================
// == Advanced Toggle   ==
// =======================
elements.advancedToggle.addEventListener('click', () => {
    const icon = elements.advancedToggle.querySelector('.toggle-icon');
    elements.advancedContent.classList.toggle('open');
    icon.classList.toggle('open');
});

// ===================
// == Distill Text  ==
// ===================
elements.distillBtn.addEventListener('click', async () => {
    const text = elements.inputText.value.trim();

    if (!text) {
        showStatus('Please enter text to distill', 'error');
        return;
    }

    if (!elements.apiKey.value.trim()) {
        showStatus('Please enter your API key', 'error');
        return;
    }

    // Get configuration
    const config = getConfiguration();

    // Validate stop tokens JSON
    try {
        if (config.stopTokens) {
            JSON.parse(config.stopTokens);
        }
    } catch (e) {
        showStatus('Invalid JSON format for stop tokens', 'error');
        return;
    }

    // Disable button and show loading
    elements.distillBtn.disabled = true;
    elements.distillBtn.textContent = '⏳ Distilling...';
    showStatus('Processing your text... This may take a while.', 'info');

    // Show results section with loading state
    showLoadingState();

    try {
        const response = await fetch('/distill', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                text,
                ...config
            })
        });

        const result = await response.json();

        if (result.success) {
            currentResult = result;
            displayResults(text, result);
            showStatus('Distillation completed successfully!', 'success');
        } else {
            showStatus(`Error: ${result.error}`, 'error');
            hideResultsSection();
        }

    } catch (error) {
        console.error('Distillation error:', error);
        showStatus(`Network error: ${error.message}`, 'error');
        hideResultsSection();
    } finally {
        elements.distillBtn.disabled = false;
        elements.distillBtn.textContent = '🍶 Distill Text';
    }
});

// ===================
// == Get Config    ==
// ===================
function getConfiguration() {
    const config = {
        targetTokenSize: parseInt(elements.targetTokenSize.value),
        baseUrl: elements.baseUrl.value.trim(),
        apiKey: elements.apiKey.value.trim(),
        llmModel: elements.llmModel.value.trim(),
        stopTokens: elements.stopTokens.value.trim(),
        maxDistillationLoops: parseInt(elements.maxDistillationLoops.value),
        tokenizerModel: elements.tokenizerModel.value,
        semanticEmbeddingModel: elements.semanticEmbeddingModel.value.trim(),
        semanticEmbeddingModelQuantized: elements.semanticEmbeddingModelQuantized.checked,
        useChunkingThreshold: elements.useChunkingThreshold.checked,
        chunkingThreshold: parseFloat(elements.chunkingThreshold.value),
        llmContextLength: parseInt(elements.llmContextLength.value),
        llmMaxGenLength: parseInt(elements.llmMaxGenLength.value),
        llmApiRateLimit: parseInt(elements.llmApiRateLimit.value),
        logging: elements.logging.checked
    };

    // Only include modelCacheDir if it's not empty
    if (elements.modelCacheDir.value.trim()) {
        config.modelCacheDir = elements.modelCacheDir.value.trim();
    }

    return config;
}

// ====================
// == Loading State   ==
// ====================
function showLoadingState() {
    elements.resultsSection.style.display = 'block';

    // Show loading spinner in all stat values
    elements.originalTokens.innerHTML = '<div class="spinner"></div>';
    elements.distilledTokens.innerHTML = '<div class="spinner"></div>';
    elements.compressionPercent.innerHTML = '<div class="spinner"></div>';
    elements.processingTime.innerHTML = '<div class="spinner"></div>';

    // Show loading message in distilled text area
    elements.distilledText.innerHTML = `
        <div class="loading-container">
            <div class="spinner-large"></div>
            <p class="loading-text">Processing your text...</p>
            <p class="loading-subtext">This may take a while depending on the size and complexity of your input.</p>
        </div>
    `;

    // Scroll to results section
    elements.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ====================
// == Hide Results   ==
// ====================
function hideResultsSection() {
    elements.resultsSection.style.display = 'none';
}

// ====================
// == Display Results ==
// ====================
function displayResults(originalText, result) {
    // Calculate token counts (rough estimation)
    const originalTokenCount = estimateTokenCount(originalText);
    const distilledTokenCount = estimateTokenCount(result.distilledText);
    const compressionPercent = ((1 - distilledTokenCount / originalTokenCount) * 100).toFixed(1);

    elements.originalTokens.textContent = originalTokenCount.toLocaleString();
    elements.distilledTokens.textContent = distilledTokenCount.toLocaleString();
    elements.compressionPercent.textContent = `${compressionPercent}%`;
    elements.processingTime.textContent = `${result.processingTime.toFixed(2)}s`;
    elements.distilledText.textContent = result.distilledText;

    // Results section is already visible from loading state
    // Just ensure it's still in view
    elements.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Rough token estimation (1 token ≈ 4 characters)
function estimateTokenCount(text) {
    return Math.ceil(text.length / 4);
}

// ===================
// == Copy Result   ==
// ===================
elements.copyResultBtn.addEventListener('click', () => {
    if (currentResult) {
        navigator.clipboard.writeText(currentResult.distilledText);
        const originalText = elements.copyResultBtn.textContent;
        elements.copyResultBtn.textContent = '✓ Copied!';
        setTimeout(() => {
            elements.copyResultBtn.textContent = originalText;
        }, 2000);
    }
});

// ====================
// == Export Modal   ==
// ====================
elements.exportBtn.addEventListener('click', () => {
    const config = getConfiguration();
    generateExportCode(config);
    generateParamsList(config);
    elements.exportModal.classList.add('show');
});

elements.closeModal.addEventListener('click', () => {
    elements.exportModal.classList.remove('show');
});

// Close modal on outside click
elements.exportModal.addEventListener('click', (e) => {
    if (e.target === elements.exportModal) {
        elements.exportModal.classList.remove('show');
    }
});

// Generate export code
function generateExportCode(config) {
    // Parse stop tokens if they're a string
    let stopTokensValue = config.stopTokens;
    try {
        const parsed = JSON.parse(config.stopTokens);
        stopTokensValue = JSON.stringify(parsed);
    } catch (e) {
        stopTokensValue = '[]';
    }

    const code = `import { llmDistillery } from 'llm-distillery';
import fs from 'fs';

const text = await fs.promises.readFile('./your-text-file.txt', 'utf8');

const options = {
    targetTokenSize: ${config.targetTokenSize},
    baseUrl: "${config.baseUrl}",
    apiKey: process.env.API_KEY, // Store your API key in environment variables
    llmModel: "${config.llmModel}",
    stopTokens: ${stopTokensValue},
    maxDistillationLoops: ${config.maxDistillationLoops},
    tokenizerModel: "${config.tokenizerModel}",
    semanticEmbeddingModel: "${config.semanticEmbeddingModel}",
    semanticEmbeddingModelQuantized: ${config.semanticEmbeddingModelQuantized},${config.modelCacheDir ? `\n    modelCacheDir: "${config.modelCacheDir}",` : ''}
    useChunkingThreshold: ${config.useChunkingThreshold},
    chunkingThreshold: ${config.chunkingThreshold},
    llmContextLength: ${config.llmContextLength},
    llmMaxGenLength: ${config.llmMaxGenLength},
    llmApiRateLimit: ${config.llmApiRateLimit},
    logging: ${config.logging}
};

const distilledText = await llmDistillery(text, options);
console.log('Distilled text:', distilledText);`;

    elements.exportCode.textContent = code;
}

// Generate parameters list
function generateParamsList(config) {
    elements.exportParams.innerHTML = '';

    // Convert config to readable format
    const params = {
        'Target Token Size': config.targetTokenSize,
        'Base URL': config.baseUrl,
        'API Key': '***hidden***',
        'LLM Model': config.llmModel,
        'Stop Tokens': config.stopTokens,
        'Max Distillation Loops': config.maxDistillationLoops,
        'Tokenizer Model': config.tokenizerModel,
        'Semantic Embedding Model': config.semanticEmbeddingModel,
        'Semantic Embedding Model Quantized': config.semanticEmbeddingModelQuantized,
        'Model Cache Directory': config.modelCacheDir || 'default',
        'Use Chunking Threshold': config.useChunkingThreshold,
        'Chunking Threshold': config.chunkingThreshold,
        'LLM Context Length': config.llmContextLength,
        'LLM Max Generation Length': config.llmMaxGenLength,
        'API Rate Limit': config.llmApiRateLimit + 'ms',
        'Logging': config.logging
    };

    for (const [name, value] of Object.entries(params)) {
        const item = document.createElement('div');
        item.className = 'param-item';
        item.innerHTML = `
            <span class="param-name">${name}:</span>
            <span class="param-value">${value}</span>
        `;
        elements.exportParams.appendChild(item);
    }
}

// Copy buttons in export modal
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('copy-btn')) {
        const copyType = e.target.getAttribute('data-copy');
        let textToCopy = '';

        if (copyType === 'install') {
            textToCopy = 'npm install llm-distillery';
        } else if (copyType === 'code') {
            textToCopy = elements.exportCode.textContent;
        }

        navigator.clipboard.writeText(textToCopy);
        const originalText = e.target.textContent;
        e.target.textContent = '✓ Copied!';
        setTimeout(() => {
            e.target.textContent = originalText;
        }, 2000);
    }
});

// ====================
// == Status Message ==
// ====================
function showStatus(message, type = 'info') {
    elements.statusMessage.textContent = message;
    elements.statusMessage.className = `status-message show ${type}`;

    // Auto-hide after 5 seconds for non-error messages
    if (type !== 'error') {
        setTimeout(() => {
            elements.statusMessage.classList.remove('show');
        }, 5000);
    }
}

// ====================
// == Initialization ==
// ====================
async function initialize() {
    // Load environment config if available
    try {
        const response = await fetch('/config');
        if (response.ok) {
            const config = await response.json();
            if (config.baseUrl) {
                elements.baseUrl.value = config.baseUrl;
            }
            if (config.apiKey) {
                elements.apiKey.value = config.apiKey;
            }
        }
    } catch (error) {
        console.warn('Could not load environment config:', error);
    }
}

// Initialize on page load
initialize();
console.log('🍶 LLM Distillery Playground initialized');
