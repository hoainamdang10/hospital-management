import rateLimit from 'express-rate-limit';

export function rateLimitMiddleware(options: any) {
  return rateLimit(options);
}



