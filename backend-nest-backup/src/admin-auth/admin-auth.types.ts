import { IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export type AdminRole = 'superadmin' | 'admin' | 'consultor';

export class AdminLoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}

export class CreatePortalUserDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsIn(['admin', 'consultor'])
  role!: Exclude<AdminRole, 'superadmin'>;
}

export interface AdminSession {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
}

export interface PortalUserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: Exclude<AdminRole, 'superadmin'>;
  createdAt: string;
}

export const ADMIN_ROLE_LABELS: Record<AdminRole, string> = {
  superadmin: 'Super Admin',
  admin: 'Administrador',
  consultor: 'Consultor',
};
