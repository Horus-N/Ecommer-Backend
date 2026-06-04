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
    const skip = this.reflector.getAllAndOverride('skip-transform', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skip) {
      return next.handle();
    }

    const ctx = context.switchToHttp();
    const response = ctx.getResponse();
    const statusCode = response.statuscode;
    return next.handle().pipe(
      map((data) => ({
        statusCode,
        message: data?.message || 'Success',
        // Nếu trong data trả về từ Service có chứa key 'message' và 'data' lồng nhau, ta bóc tách thông minh
        data: data?.data !== undefined ? data.data : data,
      })),
    );
  }
}
