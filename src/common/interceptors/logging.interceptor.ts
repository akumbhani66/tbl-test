import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const now = Date.now();
    const request = context.switchToHttp().getRequest();
    const { method, url, body, query, params } = request;

    // Log request details
    this.logger.log({
      type: 'Request',
      method,
      url,
      body: this.sanitizeData(body),
      query: this.sanitizeData(query),
      params: this.sanitizeData(params),
      timestamp: new Date().toISOString(),
    });

    return next.handle().pipe(
      tap((response) => {
        const responseTime = Date.now() - now;

        // Log response details
        this.logger.log({
          type: 'Response',
          method,
          url,
          responseTime: `${responseTime}ms`,
          statusCode: response?.statusCode,
          timestamp: new Date().toISOString(),
        });
      }),
    );
  }

  private sanitizeData(data: any): any {
    if (!data) return undefined;

    // Create a copy to avoid modifying the original data
    const sanitized = { ...data };

    // Remove sensitive fields if they exist
    const sensitiveFields = ['password', 'token', 'apiKey', 'secret'];
    sensitiveFields.forEach((field) => {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    });

    return sanitized;
  }
}
