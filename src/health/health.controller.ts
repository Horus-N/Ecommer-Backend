import { UserService } from '@/modules/user/user.service';
import { PrismaService } from '@/prisma/prisma.service';
import { Body, Controller, Get, Post } from '@nestjs/common';

@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private userService: UserService,
  ) {}
  @Get('check')
  async check() {
    await this.prisma.$queryRaw`SELECT 1`;

    return {
      status: 'ok',
      database: 'Connected',
      timestamp: new Date().toISOString(),
    };
  }
  @Post('register')
  async register(@Body() data: any) {
    return this.userService.createUser(data);
  }
}
