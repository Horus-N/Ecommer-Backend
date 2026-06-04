import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { UserModule } from '@/modules/user/user.module';

@Module({
  imports: [UserModule],
  controllers: [HealthController],
})
export class HealthModule {}
