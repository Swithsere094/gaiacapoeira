CREATE TABLE `page_views` (
	`id` char(36) NOT NULL,
	`path` varchar(500) NOT NULL,
	`user_id` char(36),
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `page_views_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `page_views` ADD CONSTRAINT `page_views_user_id_usuarios_id_fk` FOREIGN KEY (`user_id`) REFERENCES `usuarios`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `page_views_path_idx` ON `page_views` (`path`);--> statement-breakpoint
CREATE INDEX `page_views_created_at_idx` ON `page_views` (`created_at`);