import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateNotificationDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  body!: string;

  @IsString()
  @IsNotEmpty()
  city!: string;

  @IsString()
  @IsNotEmpty()
  region!: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class UpdateNotificationDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  body?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  city?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  region?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export interface NotificationRecord {
  id: string;
  title: string;
  body: string;
  city: string;
  region: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}
