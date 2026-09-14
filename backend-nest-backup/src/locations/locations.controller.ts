import { Controller, Get } from '@nestjs/common';

import { DEFAULT_CITY, DEFAULT_REGION, REGIONS } from '../common/locations';

@Controller('locations')
export class LocationsController {
  @Get()
  list() {
    return {
      defaultCity: DEFAULT_CITY,
      defaultRegion: DEFAULT_REGION,
      regions: REGIONS,
    };
  }
}
