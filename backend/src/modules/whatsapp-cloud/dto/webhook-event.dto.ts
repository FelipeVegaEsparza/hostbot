import { IsString, IsObject, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class WhatsAppMessageDto {
  @IsString()
  from: string;

  @IsString()
  id: string;

  @IsString()
  timestamp: string;

  @IsObject()
  @IsOptional()
  text?: {
    body: string;
  };

  @IsString()
  type: string;
}

export class WhatsAppValueDto {
  @IsString()
  messaging_product: string;

  @IsObject()
  metadata: {
    display_phone_number: string;
    phone_number_id: string;
  };

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WhatsAppMessageDto)
  @IsOptional()
  messages?: WhatsAppMessageDto[];

  @IsArray()
  @IsOptional()
  statuses?: any[];
}

export class WhatsAppChangeDto {
  @IsObject()
  @ValidateNested()
  @Type(() => WhatsAppValueDto)
  value: WhatsAppValueDto;

  @IsString()
  field: string;
}

export class WhatsAppEntryDto {
  @IsString()
  id: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WhatsAppChangeDto)
  changes: WhatsAppChangeDto[];
}

export class WebhookEventDto {
  @IsString()
  object: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WhatsAppEntryDto)
  entry: WhatsAppEntryDto[];
}
