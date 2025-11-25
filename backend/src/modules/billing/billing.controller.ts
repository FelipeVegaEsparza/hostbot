import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BillingService } from './billing.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { LogUsageDto } from './dto/log-usage.dto';
import { CreateBillingEventDto } from './dto/create-billing-event.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('billing')
@Controller('billing')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  // ============================================
  // Plan Endpoints
  // ============================================

  @Post('plans')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create a new plan (Admin only)' })
  @ApiResponse({ status: 201, description: 'Plan created successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  createPlan(@Body() createPlanDto: CreatePlanDto) {
    return this.billingService.createPlan(createPlanDto);
  }

  @Get('plans')
  @ApiOperation({ summary: 'Get all plans' })
  @ApiResponse({ status: 200, description: 'List of all plans' })
  findAllPlans() {
    return this.billingService.findAllPlans();
  }

  @Get('plans/:id')
  @ApiOperation({ summary: 'Get plan by ID' })
  @ApiResponse({ status: 200, description: 'Plan details' })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  findPlanById(@Param('id') id: string) {
    return this.billingService.findPlanById(id);
  }

  @Patch('plans/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update plan (Admin only)' })
  @ApiResponse({ status: 200, description: 'Plan updated successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  updatePlan(@Param('id') id: string, @Body() updatePlanDto: UpdatePlanDto) {
    return this.billingService.updatePlan(id, updatePlanDto);
  }

  @Delete('plans/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete plan (Admin only)' })
  @ApiResponse({ status: 200, description: 'Plan deleted successfully' })
  @ApiResponse({ status: 400, description: 'Cannot delete plan with active subscriptions' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  deletePlan(@Param('id') id: string) {
    return this.billingService.deletePlan(id);
  }

  // ============================================
  // Subscription Endpoints
  // ============================================

  @Post('subscriptions')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create a new subscription (Admin only)' })
  @ApiResponse({ status: 201, description: 'Subscription created successfully' })
  @ApiResponse({ status: 400, description: 'Customer already has a subscription' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Customer or plan not found' })
  createSubscription(@Body() createSubscriptionDto: CreateSubscriptionDto) {
    return this.billingService.createSubscription(createSubscriptionDto);
  }

  @Get('subscriptions/customer/:customerId')
  @ApiOperation({ summary: 'Get subscription by customer ID' })
  @ApiResponse({ status: 200, description: 'Subscription details' })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  findSubscriptionByCustomerId(@Param('customerId') customerId: string) {
    return this.billingService.findSubscriptionByCustomerId(customerId);
  }

  @Patch('subscriptions/customer/:customerId/status')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update subscription status (Admin only)' })
  @ApiResponse({ status: 200, description: 'Subscription status updated' })
  @ApiResponse({ status: 400, description: 'Invalid status' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  updateSubscriptionStatus(
    @Param('customerId') customerId: string,
    @Body('status') status: string,
  ) {
    return this.billingService.updateSubscriptionStatus(customerId, status);
  }

  @Post('subscriptions/customer/:customerId/cancel')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Cancel subscription (Admin only)' })
  @ApiResponse({ status: 200, description: 'Subscription cancelled' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  cancelSubscription(@Param('customerId') customerId: string) {
    return this.billingService.cancelSubscription(customerId);
  }

  // ============================================
  // Validation Endpoints
  // ============================================

  @Get('validate/chatbot-limit/:customerId')
  @ApiOperation({ summary: 'Validate chatbot limit for customer' })
  @ApiResponse({ status: 200, description: 'Limit validation result' })
  @ApiResponse({ status: 403, description: 'Limit exceeded or no active subscription' })
  async validateChatbotLimit(@Param('customerId') customerId: string) {
    const isValid = await this.billingService.validateChatbotLimit(customerId);
    return { valid: isValid };
  }

  @Get('validate/message-limit/:customerId')
  @ApiOperation({ summary: 'Validate message limit for customer' })
  @ApiResponse({ status: 200, description: 'Limit validation result' })
  @ApiResponse({ status: 403, description: 'Limit exceeded or no active subscription' })
  async validateMessageLimit(@Param('customerId') customerId: string) {
    const isValid = await this.billingService.validateMessageLimit(customerId);
    return { valid: isValid };
  }

  @Get('validate/ai-provider/:customerId/:provider')
  @ApiOperation({ summary: 'Validate AI provider for customer' })
  @ApiResponse({ status: 200, description: 'Provider validation result' })
  @ApiResponse({ status: 403, description: 'Provider not allowed in plan' })
  async validateAIProvider(
    @Param('customerId') customerId: string,
    @Param('provider') provider: string,
  ) {
    const isValid = await this.billingService.validateAIProvider(customerId, provider);
    return { valid: isValid };
  }

  // ============================================
  // Usage Endpoints
  // ============================================

  @Post('usage')
  @ApiOperation({ summary: 'Log usage' })
  @ApiResponse({ status: 201, description: 'Usage logged successfully' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  logUsage(@Body() logUsageDto: LogUsageDto) {
    return this.billingService.logUsage(logUsageDto);
  }

  @Get('usage/customer/:customerId/monthly')
  @ApiOperation({ summary: 'Get monthly usage for customer' })
  @ApiResponse({ status: 200, description: 'Monthly usage data' })
  getMonthlyUsage(
    @Param('customerId') customerId: string,
    @Query('year') year?: string,
    @Query('month') month?: string,
  ) {
    const yearNum = year ? parseInt(year, 10) : undefined;
    const monthNum = month ? parseInt(month, 10) - 1 : undefined; // Convert to 0-indexed
    return this.billingService.getMonthlyUsage(customerId, yearNum, monthNum);
  }

  // ============================================
  // Billing Event Endpoints
  // ============================================

  @Post('events')
  @ApiOperation({ summary: 'Create billing event' })
  @ApiResponse({ status: 201, description: 'Billing event created successfully' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  createBillingEvent(@Body() createBillingEventDto: CreateBillingEventDto) {
    return this.billingService.createBillingEvent(createBillingEventDto);
  }

  @Get('events/customer/:customerId')
  @ApiOperation({ summary: 'Get billing events for customer' })
  @ApiResponse({ status: 200, description: 'List of billing events' })
  findBillingEventsByCustomerId(@Param('customerId') customerId: string) {
    return this.billingService.findBillingEventsByCustomerId(customerId);
  }

  @Patch('events/:id/status')
  @ApiOperation({ summary: 'Update billing event status' })
  @ApiResponse({ status: 200, description: 'Billing event status updated' })
  @ApiResponse({ status: 400, description: 'Invalid status' })
  @ApiResponse({ status: 404, description: 'Billing event not found' })
  updateBillingEventStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.billingService.updateBillingEventStatus(id, status);
  }
}
