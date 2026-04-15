CREATE TABLE `billingEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventId` varchar(36) NOT NULL,
	`eventType` varchar(100) NOT NULL,
	`tenantId` int NOT NULL,
	`payload` json,
	`idempotencyKey` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `billingEvents_id` PRIMARY KEY(`id`),
	CONSTRAINT `billingEvents_eventId_unique` UNIQUE(`eventId`)
);
--> statement-breakpoint
CREATE TABLE `plans` (
	`id` varchar(36) NOT NULL,
	`name` varchar(100) NOT NULL,
	`slug` varchar(50) NOT NULL,
	`priceMonthly` int NOT NULL,
	`trialDays` int NOT NULL DEFAULT 14,
	`stripePriceId` varchar(100),
	`isLifetime` boolean NOT NULL DEFAULT false,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `plans_id` PRIMARY KEY(`id`),
	CONSTRAINT `plans_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` varchar(36) NOT NULL,
	`tenantId` int NOT NULL,
	`planId` varchar(36) NOT NULL,
	`status` enum('trialing','active','past_due','suspended','canceled','expired') NOT NULL DEFAULT 'trialing',
	`trialEndsAt` timestamp,
	`currentPeriodStartsAt` timestamp,
	`currentPeriodEndsAt` timestamp,
	`canceledAt` timestamp,
	`stripeSubscriptionId` varchar(255),
	`stripeCustomerId` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscriptions_id` PRIMARY KEY(`id`),
	CONSTRAINT `subscriptions_tenantId_unique` UNIQUE(`tenantId`)
);
--> statement-breakpoint
CREATE TABLE `userPasswords` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`passwordHash` varchar(255) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userPasswords_id` PRIMARY KEY(`id`),
	CONSTRAINT `userPasswords_userId_unique` UNIQUE(`userId`)
);
