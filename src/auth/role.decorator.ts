import { SetMetadata } from '@nestjs/common';
import { UserRole } from 'src/users/entities/user.entity';

export type AllowedRoles = keyof typeof UserRole | 'Any';
// type AllowedRoles = keyof UserRole;

export const Role = (roles: AllowedRoles[]) => {
  return SetMetadata('roles', roles);
};
