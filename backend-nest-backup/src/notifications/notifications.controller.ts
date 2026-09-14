import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { AdminAuthGuard } from '../admin-auth/admin-auth.guard';
import { Roles } from '../admin-auth/roles.decorator';
import { RolesGuard } from '../admin-auth/roles.guard';
import { CreateNotificationDto, UpdateNotificationDto } from './notifications.types';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  list(
    @Query('active') active?: string,
    @Query('city') city?: string,
    @Query('region') region?: string,
  ) {
    const activeOnly = active === 'true' || active === '1';
    return this.notificationsService.list({ activeOnly, city, region });
  }

  @Post()
  @UseGuards(AdminAuthGuard, RolesGuard)
  @Roles('superadmin', 'admin')
  create(@Body() dto: CreateNotificationDto) {
    return this.notificationsService.create(dto);
  }

  @Patch(':id')
  @UseGuards(AdminAuthGuard, RolesGuard)
  @Roles('superadmin', 'admin')
  update(@Param('id') id: string, @Body() dto: UpdateNotificationDto) {
    return this.notificationsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(AdminAuthGuard, RolesGuard)
  @Roles('superadmin', 'admin')
  remove(@Param('id') id: string) {
    return this.notificationsService.remove(id);
  }
}
