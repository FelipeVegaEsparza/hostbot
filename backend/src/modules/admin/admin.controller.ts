import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { CreateSubscriptionAdminDto } from './dto/create-subscription-admin.dto';
import { UpdateSubscriptionAdminDto } from './dto/update-subscription-admin.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ============================================
  // User Management
  // ============================================

  @Get('users')
  @ApiOperation({ summary: 'Get all users (Admin only)' })
  @ApiResponse({ status: 200, description: 'List of all users' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getAllUsers(@Query() paginationDto: PaginationDto) {
    return this.adminService.getAllUsers(paginationDto);
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Get user by ID (Admin only)' })
  @ApiResponse({ status: 200, description: 'User details' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiParam({ name: 'id', description: 'User ID' })
  getUserById(@Param('id') id: string) {
    return this.adminService.getUserById(id);
  }

  @Patch('users/:id/role')
  @ApiOperation({ summary: 'Update user role (Admin only)' })
  @ApiResponse({ status: 200, description: 'User role updated successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions or cannot change own role' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiParam({ name: 'id', description: 'User ID' })
  updateUserRole(
    @Param('id') id: string,
    @Body() updateUserRoleDto: UpdateUserRoleDto,
    @Request() req,
  ) {
    return this.adminService.updateUserRole(id, updateUserRoleDto, req.user.id);
  }

  // ============================================
  // Customer Management
  // ============================================

  @Get('customers')
  @ApiOperation({ summary: 'Get all customers (Admin only)' })
  @ApiResponse({ status: 200, description: 'List of all customers' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getAllCustomers(@Query() paginationDto: PaginationDto) {
    return this.adminService.getAllCustomers(paginationDto);
  }

  @Get('customers/:id')
  @ApiOperation({ summary: 'Get customer by ID with stats (Admin only)' })
  @ApiResponse({ status: 200, description: 'Customer details with statistics' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  @ApiParam({ name: 'id', description: 'Customer ID' })
  getCustomerById(@Param('id') id: string) {
    return this.adminService.getCustomerById(id);
  }

  @Patch('customers/:id')
  @ApiOperation({ summary: 'Update customer (Admin only)' })
  @ApiResponse({ status: 200, description: 'Customer updated successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  @ApiParam({ name: 'id', description: 'Customer ID' })
  updateCustomer(@Param('id') id: string, @Body() data: { companyName?: string }) {
    return this.adminService.updateCustomer(id, data);
  }

  // ============================================
  // Subscription Management
  // ============================================

  @Post('subscriptions')
  @ApiOperation({ summary: 'Create subscription for any customer (Admin only)' })
  @ApiResponse({ status: 201, description: 'Subscription created successfully' })
  @ApiResponse({ status: 400, description: 'Customer already has a subscription' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Customer or plan not found' })
  createSubscription(@Body() createSubscriptionDto: CreateSubscriptionAdminDto) {
    return this.adminService.createSubscription(createSubscriptionDto);
  }

  @Get('subscriptions')
  @ApiOperation({ summary: 'Get all subscriptions (Admin only)' })
  @ApiResponse({ status: 200, description: 'List of all subscriptions' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getAllSubscriptions(@Query() paginationDto: PaginationDto) {
    return this.adminService.getAllSubscriptions(paginationDto);
  }

  @Patch('subscriptions/:id')
  @ApiOperation({ summary: 'Update subscription (Admin only)' })
  @ApiResponse({ status: 200, description: 'Subscription updated successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Subscription or plan not found' })
  @ApiParam({ name: 'id', description: 'Subscription ID' })
  updateSubscription(
    @Param('id') id: string,
    @Body() updateSubscriptionDto: UpdateSubscriptionAdminDto,
  ) {
    return this.adminService.updateSubscription(id, updateSubscriptionDto);
  }

  // ============================================
  // System Stats
  // ============================================

  @Get('stats')
  @ApiOperation({ summary: 'Get system-wide statistics (Admin only)' })
  @ApiResponse({ status: 200, description: 'System statistics' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  getSystemStats() {
    return this.adminService.getSystemStats();
  }
}
