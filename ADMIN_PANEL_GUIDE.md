# Admin Panel Guide

## Overview

The Admin Panel is a comprehensive system administration interface that allows administrators to manage users, customers, plans, and subscriptions.

## Getting Started

### Initial Setup

1. **Run the seed script** to create the admin user and default plans:
   ```bash
   cd backend
   npm run seed
   ```

2. **Default Admin Credentials:**
   - Email: `admin@chatbot.com`
   - Password: `Admin123!`
   - ⚠️ **IMPORTANT:** Change this password immediately after first login!

3. **Default Plans Created:**
   - **Free**: $0/month - 1 chatbot, 100 messages/month
   - **Pro**: $29.99/month - 5 chatbots, 10,000 messages/month
   - **Enterprise**: $99.99/month - Unlimited chatbots and messages

## Accessing the Admin Panel

1. Login with admin credentials at `/login`
2. Navigate to `/dashboard/admin` or click "Admin Panel" in the sidebar
3. The admin panel link is only visible to users with ADMIN role

## Features

### 1. Overview/Stats Page (`/dashboard/admin`)

Displays system-wide statistics:
- Total users, customers, subscriptions
- Active vs inactive chatbots
- Recent user registrations
- Subscription status breakdown

### 2. User Management (`/dashboard/admin/users`)

**Features:**
- View all users with pagination
- See user roles (USER or ADMIN)
- Change user roles with one click
- Search and filter users
- View associated customer information

**How to change a user's role:**
1. Navigate to Users page
2. Click "Change to ADMIN" or "Change to USER" button
3. Confirm the action
4. Role is updated immediately

**Note:** Users cannot change their own role (security feature)

### 3. Customer Management (`/dashboard/admin/customers`)

**Features:**
- View all customers with pagination
- See subscription status and plan
- View chatbot count per customer
- Search by company name, email, or user name
- Click "View Details" for comprehensive customer information

**Customer Details Page:**
- Company and user information
- Current subscription details
- Usage statistics (chatbots, messages)
- List of all chatbots

### 4. Plan Management (`/dashboard/admin/plans`)

**Features:**
- View all available plans in card format
- Create new plans
- Edit existing plans
- Delete plans (only if no active subscriptions)

**How to create a plan:**
1. Click "Create Plan" button
2. Fill in the form:
   - Plan Name (e.g., "Starter")
   - Price (e.g., 19.99)
   - Currency (USD or CLP)
   - Max Chatbots (-1 for unlimited)
   - Max Messages/Month (-1 for unlimited)
   - AI Providers (comma-separated: openai, anthropic, groq)
   - Features (JSON format)
3. Click "Create Plan"

**Example Features JSON:**
```json
{
  "support": "email",
  "knowledgeBase": true,
  "whatsappIntegration": true,
  "customBranding": false
}
```

### 5. Subscription Management (`/dashboard/admin/subscriptions`)

**Features:**
- View all subscriptions with pagination
- See customer, plan, status, and period
- Create new subscriptions for customers
- Change subscription status (ACTIVE, SUSPENDED, CANCELLED, EXPIRED)

**How to create a subscription:**
1. Click "Create Subscription" button
2. Select a customer from the dropdown
3. Select a plan
4. Click "Create Subscription"
5. Subscription is created with 30-day period

**How to change subscription status:**
1. Use the dropdown in the Actions column
2. Select new status
3. Confirm the change

## API Endpoints

### Admin Endpoints (Require ADMIN role)

**Users:**
- `GET /admin/users` - List all users
- `GET /admin/users/:id` - Get user details
- `PATCH /admin/users/:id/role` - Update user role

**Customers:**
- `GET /admin/customers` - List all customers
- `GET /admin/customers/:id` - Get customer details with stats
- `PATCH /admin/customers/:id` - Update customer info

**Subscriptions:**
- `GET /admin/subscriptions` - List all subscriptions
- `POST /admin/subscriptions` - Create subscription
- `PATCH /admin/subscriptions/:id` - Update subscription

**Plans (Protected):**
- `POST /billing/plans` - Create plan
- `PATCH /billing/plans/:id` - Update plan
- `DELETE /billing/plans/:id` - Delete plan

**Stats:**
- `GET /admin/stats` - Get system-wide statistics

## Security Features

1. **Role-Based Access Control (RBAC)**
   - All admin endpoints require ADMIN role
   - RolesGuard validates JWT token role
   - 403 Forbidden returned for unauthorized access

2. **Self-Role-Change Prevention**
   - Users cannot change their own role
   - Prevents accidental privilege loss

3. **Frontend Protection**
   - Admin routes redirect non-admin users
   - Admin navigation only visible to admins
   - AuthContext validates role on every request

## Common Tasks

### Creating a Subscription for a New User

1. User registers and creates account
2. Admin logs in to admin panel
3. Navigate to Subscriptions page
4. Click "Create Subscription"
5. Select the user's customer account
6. Select appropriate plan
7. Create subscription
8. User can now create chatbots

### Upgrading a Customer's Plan

1. Navigate to Subscriptions page
2. Find the customer's subscription
3. Note the subscription ID
4. Use the status dropdown or create new subscription
5. Customer immediately has access to new limits

### Handling Subscription Issues

**Customer can't create chatbots:**
1. Check if customer has active subscription
2. Navigate to Customers page
3. Search for customer
4. View details to see subscription status
5. If no subscription, create one
6. If subscription is SUSPENDED/CANCELLED, change status to ACTIVE

## Environment Variables

Optional environment variables for seed script:

```env
ADMIN_EMAIL=admin@chatbot.com
ADMIN_PASSWORD=Admin123!
```

## Troubleshooting

### "No active subscription found" error

**Problem:** User trying to create chatbot gets 403 error

**Solution:**
1. Login as admin
2. Navigate to Subscriptions
3. Create subscription for the customer
4. User can now create chatbots

### Admin panel not visible

**Problem:** Admin link not showing in navigation

**Solution:**
1. Verify user has ADMIN role in database
2. Check JWT token includes role field
3. Logout and login again to refresh token

### Cannot change user role

**Problem:** "You cannot change your own role" error

**Solution:** This is a security feature. Ask another admin to change your role.

## Best Practices

1. **Change default admin password immediately**
2. **Create plans before creating subscriptions**
3. **Regularly review subscription statuses**
4. **Monitor system stats for unusual activity**
5. **Keep at least one ADMIN user at all times**
6. **Document custom plan features in JSON format**

## Support

For issues or questions:
1. Check this documentation
2. Review the spec files in `.kiro/specs/admin-panel/`
3. Check backend logs for API errors
4. Verify database state with Prisma Studio: `npm run prisma:studio`
