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
import { CreateCarouselDto, UpdateCarouselDto } from './carousels.types';
import { CarouselsService } from './carousels.service';

@Controller('carousels')
export class CarouselsController {
  constructor(private readonly carouselsService: CarouselsService) {}

  @Get()
  list(
    @Query('active') active?: string,
    @Query('city') city?: string,
    @Query('region') region?: string,
  ) {
    const activeOnly = active === 'true' || active === '1';
    return this.carouselsService.list({ activeOnly, city, region });
  }

  @Post()
  @UseGuards(AdminAuthGuard, RolesGuard)
  @Roles('superadmin', 'admin')
  create(@Body() dto: CreateCarouselDto) {
    return this.carouselsService.create(dto);
  }

  @Patch(':id')
  @UseGuards(AdminAuthGuard, RolesGuard)
  @Roles('superadmin', 'admin')
  update(@Param('id') id: string, @Body() dto: UpdateCarouselDto) {
    return this.carouselsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(AdminAuthGuard, RolesGuard)
  @Roles('superadmin', 'admin')
  remove(@Param('id') id: string) {
    return this.carouselsService.remove(id);
  }
}
