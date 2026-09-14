import { Module } from '@nestjs/common';

import { AdminAuthModule } from '../admin-auth/admin-auth.module';
import { CarouselsController } from './carousels.controller';
import { CarouselsService } from './carousels.service';

@Module({
  imports: [AdminAuthModule],
  controllers: [CarouselsController],
  providers: [CarouselsService],
  exports: [CarouselsService],
})
export class CarouselsModule {}
