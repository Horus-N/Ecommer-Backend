import { PrismaService } from '@/prisma/prisma.service';
import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}
  @Get('check')
  async check() {
    await this.prisma.$queryRaw`SELECT 1`;

    return {
      status: 'ok',
      database: 'Connected',
      timestamp: new Date().toISOString(),
    };
  }
}
