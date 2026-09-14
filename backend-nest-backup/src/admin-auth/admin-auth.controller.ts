import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';

import { AdminAuthGuard } from './admin-auth.guard';
import { AdminAuthService } from './admin-auth.service';
import {
  AdminLoginDto,
  AdminSession,
  CreatePortalUserDto,
} from './admin-auth.types';
import { Roles } from './roles.decorator';
import { RolesGuard } from './roles.guard';

@Controller('admin/auth')
export class AdminAuthController {
  constructor(private readonly adminAuthService: AdminAuthService) {}

  @Post('login')
  login(@Body() dto: AdminLoginDto) {
    return this.adminAuthService.login(dto);
  }

  @Get('me')
  @UseGuards(AdminAuthGuard)
  me(@Req() req: { adminUser: AdminSession }) {
    return req.adminUser;
  }
}

@Controller('admin/users')
@UseGuards(AdminAuthGuard, RolesGuard)
export class PortalUsersController {
  constructor(private readonly adminAuthService: AdminAuthService) {}

  @Get()
  @Roles('superadmin')
  list() {
    return this.adminAuthService.listPortalUsers();
  }

  @Post()
  @Roles('superadmin')
  create(@Body() dto: CreatePortalUserDto) {
    return this.adminAuthService.createPortalUser(dto);
  }
}
