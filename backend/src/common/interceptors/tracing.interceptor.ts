import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CustomLogger } from '../logger/custom-logger.service';

@Injectable()
export class TracingInterceptor implements NestInterceptor {
  constructor(private readonly logger: CustomLogger) {
    this.logger.setContext('TracingInterceptor');
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, ip, correlationId } = request;
    const userAgent = request.get('user-agent') || '';
    const startTime = Date.now();

    // Log incoming request
    this.logger.logWithMeta('info', 'Incoming request', {
      correlationId,
      method,
      url,
      ip,
      userAgent,
    });

    return next.handle().pipe(
      tap({
        next: () => {
          const response = context.switchToHttp().getResponse();
          const { statusCode } = response;
          const duration = Date.now() - startTime;

          // Log successful response
          this.logger.logWithMeta('info', 'Request completed', {
            correlationId,
            method,
            url,
            statusCode,
            duration,
            ip,
          });
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          const statusCode = error.status || 500;

          // Log error response
          this.logger.logWithMeta('error', 'Request failed', {
            correlationId,
            method,
            url,
            statusCode,
            duration,
            ip,
            error: error.message,
            stack: error.stack,
          });
        },
      }),
    );
  }
}
