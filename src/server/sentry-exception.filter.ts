import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import * as Sentry from '@sentry/node';

@Catch()
export class SentryExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    console.log(exception);
    // Capture exception in Sentry
    Sentry.captureException(exception);

    // Determine the HTTP status code (if available)
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // Send a standard error response
    response.status(status).json({
      statusCode: status,
      message: (exception as Error).message || 'Internal server error',
    });
  }
}
