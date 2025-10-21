import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';

interface TopicAllowlist {
  version: string;
  allowlist: {
    [serviceName: string]: {
      description: string;
      topics: string[];
      wildcards: string[];
    };
  };
}

let allowlist: TopicAllowlist | null = null;

// For testing: reset cache
export function resetAllowlistCache(): void {
  allowlist = null;
}

function loadAllowlist(): TopicAllowlist {
  if (allowlist) {
    return allowlist;
  }

  try {
    const allowlistPath = path.join(__dirname, '../../../config/topic-allowlist.json');
    const content = fs.readFileSync(allowlistPath, 'utf-8');
    allowlist = JSON.parse(content);
    console.log('✅ Topic allowlist loaded:', allowlist?.version);
    return allowlist!;
  } catch (error) {
    console.error('❌ Failed to load topic allowlist:', error);
    throw new Error('Topic allowlist configuration error');
  }
}

function matchesPattern(topic: string, pattern: string): boolean {
  // Convert wildcard pattern to regex
  // Example: "appointments.*.reminder.*" -> "^appointments\\..*\\.reminder\\..*$"
  const regexPattern = pattern
    .replace(/\./g, '\\.')  // Escape dots
    .replace(/\*/g, '.*');  // Replace * with .*
  
  const regex = new RegExp(`^${regexPattern}$`);
  return regex.test(topic);
}

function isTopicAllowed(ownerService: string, topic: string): boolean {
  const config = loadAllowlist();

  // Check if service exists in allowlist
  if (!config.allowlist[ownerService]) {
    return false;
  }

  const serviceConfig = config.allowlist[ownerService];

  // Check exact match in topics
  if (serviceConfig.topics.includes(topic)) {
    return true;
  }

  // Check wildcard patterns
  return serviceConfig.wildcards.some(pattern => matchesPattern(topic, pattern));
}

export function topicAllowlistMiddleware(req: Request, res: Response, next: NextFunction): void {
  try {
    // Only validate for createOrUpdateByDedup endpoint
    if (!req.body.ownerService || !req.body.topicOrCommand) {
      next();
      return;
    }
    
    const { ownerService, topicOrCommand } = req.body;
    
    if (!isTopicAllowed(ownerService, topicOrCommand)) {
      res.status(403).json({
        success: false,
        error: `Topic '${topicOrCommand}' is not allowed for service '${ownerService}'. Check topic allowlist configuration.`
      });
      return;
    }
    
    next();
  } catch (error) {
    console.error('❌ Topic allowlist middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Topic validation error'
    });
  }
}

