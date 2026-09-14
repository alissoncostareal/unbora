import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';

export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsString()
  @IsUrl()
  imageUrl!: string;

  @IsString()
  @IsNotEmpty()
  city!: string;

  @IsString()
  @IsNotEmpty()
  region!: string;

  @IsOptional()
  @IsString()
  venue?: string;

  @IsDateString()
  startsAt!: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsString()
  @IsNotEmpty()
  merchantId!: string;
}

export class UpdateEventDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  description?: string;

  @IsOptional()
  @IsString()
  @IsUrl()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  city?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  region?: string;

  @IsOptional()
  @IsString()
  venue?: string;

  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export interface EventRecord {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  city: string;
  region: string;
  venue: string;
  startsAt: string;
  active: boolean;
  merchantId: string;
  merchantName?: string;
  businessName?: string;
  createdAt: string;
  updatedAt: string;
}
