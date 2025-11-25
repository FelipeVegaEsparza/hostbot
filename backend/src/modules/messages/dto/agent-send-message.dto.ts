import { IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AgentSendMessageDto {
    @ApiProperty({
        description: 'ID of the conversation',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsString()
    @IsNotEmpty()
    conversationId: string;

    @ApiProperty({
        description: 'Message content from human agent',
        example: 'I can help you with that. Let me check your order status.',
    })
    @IsString()
    @IsNotEmpty()
    content: string;

    @ApiProperty({
        description: 'Optional metadata',
        example: { agentId: 'agent-123', agentName: 'John Doe' },
        required: false,
    })
    @IsObject()
    @IsOptional()
    metadata?: Record<string, any>;
}
