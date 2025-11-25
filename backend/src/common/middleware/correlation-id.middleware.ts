import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

// Extend Express Request type to include correlationId
declare global {
  namespace Express {
    interface Request {
      correlationId?: string;
    }
  }
}

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Check if correlation ID exists in headers, otherwise generate new one
    const correlationId = (req.headers['x-correlation-id'] as string) || uuidv4();
    
    // Attach to request object
    req.correlationId = correlationId;
    
    // Set in response headers
    res.setHeader('x-correlation-id', correlationId);
    
    next();
  }
}
