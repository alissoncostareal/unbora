import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';

import { AdminAuthGuard } from '../admin-auth/admin-auth.guard';
import { Roles } from '../admin-auth/roles.decorator';
import { RolesGuard } from '../admin-auth/roles.guard';
import { GoogleLoginDto, LoginUserDto, RegisterMerchantDto, RegisterUserDto, SyncUserDto } from './users.types';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @UseGuards(AdminAuthGuard, RolesGuard)
  @Roles('superadmin', 'admin', 'consultor')
  list() {
    return this.usersService.list();
  }

  @Get('stats')
  @UseGuards(AdminAuthGuard, RolesGuard)
  @Roles('superadmin', 'admin', 'consultor')
  stats() {
    return this.usersService.stats();
  }

  @Get(':id')
  @UseGuards(AdminAuthGuard, RolesGuard)
  @Roles('superadmin', 'admin', 'consultor')
  findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Post('register')
  register(@Body() dto: RegisterUserDto) {
    return this.usersService.register(dto);
  }

  @Post('register-merchant')
  registerMerchant(@Body() dto: RegisterMerchantDto) {
    return this.usersService.registerMerchant(dto);
  }

  @Post('login')
  login(@Body() dto: LoginUserDto) {
    return this.usersService.login(dto);
  }

  @Post('google-login')
  googleLogin(@Body() dto: GoogleLoginDto) {
    return this.usersService.googleLogin(dto);
  }

  @Post('sync')
  sync(@Body() dto: SyncUserDto) {
    return this.usersService.sync(dto);
  }
}

@Controller()
export class HealthController {
  @Get()
  root() {
    return {
      status: 'ok',
      service: 'unbora-backend',
      message: 'API Unbora rodando',
      endpoints: {
        health: '/health',
        recommend: 'POST /api/recomendar',
        users: '/users',
        usersStats: '/users/stats',
        carousels: '/carousels',
        notifications: '/notifications',
        locations: '/locations',
        adminLogin: 'POST /admin/auth/login',
      },
    };
  }

  @Get('health')
  health() {
    return { status: 'ok', service: 'unbora-backend' };
  }
}
