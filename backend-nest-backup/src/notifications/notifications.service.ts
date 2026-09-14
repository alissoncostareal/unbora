import { Injectable, NotFoundException } from '@nestjs/common';
import { Notification, Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';

import {
  DEFAULT_CITY,
  DEFAULT_REGION,
  matchesLocation,
  normalizeCity,
  normalizeRegion,
} from '../common/locations';
import { PrismaService } from '../prisma/prisma.service';

import {
  CreateNotificationDto,
  NotificationRecord,
  UpdateNotificationDto,
} from './notifications.types';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  private toRecord(item: Notification): NotificationRecord {
    return {
      id: item.id,
      title: item.title,
      body: item.body,
      city: item.city ?? DEFAULT_CITY,
      region: item.region ?? DEFAULT_REGION,
      active: item.active,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    };
  }

  async list(options: {
    activeOnly?: boolean;
    city?: string;
    region?: string;
  } = {}): Promise<NotificationRecord[]> {
    const city = normalizeCity(options.city);
    const region = normalizeRegion(options.region);

    const items = await this.prisma.notification.findMany({
      where: {
        ...(options.activeOnly ? { active: true } : {}),
        ...(city ? { city: { equals: city, mode: 'insensitive' } } : {}),
        ...(region ? { region: { equals: region, mode: 'insensitive' } } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });

    return items
      .map((item) => this.toRecord(item))
      .filter((item) => !city && !region ? true : matchesLocation(item, city, region));
  }

  async create(dto: CreateNotificationDto): Promise<NotificationRecord> {
    const notification = await this.prisma.notification.create({
      data: {
        id: randomUUID(),
        title: dto.title.trim(),
        body: dto.body.trim(),
        city: dto.city.trim(),
        region: dto.region.trim(),
        active: dto.active ?? true,
      },
    });

    return this.toRecord(notification);
  }

  async update(id: string, dto: UpdateNotificationDto): Promise<NotificationRecord> {
    try {
      const data: Prisma.NotificationUpdateInput = {};

      if (dto.title !== undefined) data.title = dto.title.trim();
      if (dto.body !== undefined) data.body = dto.body.trim();
      if (dto.city !== undefined) data.city = dto.city.trim();
      if (dto.region !== undefined) data.region = dto.region.trim();
      if (dto.active !== undefined) data.active = dto.active;

      const updated = await this.prisma.notification.update({ where: { id }, data });
      return this.toRecord(updated);
    } catch {
      throw new NotFoundException('Notificação não encontrada.');
    }
  }

  async remove(id: string): Promise<{ deleted: true; id: string }> {
    try {
      await this.prisma.notification.delete({ where: { id } });
      return { deleted: true, id };
    } catch {
      throw new NotFoundException('Notificação não encontrada.');
    }
  }
}
