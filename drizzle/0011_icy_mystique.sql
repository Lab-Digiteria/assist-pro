CREATE TABLE `bankAccounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`name` varchar(200) NOT NULL,
	`type` enum('checking','savings','cash','digital') NOT NULL,
	`bankName` varchar(100),
	`agency` varchar(20),
	`accountNumber` varchar(30),
	`initialBalance` decimal(12,2) NOT NULL DEFAULT '0.00',
	`currentBalance` decimal(12,2) NOT NULL DEFAULT '0.00',
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bankAccounts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `chartOfAccounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`code` varchar(20) NOT NULL,
	`name` varchar(200) NOT NULL,
	`type` enum('receita','custo','despesa') NOT NULL,
	`parentId` int,
	`isActive` boolean NOT NULL DEFAULT true,
	`isSystem` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `chartOfAccounts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payables` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`description` varchar(500) NOT NULL,
	`amount` decimal(12,2) NOT NULL,
	`dueDate` varchar(10) NOT NULL,
	`paidDate` varchar(10),
	`status` enum('pending','paid','overdue','cancelled') NOT NULL DEFAULT 'pending',
	`paymentMethod` enum('dinheiro','pix','debito','credito','boleto','outros'),
	`bankAccountId` int,
	`chartOfAccountId` int,
	`supplierName` varchar(200),
	`documentNumber` varchar(100),
	`isRecurring` boolean NOT NULL DEFAULT false,
	`recurrenceConfig` json,
	`notes` text,
	`parentPayableId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payables_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `receivables` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`description` varchar(500) NOT NULL,
	`amount` decimal(12,2) NOT NULL,
	`dueDate` varchar(10) NOT NULL,
	`receivedDate` varchar(10),
	`status` enum('pending','received','overdue','cancelled') NOT NULL DEFAULT 'pending',
	`paymentMethod` enum('dinheiro','pix','debito','credito','boleto','outros'),
	`bankAccountId` int,
	`chartOfAccountId` int,
	`serviceOrderId` int,
	`customerId` int,
	`installmentGroup` varchar(36),
	`installmentNumber` int NOT NULL DEFAULT 1,
	`installmentTotal` int NOT NULL DEFAULT 1,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `receivables_id` PRIMARY KEY(`id`)
);
