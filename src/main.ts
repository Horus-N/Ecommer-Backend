import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Đặt prefix cho toàn bộ API (Ví dụ: http://localhost:3000/api/v1/...)
  app.setGlobalPrefix('api');
  // Kích hoạt tính năng shutdown hooks để Prisma đóng kết nối an toàn khi tắt server
  app.enableShutdownHooks();
  const reflector = app.get(Reflector);

  // Kích hoạt Transform Response trên toàn hệ thống
  app.useGlobalInterceptors(new TransformInterceptor(reflector));
  // Kích hoạt Exception Filter bắt lỗi tập trung trên toàn hệ thống
  app.useGlobalFilters(new AllExceptionsFilter());
  await app.listen(process.env.PORT ?? 3000);
  console.log(`Application is running on: ${process.env.PORT ?? 3000}`);
}
bootstrap();
