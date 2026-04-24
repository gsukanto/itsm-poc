import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import type { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly log = new Logger(HttpExceptionFilter.name);
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest();
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: unknown = 'Internal server error';
    let title = 'Internal Server Error';
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const r = exception.getResponse() as any;
      message = typeof r === 'string' ? r : r?.message ?? r;
      title = typeof r === 'string' ? exception.name : r?.error ?? exception.name;
    } else if (exception instanceof Error) {
      this.log.error(exception.stack ?? exception.message);
      message = exception.message;
    }
    res.status(status).type('application/problem+json').json({
      type: 'about:blank',
      title,
      status,
      detail: message,
      instance: req.originalUrl,
      timestamp: new Date().toISOString(),
    });
  }
}
