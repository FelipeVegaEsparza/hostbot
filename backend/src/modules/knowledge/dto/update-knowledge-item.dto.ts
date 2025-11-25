import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateKnowledgeItemDto } from './create-knowledge-item.dto';

export class UpdateKnowledgeItemDto extends PartialType(
  OmitType(CreateKnowledgeItemDto, ['knowledgeBaseId'] as const),
) {}
