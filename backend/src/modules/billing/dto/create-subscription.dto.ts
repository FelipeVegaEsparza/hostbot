import { IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSubscriptionDto {
  @ApiProperty({ example: 'uuid-of-customer' })
  @IsString()
  @IsUUID()
  customerId: string;

  @ApiProperty({ example: 'uuid-of-plan' })
  @IsString()
  @IsUUID()
  planId: string;
}
