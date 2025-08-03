#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ZephixServer } from './ZephixServer.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

// Validate required environment variables
const required = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
for (const key of required) {
  if (!process.env[key]) {
    console.error(`Error: Missing required environment variable: ${key}`);
    console.error('Please copy .env.example to .env and fill in your credentials');
    process.exit(1);
  }
}

async function main() {
  const server = new Server(
    {
      name: 'zephix-mcp',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Initialize Zephix server with MCP server instance
  const zephixServer = new ZephixServer(server);
  await zephixServer.initialize();

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('Zephix MCP Server started successfully');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});