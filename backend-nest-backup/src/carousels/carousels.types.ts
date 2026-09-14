import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Min,
} from 'class-validator';

export class CreateCarouselDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  subtitle!: string;

  @IsString()
  @IsNotEmpty()
  tag!: string;

  @IsUrl()
  imageUrl!: string;

  @IsString()
  @IsNotEmpty()
  city!: string;

  @IsString()
  @IsNotEmpty()
  region!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class UpdateCarouselDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  subtitle?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  tag?: string;

  @IsOptional()
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
  @IsInt()
  @Min(0)
  order?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export interface CarouselRecord {
  id: string;
  title: string;
  subtitle: string;
  tag: string;
  imageUrl: string;
  city: string;
  region: string;
  order: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}
