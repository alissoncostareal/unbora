import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { Carousel, Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';

import {
  DEFAULT_CITY,
  DEFAULT_REGION,
  matchesLocation,
  normalizeCity,
  normalizeRegion,
} from '../common/locations';
import { PrismaService } from '../prisma/prisma.service';

import { DEFAULT_CAROUSELS } from './carousels.seed';
import {
  CarouselRecord,
  CreateCarouselDto,
  UpdateCarouselDto,
} from './carousels.types';

@Injectable()
export class CarouselsService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit(): Promise<void> {
    const count = await this.prisma.carousel.count();
    if (count === 0) {
      await this.prisma.carousel.createMany({ data: DEFAULT_CAROUSELS });
      return;
    }

    // Garante stories de curadoria mesmo em bancos já populados
    for (const item of DEFAULT_CAROUSELS) {
      if (!item.id?.startsWith('organic-')) continue;
      await this.prisma.carousel.upsert({
        where: { id: item.id },
        create: item,
        update: {
          title: item.title,
          subtitle: item.subtitle,
          tag: item.tag,
          imageUrl: item.imageUrl,
          city: item.city,
          region: item.region,
          sortOrder: item.sortOrder,
          active: item.active,
        },
      });
    }
  }

  private toRecord(item: Carousel): CarouselRecord {
    return {
      id: item.id,
      title: item.title,
      subtitle: item.subtitle,
      tag: item.tag,
      imageUrl: item.imageUrl,
      city: item.city ?? DEFAULT_CITY,
      region: item.region ?? DEFAULT_REGION,
      order: item.sortOrder,
      active: item.active,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    };
  }

  async list(options: {
    activeOnly?: boolean;
    city?: string;
    region?: string;
  } = {}): Promise<CarouselRecord[]> {
    const city = normalizeCity(options.city);
    const region = normalizeRegion(options.region);

    const items = await this.prisma.carousel.findMany({
      where: {
        ...(options.activeOnly ? { active: true } : {}),
        ...(city ? { city: { equals: city, mode: 'insensitive' } } : {}),
        ...(region ? { region: { equals: region, mode: 'insensitive' } } : {}),
      },
      orderBy: { sortOrder: 'asc' },
    });

    return items
      .map((item) => this.toRecord(item))
      .filter((item) => !city && !region ? true : matchesLocation(item, city, region));
  }

  async create(dto: CreateCarouselDto): Promise<CarouselRecord> {
    const maxOrder = await this.prisma.carousel.aggregate({ _max: { sortOrder: true } });
    const order = dto.order ?? (maxOrder._max.sortOrder ?? -1) + 1;

    const carousel = await this.prisma.carousel.create({
      data: {
        id: randomUUID(),
        title: dto.title.trim(),
        subtitle: dto.subtitle.trim(),
        tag: dto.tag.trim(),
        imageUrl: dto.imageUrl.trim(),
        city: dto.city.trim(),
        region: dto.region.trim(),
        sortOrder: order,
        active: dto.active ?? true,
      },
    });

    return this.toRecord(carousel);
  }

  async update(id: string, dto: UpdateCarouselDto): Promise<CarouselRecord> {
    try {
      const data: Prisma.CarouselUpdateInput = {};

      if (dto.title !== undefined) data.title = dto.title.trim();
      if (dto.subtitle !== undefined) data.subtitle = dto.subtitle.trim();
      if (dto.tag !== undefined) data.tag = dto.tag.trim();
      if (dto.imageUrl !== undefined) data.imageUrl = dto.imageUrl.trim();
      if (dto.city !== undefined) data.city = dto.city.trim();
      if (dto.region !== undefined) data.region = dto.region.trim();
      if (dto.order !== undefined) data.sortOrder = dto.order;
      if (dto.active !== undefined) data.active = dto.active;

      const updated = await this.prisma.carousel.update({ where: { id }, data });
      return this.toRecord(updated);
    } catch {
      throw new NotFoundException('Evento não encontrado.');
    }
  }

  async remove(id: string): Promise<{ deleted: true; id: string }> {
    try {
      await this.prisma.carousel.delete({ where: { id } });
      return { deleted: true, id };
    } catch {
      throw new NotFoundException('Evento não encontrado.');
    }
  }
}
