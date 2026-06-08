import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Đặt prefix cho toàn bộ API (Ví dụ: http://localhost:3000/api/v1/...)
  app.setGlobalPrefix('api');
  // Kích hoạt tính năng shutdown hooks để Prisma đóng kết nối an toàn khi tắt server
  app.enableShutdownHooks();

  // Kích hoạt ValidationPipe toàn cục
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Tự động loại bỏ các thuộc tính không được định nghĩa trong DTO
      transform: true, // Tự động convert kiểu dữ liệu (Ví dụ: string số thành number)
      enableDebugMessages: true,
    }),
  );

  // Cấu hình Swagger UI Tài liệu API chuẩn công ty
  const config = new DocumentBuilder()
    .setTitle('E-Commerce Core API')
    .setDescription(
      'Tài liệu API hệ thống Backend E-Commerce Core - Tech Lead Tùng',
    )
    .setVersion('1.0')
    .addBearerAuth() // Kích hoạt nút bấm nhập Token JWT trên giao diện Swagger
    .build();
  const document = SwaggerModule.createDocument(app, config);

  if (process.env.NODE_ENV !== 'production') {
    SwaggerModule.setup('docs', app, document);
  }
  const reflector = app.get(Reflector);

  // Kích hoạt Transform Response trên toàn hệ thống
  app.useGlobalInterceptors(new TransformInterceptor(reflector));
  // Kích hoạt Exception Filter bắt lỗi tập trung trên toàn hệ thống
  app.useGlobalFilters(new AllExceptionsFilter());
  await app.listen(process.env.PORT ?? 3000);
  console.log(`Application is running on: ${process.env.PORT ?? 3000}`);
}
bootstrap();
