ALTER TABLE `tenants` ADD `freeAccessEnabled` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `tenants` ADD `freeAccessGrantedAt` timestamp;--> statement-breakpoint
ALTER TABLE `tenants` ADD `freeAccessExpiresAt` timestamp;--> statement-breakpoint
ALTER TABLE `tenants` ADD `freeAccessGrantedBy` int;--> statement-breakpoint
ALTER TABLE `tenants` ADD `freeAccessNote` varchar(500);