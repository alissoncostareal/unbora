import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class RecommendActivityDto {
  @IsString()
  id!: string;

  @IsString()
  label!: string;

  @IsString()
  searchHint!: string;
}

export class RecommendDto {
  @IsString()
  humor!: string;

  @IsString()
  sentir!: string;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => RecommendActivityDto)
  activities!: RecommendActivityDto[];
}

export interface PlaceResult {
  nome: string;
  tipo: string;
  icone: string;
  imagem?: string;
  endereco?: string;
  nota: number;
  descricao: string;
  /** @deprecated preferir endereco — mantido só por compatibilidade */
  tags?: string[];
  destaque: boolean;
}

export interface RecommendationResult {
  titulo: string;
  subtitulo: string;
  lugares: PlaceResult[];
}

export class SearchDto {
  @IsString()
  query!: string;
}

export class DiscoverEventsDto {
  @IsOptional()
  @IsString()
  city?: string;
}

export interface AiEventResult {
  titulo: string;
  descricao: string;
  local: string;
  data: string;
  tipo: string;
  imagem?: string;
}

export interface DiscoverEventsResult {
  titulo: string;
  subtitulo: string;
  eventos: AiEventResult[];
}

