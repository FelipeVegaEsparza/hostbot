import { IsString, IsNumber, IsEnum, IsObject, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBillingEventDto {
  @ApiProperty({ example: 'uuid-of-customer' })
  @IsString()
  customerId: string;

  @ApiProperty({ example: 29.99 })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ example: 'Monthly subscription charge' })
  @IsString()
  description: string;

  @ApiProperty({ example: 'PENDING', enum: ['PENDING', 'COMPLETED', 'FAILED'] })
  @IsEnum(['PENDING', 'COMPLETED', 'FAILED'])
  @IsOptional()
  status?: string;

  @ApiProperty({ example: { invoiceId: 'uuid', transactionId: 'txn_123' } })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
