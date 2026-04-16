CREATE TABLE `referralConversions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`revendedorId` int NOT NULL,
	`tenantId` int NOT NULL,
	`status` enum('pending','confirmed','cancelled') NOT NULL DEFAULT 'pending',
	`planName` varchar(100),
	`planValue` decimal(10,2),
	`commissionRate` decimal(5,2) NOT NULL DEFAULT '20.00',
	`commissionValue` decimal(10,2),
	`stripePaymentIntentId` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`confirmedAt` timestamp,
	CONSTRAINT `referralConversions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `revendedorCommissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`revendedorId` int NOT NULL,
	`periodoMes` int NOT NULL,
	`periodoAno` int NOT NULL,
	`totalConversions` int NOT NULL DEFAULT 0,
	`totalValue` decimal(10,2) NOT NULL DEFAULT '0.00',
	`status` enum('pending','paid') NOT NULL DEFAULT 'pending',
	`paidAt` timestamp,
	`observacoes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `revendedorCommissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `revendedores` ADD `referralCode` varchar(12);--> statement-breakpoint
ALTER TABLE `revendedores` ADD `referralPassword` varchar(255);--> statement-breakpoint
ALTER TABLE `revendedores` ADD `commissionRate` decimal(5,2) DEFAULT '20.00' NOT NULL;--> statement-breakpoint
ALTER TABLE `revendedores` ADD `totalClicks` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `revendedores` ADD CONSTRAINT `revendedores_referralCode_unique` UNIQUE(`referralCode`);