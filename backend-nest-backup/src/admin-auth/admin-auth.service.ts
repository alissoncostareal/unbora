import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PortalRole } from '@prisma/client';
import { createHash, randomUUID, timingSafeEqual } from 'crypto';

import { loadEnvFiles } from '../config/load-env';
import { PrismaService } from '../prisma/prisma.service';

import {
  AdminLoginDto,
  AdminSession,
  CreatePortalUserDto,
  PortalUserRecord,
} from './admin-auth.types';

interface TokenPayload {
  sub: string;
  email: string;
  name: string;
  role: AdminSession['role'];
  exp: number;
}

@Injectable()
export class AdminAuthService {
  private readonly tokenTtlMs = 1000 * 60 * 60 * 12;

  constructor(private readonly prisma: PrismaService) {}

  private hashPassword(password: string): string {
    return createHash('sha256').update(password).digest('hex');
  }

  private safeCompare(a: string, b: string): boolean {
    const left = Buffer.from(a, 'utf8');
    const right = Buffer.from(b, 'utf8');
    if (left.length !== right.length) return false;
    return timingSafeEqual(left, right);
  }

  private getJwtSecret(): string {
    const secret = process.env.ADMIN_JWT_SECRET ?? process.env.JWT_SECRET;
    if (!secret) {
      throw new UnauthorizedException('ADMIN_JWT_SECRET não configurado no .env');
    }
    return secret;
  }

  private readSuperadminEnv(): { email: string; password: string; name: string } | null {
    this.reloadEnvFromDisk();

    const email = process.env.SUPERADMIN_EMAIL?.trim().toLowerCase();
    const password = process.env.SUPERADMIN_PASSWORD?.replace(/\r$/, '') ?? '';
    if (!email || !password) return null;
    return {
      email,
      password,
      name: process.env.SUPERADMIN_NAME?.trim() || 'Super Admin',
    };
  }

  isSuperadminConfigured(): boolean {
    return this.readSuperadminEnv() !== null;
  }

  private reloadEnvFromDisk(): void {
    if (process.env.NODE_ENV === 'production') return;
    loadEnvFiles(true);
  }

  private signToken(payload: Omit<TokenPayload, 'exp'>): string {
    const fullPayload: TokenPayload = {
      ...payload,
      exp: Date.now() + this.tokenTtlMs,
    };
    const body = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');
    const signature = createHash('sha256')
      .update(`${body}.${this.getJwtSecret()}`)
      .digest('base64url');
    return `${body}.${signature}`;
  }

  verifyToken(token: string): AdminSession {
    const [body, signature] = token.split('.');
    if (!body || !signature) {
      throw new UnauthorizedException('Token inválido.');
    }

    const expected = createHash('sha256')
      .update(`${body}.${this.getJwtSecret()}`)
      .digest('base64url');

    if (!this.safeCompare(signature, expected)) {
      throw new UnauthorizedException('Token inválido.');
    }

    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf-8')) as TokenPayload;

    if (payload.exp < Date.now()) {
      throw new UnauthorizedException('Sessão expirada. Faça login novamente.');
    }

    return {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      role: payload.role,
    };
  }

  async login(dto: AdminLoginDto): Promise<{ token: string; user: AdminSession }> {
    const email = dto.email.trim().toLowerCase();
    const superadmin = this.readSuperadminEnv();

    if (superadmin && email === superadmin.email) {
      if (!this.safeCompare(dto.password, superadmin.password)) {
        throw new UnauthorizedException('E-mail ou senha inválidos.');
      }

      const user: AdminSession = {
        id: 'superadmin',
        name: superadmin.name,
        email: superadmin.email,
        role: 'superadmin',
      };

      return {
        user,
        token: this.signToken({
          sub: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }),
      };
    }

    const portalUser = await this.prisma.portalUser.findUnique({ where: { email } });
    if (!portalUser || portalUser.passwordHash !== this.hashPassword(dto.password)) {
      throw new UnauthorizedException('E-mail ou senha inválidos.');
    }

    const user: AdminSession = {
      id: portalUser.id,
      name: portalUser.name,
      email: portalUser.email,
      role: portalUser.role,
    };

    return {
      user,
      token: this.signToken({
        sub: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      }),
    };
  }

  async listPortalUsers(): Promise<Omit<PortalUserRecord, 'passwordHash'>[]> {
    const users = await this.prisma.portalUser.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
    }));
  }

  async createPortalUser(
    dto: CreatePortalUserDto,
  ): Promise<Omit<PortalUserRecord, 'passwordHash'>> {
    const email = dto.email.trim().toLowerCase();
    const superadmin = this.readSuperadminEnv();

    if (superadmin && superadmin.email === email) {
      throw new ConflictException('Este e-mail já está reservado ao superadmin.');
    }

    const existing = await this.prisma.portalUser.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('Este e-mail já está cadastrado no portal.');
    }

    const record = await this.prisma.portalUser.create({
      data: {
        id: randomUUID(),
        name: dto.name.trim(),
        email,
        passwordHash: this.hashPassword(dto.password),
        role: dto.role as PortalRole,
      },
    });

    return {
      id: record.id,
      name: record.name,
      email: record.email,
      role: record.role,
      createdAt: record.createdAt.toISOString(),
    };
  }
}
