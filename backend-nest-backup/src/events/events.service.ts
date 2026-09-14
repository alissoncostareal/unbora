import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { randomUUID } from 'crypto';

import { PrismaService } from '../prisma/prisma.service';

import { SEED_EVENTS, SEED_MERCHANT, SEED_MERCHANT_ID } from './events.seed';
import { CreateEventDto, EventRecord, UpdateEventDto } from './events.types';

@Injectable()
export class EventsService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit(): Promise<void> {
    const count = await this.prisma.event.count();
    if (count > 0) return;

    await this.prisma.user.upsert({
      where: { id: SEED_MERCHANT_ID },
      create: SEED_MERCHANT,
      update: {
        role: 'merchant',
        businessName: SEED_MERCHANT.businessName,
        isGuest: false,
      },
    });

    await this.prisma.event.createMany({
      data: SEED_EVENTS.map((event) => ({
        ...event,
        merchantId: SEED_MERCHANT_ID,
      })),
      skipDuplicates: true,
    });
  }

  private toRecord(event: {
    id: string;
    title: string;
    description: string;
    imageUrl: string;
    city: string;
    region: string;
    venue: string;
    startsAt: Date;
    active: boolean;
    merchantId: string;
    createdAt: Date;
    updatedAt: Date;
    merchant?: { name: string; businessName: string | null };
  }): EventRecord {
    return {
      id: event.id,
      title: event.title,
      description: event.description,
      imageUrl: event.imageUrl,
      city: event.city,
      region: event.region,
      venue: event.venue,
      startsAt: event.startsAt.toISOString(),
      active: event.active,
      merchantId: event.merchantId,
      merchantName: event.merchant?.name,
      businessName: event.merchant?.businessName ?? undefined,
      createdAt: event.createdAt.toISOString(),
      updatedAt: event.updatedAt.toISOString(),
    };
  }

  async list(filters?: {
    city?: string;
    region?: string;
    activeOnly?: boolean;
  }): Promise<EventRecord[]> {
    const events = await this.prisma.event.findMany({
      where: {
        ...(filters?.activeOnly ? { active: true } : {}),
        ...(filters?.city ? { city: filters.city } : {}),
        ...(filters?.region ? { region: filters.region } : {}),
      },
      include: {
        merchant: { select: { name: true, businessName: true } },
      },
      orderBy: { startsAt: 'asc' },
    });

    return events.map((event) => this.toRecord(event));
  }

  async listByMerchant(merchantId: string): Promise<EventRecord[]> {
    const events = await this.prisma.event.findMany({
      where: { merchantId },
      include: {
        merchant: { select: { name: true, businessName: true } },
      },
      orderBy: { startsAt: 'asc' },
    });
    return events.map((event) => this.toRecord(event));
  }

  async create(dto: CreateEventDto): Promise<EventRecord> {
    const merchant = await this.prisma.user.findUnique({
      where: { id: dto.merchantId },
    });

    if (!merchant || merchant.role !== 'merchant' || merchant.isGuest) {
      throw new ForbiddenException('Apenas lojistas podem criar eventos.');
    }

    const event = await this.prisma.event.create({
      data: {
        id: randomUUID(),
        title: dto.title.trim(),
        description: dto.description.trim(),
        imageUrl: dto.imageUrl.trim(),
        city: dto.city.trim(),
        region: dto.region.trim(),
        venue: dto.venue?.trim() ?? '',
        startsAt: new Date(dto.startsAt),
        active: dto.active ?? true,
        merchantId: dto.merchantId,
      },
      include: {
        merchant: { select: { name: true, businessName: true } },
      },
    });

    return this.toRecord(event);
  }

  async update(
    id: string,
    merchantId: string,
    dto: UpdateEventDto,
  ): Promise<EventRecord> {
    const existing = await this.prisma.event.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Evento não encontrado.');
    if (existing.merchantId !== merchantId) {
      throw new ForbiddenException('Você só pode editar seus próprios eventos.');
    }

    const event = await this.prisma.event.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description.trim() }
          : {}),
        ...(dto.imageUrl !== undefined ? { imageUrl: dto.imageUrl.trim() } : {}),
        ...(dto.city !== undefined ? { city: dto.city.trim() } : {}),
        ...(dto.region !== undefined ? { region: dto.region.trim() } : {}),
        ...(dto.venue !== undefined ? { venue: dto.venue.trim() } : {}),
        ...(dto.startsAt !== undefined ? { startsAt: new Date(dto.startsAt) } : {}),
        ...(dto.active !== undefined ? { active: dto.active } : {}),
      },
      include: {
        merchant: { select: { name: true, businessName: true } },
      },
    });

    return this.toRecord(event);
  }

  async remove(id: string, merchantId: string): Promise<{ deleted: true; id: string }> {
    const existing = await this.prisma.event.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Evento não encontrado.');
    if (existing.merchantId !== merchantId) {
      throw new ForbiddenException('Você só pode remover seus próprios eventos.');
    }

    await this.prisma.event.delete({ where: { id } });
    return { deleted: true, id };
  }
}
