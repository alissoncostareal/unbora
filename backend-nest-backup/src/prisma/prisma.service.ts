import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const MAX_ATTEMPTS = 8;
const RETRY_DELAY_MS = 2000;

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit(): Promise<void> {
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
      try {
        await this.$connect();
        if (attempt > 1) {
          this.logger.log(`Postgres conectado na tentativa ${attempt}.`);
        }
        return;
      } catch (error) {
        if (attempt === MAX_ATTEMPTS) throw error;
        this.logger.warn(
          `Postgres indisponível (tentativa ${attempt}/${MAX_ATTEMPTS}). Tentando de novo em ${RETRY_DELAY_MS / 1000}s…`,
        );
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      }
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
