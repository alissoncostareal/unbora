import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import { EventsService } from './events.service';
import { CreateEventDto, UpdateEventDto } from './events.types';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  list(
    @Query('city') city?: string,
    @Query('region') region?: string,
    @Query('active') active?: string,
    @Query('merchantId') merchantId?: string,
  ) {
    if (merchantId) {
      return this.eventsService.listByMerchant(merchantId);
    }

    return this.eventsService.list({
      city,
      region,
      activeOnly: active !== 'false',
    });
  }

  @Post()
  create(@Body() dto: CreateEventDto) {
    return this.eventsService.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Headers('x-user-id') merchantId: string,
    @Body() dto: UpdateEventDto,
  ) {
    return this.eventsService.update(id, merchantId, dto);
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @Headers('x-user-id') merchantId: string,
  ) {
    return this.eventsService.remove(id, merchantId);
  }
}
