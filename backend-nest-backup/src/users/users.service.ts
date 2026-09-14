import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { createHash, randomUUID } from 'crypto';

import { PrismaService } from '../prisma/prisma.service';

import {
  GoogleLoginDto,
  LoginUserDto,
  PublicUser,
  RegisterMerchantDto,
  RegisterUserDto,
  SyncUserDto,
  UserStats,
} from './users.types';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  private hashPassword(password: string): string {
    return createHash('sha256').update(password).digest('hex');
  }

  private toPublic(user: {
    id: string;
    name: string;
    email: string;
    isGuest: boolean;
    platform: string | null;
    role: 'user' | 'merchant';
    businessName: string | null;
    createdAt: Date;
    lastSeenAt: Date;
  }): PublicUser {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      isGuest: user.isGuest,
      platform: user.platform ?? undefined,
      role: user.role,
      businessName: user.businessName ?? undefined,
      createdAt: user.createdAt.toISOString(),
      lastSeenAt: user.lastSeenAt.toISOString(),
    };
  }

  async list(): Promise<PublicUser[]> {
    const users = await this.prisma.user.findMany({
      orderBy: { lastSeenAt: 'desc' },
    });
    return users.map((user) => this.toPublic(user));
  }

  async stats(): Promise<UserStats> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [total, guests, registered, activeToday] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isGuest: true } }),
      this.prisma.user.count({ where: { isGuest: false } }),
      this.prisma.user.count({ where: { lastSeenAt: { gte: today } } }),
    ]);

    return { total, guests, registered, activeToday };
  }

  async register(dto: RegisterUserDto): Promise<PublicUser> {
    const email = dto.email.trim().toLowerCase();

    const existing = await this.prisma.user.findFirst({
      where: { email, isGuest: false },
    });
    if (existing) {
      throw new ConflictException('Este e-mail já está cadastrado.');
    }

    const user = await this.prisma.user.create({
      data: {
        id: randomUUID(),
        name: dto.name.trim(),
        email,
        isGuest: false,
        passwordHash: this.hashPassword(dto.password),
        platform: dto.platform,
      },
    });

    return this.toPublic(user);
  }

  async registerMerchant(dto: RegisterMerchantDto): Promise<PublicUser> {
    const email = dto.email.trim().toLowerCase();

    const existing = await this.prisma.user.findFirst({
      where: { email, isGuest: false },
    });
    if (existing) {
      throw new ConflictException('Este e-mail já está cadastrado.');
    }

    const user = await this.prisma.user.create({
      data: {
        id: randomUUID(),
        name: dto.name.trim(),
        email,
        isGuest: false,
        passwordHash: this.hashPassword(dto.password),
        platform: dto.platform,
        role: 'merchant',
        businessName: dto.businessName.trim(),
      },
    });

    return this.toPublic(user);
  }

  async login(dto: LoginUserDto): Promise<PublicUser> {
    const email = dto.email.trim().toLowerCase();
    const user = await this.prisma.user.findFirst({
      where: { email, isGuest: false },
    });

    if (!user || user.passwordHash !== this.hashPassword(dto.password)) {
      throw new UnauthorizedException('E-mail ou senha inválidos.');
    }

    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: { lastSeenAt: new Date() },
    });

    return this.toPublic(updated);
  }

  async googleLogin(dto: GoogleLoginDto): Promise<PublicUser> {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.prisma.user.findFirst({
      where: { email, isGuest: false },
    });

    const user = existing
      ? await this.prisma.user.update({
          where: { id: existing.id },
          data: {
            lastSeenAt: new Date(),
            platform: dto.platform ?? existing.platform,
          },
        })
      : await this.prisma.user.create({
          data: {
            id: randomUUID(),
            name: dto.name.trim(),
            email,
            isGuest: false,
            platform: dto.platform,
          },
        });

    return this.toPublic(user);
  }

  async sync(dto: SyncUserDto): Promise<PublicUser> {
    const email = dto.email?.trim().toLowerCase() ?? '';
    let user = await this.prisma.user.findUnique({ where: { id: dto.id } });

    if (!user && email) {
      user = await this.prisma.user.findFirst({
        where: { email, isGuest: false },
      });
    }

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          id: dto.id,
          name: dto.name.trim(),
          email,
          isGuest: dto.isGuest,
          platform: dto.platform,
        },
      });
      return this.toPublic(user);
    }

    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        name: dto.name.trim(),
        email: email || user.email,
        isGuest: dto.isGuest,
        platform: dto.platform ?? user.platform,
        lastSeenAt: new Date(),
      },
    });

    return this.toPublic(updated);
  }

  async findById(id: string): Promise<PublicUser> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Usuário não encontrado.');
    return this.toPublic(user);
  }
}
