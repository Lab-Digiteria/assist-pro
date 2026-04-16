CREATE TABLE `listaCompras` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`pecaId` int,
	`itemDescription` varchar(500) NOT NULL,
	`quantityNeeded` int NOT NULL DEFAULT 1,
	`reason` enum('os_demand','stock_replenishment','other') NOT NULL DEFAULT 'stock_replenishment',
	`serviceOrderId` int,
	`priority` enum('low','medium','high') NOT NULL DEFAULT 'medium',
	`status` enum('pending','ordered','received') NOT NULL DEFAULT 'pending',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `listaCompras_id` PRIMARY KEY(`id`)
);
