import { Body, Controller, Post } from '@nestjs/common';

import {
  DiscoverEventsDto,
  RecommendDto,
  SearchDto,
} from './recommendations.types';
import { RecommendationsService } from './recommendations.service';

@Controller('api')
export class RecommendationsController {
  constructor(private readonly recommendationsService: RecommendationsService) {}

  @Post('recomendar')
  recommend(@Body() dto: RecommendDto) {
    return this.recommendationsService.recommend(dto);
  }

  @Post('buscar')
  search(@Body() dto: SearchDto) {
    return this.recommendationsService.search(dto);
  }

  @Post('eventos')
  discoverEvents(@Body() dto: DiscoverEventsDto) {
    return this.recommendationsService.discoverEvents(dto);
  }
}
