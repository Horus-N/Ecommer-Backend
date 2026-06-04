import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Đặt prefix cho toàn bộ API (Ví dụ: http://localhost:3000/api/v1/...)
  app.setGlobalPrefix('api');
  // Kích hoạt tính năng shutdown hooks để Prisma đóng kết nối an toàn khi tắt server
  app.enableShutdownHooks();
  await app.listen(process.env.PORT ?? 3000);
  console.log(`Application is running on: ${process.env.PORT ?? 3000}`);
}
bootstrap();
