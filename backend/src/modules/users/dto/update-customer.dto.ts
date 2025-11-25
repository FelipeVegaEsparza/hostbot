import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCustomerDto {
  @ApiProperty({ example: 'Acme Corporation', required: false })
  @IsOptional()
  @IsString()
  companyName?: string;
}
