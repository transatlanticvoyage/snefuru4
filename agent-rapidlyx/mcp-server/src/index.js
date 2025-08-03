#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { RapidlyxAgent } from './RapidlyxAgent.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import winston from 'winston';

// Load environment variables
dotenv.config();

// Setup logging
const logger = winston.createLogger({
  level: process.env.RAPIDLYX_LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.colorize(),
    winston.format.simple()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'agent-rapidlyx.log' })
  ]
});

async function main() {
  try {
    // Create MCP server
    const server = new Server(
      {
        name: 'rapidlyx-agent',
        version: '1.0.0',
        description: 'Rapidlyx AI Agent for Snefuru development workflows'
      },
      {
        capabilities: {
          tools: true,
          resources: true,
          logging: true
        }
      }
    );

    // Initialize Rapidlyx Agent
    const rapidlyxAgent = new RapidlyxAgent(server, logger);
    await rapidlyxAgent.initialize();

    // Connect via stdio
    const transport = new StdioServerTransport();
    await server.connect(transport);

    logger.info('🚀 Rapidlyx Agent started successfully');
    logger.info('📡 MCP Server connected via stdio transport');
    
  } catch (error) {
    logger.error('❌ Failed to start Rapidlyx Agent:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  logger.info('👋 Rapidlyx Agent shutting down...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('👋 Rapidlyx Agent terminated');
  process.exit(0);
});

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});