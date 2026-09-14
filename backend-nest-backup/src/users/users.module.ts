import { Module } from '@nestjs/common';

import { AdminAuthModule } from '../admin-auth/admin-auth.module';
import { HealthController, UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [AdminAuthModule],
  controllers: [UsersController, HealthController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
