import { Module } from '@nestjs/common';

import { AdminAuthController, PortalUsersController } from './admin-auth.controller';
import { AdminAuthGuard } from './admin-auth.guard';
import { AdminAuthService } from './admin-auth.service';
import { RolesGuard } from './roles.guard';

@Module({
  controllers: [AdminAuthController, PortalUsersController],
  providers: [AdminAuthService, AdminAuthGuard, RolesGuard],
  exports: [AdminAuthService, AdminAuthGuard, RolesGuard],
})
export class AdminAuthModule {}
