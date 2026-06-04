import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch() // Để trống nghĩa là bắt TẤT CẢ mọi loại exception (Kể cả lỗi code crash, lỗi DB)
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Phân loại: Nếu là lỗi do ta tự chủ động ném ra (HttpException), lấy status đó.
    // Nếu là lỗi hệ thống không xác định (Crash, lỗi DB), mặc định là 500 Internal Server Error.
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : null;

    // Chuẩn hóa Message lỗi
    let message = 'Internal server error';
    if (exception instanceof HttpException) {
      message =
        typeof exceptionResponse === 'object'
          ? (exceptionResponse as any).message || exception.message
          : exception.message;
    } else if (exception instanceof Error) {
      message = exception.message; // Lỗi từ code hoặc thư viện khác
    }

    // Tiến hành Log lỗi ra Terminal chuẩn Production để theo dõi (Monitor)
    this.logger.error(
      `URL: ${request.url} | Method: ${request.method} | Status: ${status} | Error: ${message}`,
      exception instanceof Error ? exception.stack : '',
    );

    // Trả về response lỗi chuẩn hóa cho Client
    response.status(status).json({
      statusCode: status,
      message: Array.isArray(message) ? message[0] : message, // Tiện cho validation pipe sau này
      error:
        exception instanceof HttpException
          ? (exceptionResponse as any).error || 'Error'
          : 'Internal Server Error',
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
