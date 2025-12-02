-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,
    `role` ENUM('USER', 'ADMIN') NOT NULL DEFAULT 'USER',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    INDEX `User_email_idx`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Customer` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `companyName` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Customer_userId_key`(`userId`),
    INDEX `Customer_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Plan` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `price` DECIMAL(10, 2) NOT NULL,
    `currency` ENUM('USD', 'CLP') NOT NULL DEFAULT 'USD',
    `maxChatbots` INTEGER NOT NULL,
    `maxMessagesPerMonth` INTEGER NOT NULL,
    `aiProviders` JSON NOT NULL,
    `features` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Subscription` (
    `id` VARCHAR(191) NOT NULL,
    `customerId` VARCHAR(191) NOT NULL,
    `planId` VARCHAR(191) NOT NULL,
    `status` ENUM('ACTIVE', 'CANCELLED', 'EXPIRED', 'SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
    `currentPeriodStart` DATETIME(3) NOT NULL,
    `currentPeriodEnd` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Subscription_customerId_key`(`customerId`),
    INDEX `Subscription_customerId_idx`(`customerId`),
    INDEX `Subscription_planId_idx`(`planId`),
    INDEX `Subscription_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Invoice` (
    `id` VARCHAR(191) NOT NULL,
    `invoiceNumber` VARCHAR(191) NOT NULL,
    `customerId` VARCHAR(191) NOT NULL,
    `subscriptionId` VARCHAR(191) NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `currency` ENUM('USD', 'CLP') NOT NULL,
    `status` ENUM('PENDING', 'PAID', 'FAILED', 'REFUNDED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `paymentMethod` ENUM('CREDIT_CARD', 'DEBIT_CARD', 'PAYPAL', 'BANK_TRANSFER', 'WEBPAY', 'KHIPU') NOT NULL,
    `paymentProvider` VARCHAR(191) NOT NULL,
    `transactionId` VARCHAR(191) NULL,
    `pdfUrl` TEXT NULL,
    `dueDate` DATETIME(3) NOT NULL,
    `paidAt` DATETIME(3) NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Invoice_invoiceNumber_key`(`invoiceNumber`),
    INDEX `Invoice_customerId_idx`(`customerId`),
    INDEX `Invoice_invoiceNumber_idx`(`invoiceNumber`),
    INDEX `Invoice_status_idx`(`status`),
    INDEX `Invoice_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PaymentMethodStored` (
    `id` VARCHAR(191) NOT NULL,
    `customerId` VARCHAR(191) NOT NULL,
    `type` ENUM('CREDIT_CARD', 'DEBIT_CARD', 'PAYPAL', 'BANK_TRANSFER', 'WEBPAY', 'KHIPU') NOT NULL,
    `provider` VARCHAR(191) NOT NULL,
    `providerCustomerId` VARCHAR(191) NULL,
    `last4` VARCHAR(191) NULL,
    `brand` VARCHAR(191) NULL,
    `expiryMonth` INTEGER NULL,
    `expiryYear` INTEGER NULL,
    `isDefault` BOOLEAN NOT NULL DEFAULT false,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `PaymentMethodStored_customerId_idx`(`customerId`),
    INDEX `PaymentMethodStored_provider_idx`(`provider`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PaymentTransaction` (
    `id` VARCHAR(191) NOT NULL,
    `customerId` VARCHAR(191) NOT NULL,
    `invoiceId` VARCHAR(191) NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `currency` ENUM('USD', 'CLP') NOT NULL,
    `status` ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED', 'CANCELLED') NOT NULL,
    `provider` VARCHAR(191) NOT NULL,
    `providerTransactionId` VARCHAR(191) NULL,
    `paymentMethod` ENUM('CREDIT_CARD', 'DEBIT_CARD', 'PAYPAL', 'BANK_TRANSFER', 'WEBPAY', 'KHIPU') NOT NULL,
    `errorMessage` TEXT NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `PaymentTransaction_customerId_idx`(`customerId`),
    INDEX `PaymentTransaction_invoiceId_idx`(`invoiceId`),
    INDEX `PaymentTransaction_provider_idx`(`provider`),
    INDEX `PaymentTransaction_status_idx`(`status`),
    INDEX `PaymentTransaction_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ExchangeRate` (
    `id` VARCHAR(191) NOT NULL,
    `fromCurrency` ENUM('USD', 'CLP') NOT NULL,
    `toCurrency` ENUM('USD', 'CLP') NOT NULL,
    `rate` DECIMAL(10, 6) NOT NULL,
    `source` VARCHAR(191) NOT NULL,
    `validUntil` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ExchangeRate_fromCurrency_toCurrency_idx`(`fromCurrency`, `toCurrency`),
    INDEX `ExchangeRate_validUntil_idx`(`validUntil`),
    UNIQUE INDEX `ExchangeRate_fromCurrency_toCurrency_createdAt_key`(`fromCurrency`, `toCurrency`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SubscriptionHistory` (
    `id` VARCHAR(191) NOT NULL,
    `customerId` VARCHAR(191) NOT NULL,
    `subscriptionId` VARCHAR(191) NOT NULL,
    `planId` VARCHAR(191) NOT NULL,
    `action` ENUM('CREATED', 'UPGRADED', 'DOWNGRADED', 'RENEWED', 'CANCELLED', 'SUSPENDED', 'REACTIVATED') NOT NULL,
    `previousPlanId` VARCHAR(191) NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `SubscriptionHistory_customerId_idx`(`customerId`),
    INDEX `SubscriptionHistory_subscriptionId_idx`(`subscriptionId`),
    INDEX `SubscriptionHistory_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PaymentWebhookLog` (
    `id` VARCHAR(191) NOT NULL,
    `provider` VARCHAR(191) NOT NULL,
    `event` VARCHAR(191) NOT NULL,
    `payload` JSON NOT NULL,
    `signature` TEXT NULL,
    `isValid` BOOLEAN NOT NULL,
    `processed` BOOLEAN NOT NULL DEFAULT false,
    `processedAt` DATETIME(3) NULL,
    `errorMessage` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `PaymentWebhookLog_provider_idx`(`provider`),
    INDEX `PaymentWebhookLog_processed_idx`(`processed`),
    INDEX `PaymentWebhookLog_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Chatbot` (
    `id` VARCHAR(191) NOT NULL,
    `customerId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `aiProvider` VARCHAR(191) NOT NULL,
    `aiModel` VARCHAR(191) NOT NULL,
    `aiConfig` JSON NOT NULL,
    `systemPrompt` TEXT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `knowledgeBaseId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Chatbot_customerId_idx`(`customerId`),
    INDEX `Chatbot_knowledgeBaseId_idx`(`knowledgeBaseId`),
    INDEX `Chatbot_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WidgetSettings` (
    `id` VARCHAR(191) NOT NULL,
    `chatbotId` VARCHAR(191) NOT NULL,
    `theme` VARCHAR(191) NOT NULL DEFAULT 'light',
    `primaryColor` VARCHAR(191) NOT NULL DEFAULT '#3B82F6',
    `position` VARCHAR(191) NOT NULL DEFAULT 'bottom-right',
    `welcomeMessage` TEXT NULL,
    `placeholder` VARCHAR(191) NOT NULL DEFAULT 'Type a message...',
    `customCss` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `WidgetSettings_chatbotId_key`(`chatbotId`),
    INDEX `WidgetSettings_chatbotId_idx`(`chatbotId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Conversation` (
    `id` VARCHAR(191) NOT NULL,
    `chatbotId` VARCHAR(191) NOT NULL,
    `externalUserId` VARCHAR(191) NOT NULL,
    `channel` ENUM('WIDGET', 'WHATSAPP_CLOUD', 'WHATSAPP_QR') NOT NULL,
    `status` ENUM('ACTIVE', 'CLOSED', 'ARCHIVED') NOT NULL DEFAULT 'ACTIVE',
    `lastMessageAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Conversation_chatbotId_idx`(`chatbotId`),
    INDEX `Conversation_externalUserId_idx`(`externalUserId`),
    INDEX `Conversation_lastMessageAt_idx`(`lastMessageAt`),
    INDEX `Conversation_channel_idx`(`channel`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Message` (
    `id` VARCHAR(191) NOT NULL,
    `conversationId` VARCHAR(191) NOT NULL,
    `content` TEXT NOT NULL,
    `role` ENUM('USER', 'ASSISTANT', 'SYSTEM') NOT NULL,
    `metadata` JSON NULL,
    `deliveryStatus` ENUM('PENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Message_conversationId_idx`(`conversationId`),
    INDEX `Message_createdAt_idx`(`createdAt`),
    INDEX `Message_role_idx`(`role`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `KnowledgeBase` (
    `id` VARCHAR(191) NOT NULL,
    `customerId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `KnowledgeBase_customerId_idx`(`customerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `KnowledgeItem` (
    `id` VARCHAR(191) NOT NULL,
    `knowledgeBaseId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `content` TEXT NOT NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `KnowledgeItem_knowledgeBaseId_idx`(`knowledgeBaseId`),
    FULLTEXT INDEX `KnowledgeItem_title_content_idx`(`title`, `content`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WhatsAppCloudAccount` (
    `id` VARCHAR(191) NOT NULL,
    `chatbotId` VARCHAR(191) NOT NULL,
    `phoneNumberId` VARCHAR(191) NOT NULL,
    `accessToken` TEXT NOT NULL,
    `webhookVerifyToken` VARCHAR(191) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `WhatsAppCloudAccount_chatbotId_key`(`chatbotId`),
    INDEX `WhatsAppCloudAccount_chatbotId_idx`(`chatbotId`),
    INDEX `WhatsAppCloudAccount_phoneNumberId_idx`(`phoneNumberId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WhatsAppQRSession` (
    `id` VARCHAR(191) NOT NULL,
    `chatbotId` VARCHAR(191) NOT NULL,
    `sessionId` VARCHAR(191) NOT NULL,
    `status` ENUM('DISCONNECTED', 'CONNECTING', 'QR_READY', 'CONNECTED') NOT NULL DEFAULT 'DISCONNECTED',
    `qrCode` TEXT NULL,
    `lastConnectedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `WhatsAppQRSession_chatbotId_key`(`chatbotId`),
    UNIQUE INDEX `WhatsAppQRSession_sessionId_key`(`sessionId`),
    INDEX `WhatsAppQRSession_chatbotId_idx`(`chatbotId`),
    INDEX `WhatsAppQRSession_sessionId_idx`(`sessionId`),
    INDEX `WhatsAppQRSession_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WebhookEvent` (
    `id` VARCHAR(191) NOT NULL,
    `url` VARCHAR(191) NOT NULL,
    `event` VARCHAR(191) NOT NULL,
    `payload` JSON NOT NULL,
    `status` ENUM('PENDING', 'SENT', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `attempts` INTEGER NOT NULL DEFAULT 0,
    `lastError` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `processedAt` DATETIME(3) NULL,

    INDEX `WebhookEvent_status_idx`(`status`),
    INDEX `WebhookEvent_createdAt_idx`(`createdAt`),
    INDEX `WebhookEvent_event_idx`(`event`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `APIKey` (
    `id` VARCHAR(191) NOT NULL,
    `customerId` VARCHAR(191) NOT NULL,
    `key` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `permissions` JSON NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `lastUsedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `APIKey_key_key`(`key`),
    INDEX `APIKey_customerId_idx`(`customerId`),
    INDEX `APIKey_key_idx`(`key`),
    INDEX `APIKey_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AIProviderConfig` (
    `id` VARCHAR(191) NOT NULL,
    `provider` VARCHAR(191) NOT NULL,
    `apiKey` TEXT NOT NULL,
    `baseUrl` VARCHAR(191) NULL,
    `config` JSON NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `AIProviderConfig_provider_idx`(`provider`),
    INDEX `AIProviderConfig_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UsageLog` (
    `id` VARCHAR(191) NOT NULL,
    `customerId` VARCHAR(191) NOT NULL,
    `type` ENUM('MESSAGE', 'AI_REQUEST', 'WHATSAPP_MESSAGE') NOT NULL,
    `quantity` INTEGER NOT NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `UsageLog_customerId_idx`(`customerId`),
    INDEX `UsageLog_createdAt_idx`(`createdAt`),
    INDEX `UsageLog_type_idx`(`type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BillingEvent` (
    `id` VARCHAR(191) NOT NULL,
    `customerId` VARCHAR(191) NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'COMPLETED', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `BillingEvent_customerId_idx`(`customerId`),
    INDEX `BillingEvent_createdAt_idx`(`createdAt`),
    INDEX `BillingEvent_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Customer` ADD CONSTRAINT `Customer_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Subscription` ADD CONSTRAINT `Subscription_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Subscription` ADD CONSTRAINT `Subscription_planId_fkey` FOREIGN KEY (`planId`) REFERENCES `Plan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Chatbot` ADD CONSTRAINT `Chatbot_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Chatbot` ADD CONSTRAINT `Chatbot_knowledgeBaseId_fkey` FOREIGN KEY (`knowledgeBaseId`) REFERENCES `KnowledgeBase`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WidgetSettings` ADD CONSTRAINT `WidgetSettings_chatbotId_fkey` FOREIGN KEY (`chatbotId`) REFERENCES `Chatbot`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Conversation` ADD CONSTRAINT `Conversation_chatbotId_fkey` FOREIGN KEY (`chatbotId`) REFERENCES `Chatbot`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Message` ADD CONSTRAINT `Message_conversationId_fkey` FOREIGN KEY (`conversationId`) REFERENCES `Conversation`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `KnowledgeBase` ADD CONSTRAINT `KnowledgeBase_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `KnowledgeItem` ADD CONSTRAINT `KnowledgeItem_knowledgeBaseId_fkey` FOREIGN KEY (`knowledgeBaseId`) REFERENCES `KnowledgeBase`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WhatsAppCloudAccount` ADD CONSTRAINT `WhatsAppCloudAccount_chatbotId_fkey` FOREIGN KEY (`chatbotId`) REFERENCES `Chatbot`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WhatsAppQRSession` ADD CONSTRAINT `WhatsAppQRSession_chatbotId_fkey` FOREIGN KEY (`chatbotId`) REFERENCES `Chatbot`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `APIKey` ADD CONSTRAINT `APIKey_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UsageLog` ADD CONSTRAINT `UsageLog_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
