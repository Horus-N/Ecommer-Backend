import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
export interface Response<T> {
  statusCode: number;
  success: boolean;
  message: string;
  data: T;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  Response<T>
> {
  constructor(private reflector: Reflector) {}
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    // check nếu nó là file dạng streaming, file ảnh, để download
    const skip = this.reflector.getAllAndOverride('skip-transform', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skip) {
      return next.handle();
    }

    const ctx = context.switchToHttp();

    const response = ctx.getResponse();
    const statusCode = response.statusCode;

    console.log('====================================');
    console.log('response: ', response.statuscode);
    console.log('====================================');

    console.log('====================================');
    console.log('statusCode: ', statusCode);
    console.log('====================================');
    return next.handle().pipe(
      map((data) => ({
        statusCode: response.statusCode,
        success: true,
        message: data?.message || 'Success',
        // Nếu trong data trả về từ Service có chứa key 'message' và 'data' lồng nhau, ta bóc tách thông minh
        data: data?.data !== undefined ? data.data : data,
      })),
    );
  }
}
