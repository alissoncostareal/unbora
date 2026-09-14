import { IsBoolean, IsEmail, IsNotEmpty, IsOptional, IsString, MinLength, ValidateIf } from 'class-validator';

export class RegisterUserDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;

  @IsOptional()
  @IsString()
  platform?: string;
}

export class RegisterMerchantDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsString()
  @IsNotEmpty()
  businessName!: string;

  @IsOptional()
  @IsString()
  platform?: string;
}

export class LoginUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}

export class GoogleLoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  googleId!: string;

  @IsOptional()
  @IsString()
  platform?: string;
}

export class SyncUserDto {
  @IsString()
  @IsNotEmpty()
  id!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @ValidateIf((_, value) => value !== '' && value != null)
  @IsEmail()
  email?: string;

  @IsBoolean()
  isGuest!: boolean;

  @IsOptional()
  @IsString()
  platform?: string;
}

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  isGuest: boolean;
  passwordHash?: string;
  platform?: string;
  role: 'user' | 'merchant';
  businessName?: string;
  createdAt: string;
  lastSeenAt: string;
}

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  isGuest: boolean;
  platform?: string;
  role: 'user' | 'merchant';
  businessName?: string;
  createdAt: string;
  lastSeenAt: string;
}

export interface UserStats {
  total: number;
  guests: number;
  registered: number;
  activeToday: number;
}
