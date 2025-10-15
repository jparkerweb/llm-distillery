// ===============================
// == LLM Distillery Playground ==
// ===============================
// Simple web server for testing llm-distillery parameters
// Run with: node server.js
// Then visit: http://localhost:3000

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { llmDistillery } from '../llm-distillery.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '.env') });

const PORT = 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

// MIME types for static file serving
const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

// Serve static files
function serveStaticFile(filePath, res) {
    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 Not Found');
            return;
        }

        const ext = path.extname(filePath);
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
    });
}

// Parse JSON request body
function parseBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                resolve(JSON.parse(body));
            } catch (e) {
                reject(e);
            }
        });
    });
}

// Create HTTP server
const server = http.createServer(async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // API endpoint to get environment config
    if (req.url === '/config' && req.method === 'GET') {
        const config = {
            baseUrl: process.env.BASE_URL || '',
            apiKey: process.env.API_KEY || ''
        };

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(config));
        return;
    }

    // API endpoint for distillation
    if (req.url === '/distill' && req.method === 'POST') {
        try {
            const options = await parseBody(req);
            const { text, ...distilleryOptions } = options;

            if (!text) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Text is required' }));
                return;
            }

            console.log('Starting distillation...');
            const startTime = Date.now();

            const distilledText = await llmDistillery(text, distilleryOptions);

            const endTime = Date.now();
            console.log(`Distillation completed in ${(endTime - startTime) / 1000}s`);

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: true,
                distilledText,
                processingTime: (endTime - startTime) / 1000
            }));

        } catch (error) {
            console.error('Distillation error:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: false,
                error: error.message
            }));
        }
        return;
    }

    // Serve static files
    let filePath;
    if (req.url === '/' || req.url === '') {
        filePath = path.join(PUBLIC_DIR, 'index.html');
    } else {
        filePath = path.join(PUBLIC_DIR, req.url);
    }

    // Security: prevent directory traversal
    if (!filePath.startsWith(PUBLIC_DIR)) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('403 Forbidden');
        return;
    }

    serveStaticFile(filePath, res);
});

server.listen(PORT, () => {
    console.log('');
    console.log('🍶 LLM Distillery Playground');
    console.log('=============================');
    console.log(`Server running at http://localhost:${PORT}/`);
    console.log('');
});
