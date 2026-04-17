ALTER TABLE `pecas` DROP INDEX `pecas_codigo_unique`;--> statement-breakpoint
ALTER TABLE `pecas` ADD CONSTRAINT `pecas_tenant_codigo_unique` UNIQUE(`tenantId`,`codigo`);