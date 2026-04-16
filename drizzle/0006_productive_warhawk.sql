CREATE TABLE `revendedores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nome` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`whatsapp` varchar(20) NOT NULL,
	`cidade` varchar(100) NOT NULL,
	`estado` varchar(2) NOT NULL,
	`atuacao` enum('consultor_ti','revendedor_software','assistencia_tecnica','agencia_marketing','outro') NOT NULL,
	`mensagem` text,
	`status` enum('pendente','ativo','inativo') NOT NULL DEFAULT 'pendente',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `revendedores_id` PRIMARY KEY(`id`)
);
