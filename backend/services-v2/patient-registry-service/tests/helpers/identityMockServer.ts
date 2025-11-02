import express from 'express';
import { Server } from 'http';
import { AddressInfo } from 'net';

export interface IdentityTokenPayload {
  userId: string;
  email: string;
  roles: string[];
  permissions: string[];
}

const tokenRegistry = new Map<string, IdentityTokenPayload>();
let server: Server | null = null;
let baseUrl: string | null = null;
let referenceCount = 0;

export function registerIdentityToken(token: string, payload: IdentityTokenPayload): void {
  tokenRegistry.set(token, payload);
}

export async function ensureIdentityMockServer(): Promise<{ url: string; release: () => Promise<void> }> {
  if (server && baseUrl) {
    referenceCount++;
    return {
      url: baseUrl,
      release: async () => {
        referenceCount = Math.max(referenceCount - 1, 0);
        if (referenceCount === 0 && server) {
          await new Promise<void>(resolve => server!.close(() => resolve()));
          server = null;
          baseUrl = null;
          tokenRegistry.clear();
        }
      }
    };
  }

  const app = express();

  app.get('/auth/verify', (req, res) => {
    const authHeader = req.header('authorization') || req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Missing bearer token'
      });
    }

    const token = authHeader.substring(7);
    const payload = tokenRegistry.get(token);

    if (!payload) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Invalid token'
      });
    }

    return res.json({
      success: true,
      data: {
        userId: payload.userId,
        email: payload.email,
        roles: payload.roles,
        permissions: payload.permissions,
        sessionId: `mock-session-${payload.userId}`
      }
    });
  });

  server = await new Promise<Server>(resolve => {
    const instance = app.listen(0, () => resolve(instance));
  });

  const addressInfo = server.address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${addressInfo.port}`;
  referenceCount = 1;

  return {
    url: baseUrl,
    release: async () => {
      referenceCount = Math.max(referenceCount - 1, 0);
      if (referenceCount === 0 && server) {
        await new Promise<void>(resolve => server!.close(() => resolve()));
        server = null;
        baseUrl = null;
        tokenRegistry.clear();
      }
    }
  };
}
