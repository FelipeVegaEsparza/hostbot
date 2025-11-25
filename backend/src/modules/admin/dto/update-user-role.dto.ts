import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class UpdateUserRoleDto {
  @ApiProperty({
    description: 'New role for the user',
    enum: Role,
    example: 'ADMIN',
  })
  @IsEnum(Role)
  @IsNotEmpty()
  role: Role;
}
