import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { CustomLogger } from '../logger/custom-logger.service';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger: CustomLogger;

  constructor() {
    this.logger = new CustomLogger();
    this.logger.setContext('AllExceptionsFilter');
  }

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors: any = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object') {
        message = (exceptionResponse as any).message || message;
        errors = (exceptionResponse as any).errors;
      } else {
        message = exceptionResponse as string;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      ...(errors && { errors }),
    };

    // Log error with correlation ID and full context
    this.logger.logWithMeta('error', 'Exception caught', {
      correlationId: request.correlationId,
      statusCode: status,
      path: request.url,
      method: request.method,
      message,
      errors,
      stack: exception instanceof Error ? exception.stack : undefined,
      ip: request.ip,
      userAgent: request.get('user-agent'),
    });

    response.status(status).json(errorResponse);
  }
}
