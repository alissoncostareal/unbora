import { Module } from '@nestjs/common';

import { AdminAuthModule } from './admin-auth/admin-auth.module';
import { CarouselsModule } from './carousels/carousels.module';
import { EventsModule } from './events/events.module';
import { LocationsModule } from './locations/locations.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PrismaModule } from './prisma/prisma.module';
import { RecommendationsModule } from './recommendations/recommendations.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    PrismaModule,
    AdminAuthModule,
    UsersModule,
    RecommendationsModule,
    CarouselsModule,
    NotificationsModule,
    LocationsModule,
    EventsModule,
  ],
})
export class AppModule {}
