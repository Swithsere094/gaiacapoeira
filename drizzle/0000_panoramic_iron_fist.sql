CREATE TABLE `articles` (
	`id` char(36) NOT NULL,
	`title` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`excerpt` text,
	`content` text NOT NULL,
	`cover_image_url` text,
	`category` varchar(255) NOT NULL,
	`tags` json,
	`published` boolean NOT NULL DEFAULT false,
	`user_id` char(36),
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `articles_id` PRIMARY KEY(`id`),
	CONSTRAINT `articles_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `cantorias` (
	`id` char(36) NOT NULL,
	`title` varchar(255) NOT NULL,
	`video_url` text,
	`description` text,
	`event_date` date,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `cantorias_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `comments` (
	`id` char(36) NOT NULL,
	`content` text NOT NULL,
	`user_id` char(36) NOT NULL,
	`roda_id` char(36),
	`article_id` char(36),
	`song_id` char(36),
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `comments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `favorites` (
	`id` char(36) NOT NULL,
	`user_id` char(36) NOT NULL,
	`roda_id` char(36),
	`movement_id` char(36),
	`article_id` char(36),
	`song_id` char(36),
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `favorites_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `movements` (
	`id` char(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`portuguese_name` varchar(255),
	`description` text,
	`video_url` text,
	`thumbnail_url` text,
	`category` varchar(255) NOT NULL,
	`difficulty` varchar(100) NOT NULL,
	`tips` json,
	`related_movements` json,
	`user_id` char(36),
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `movements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `politica` (
	`id` char(36) NOT NULL,
	`title` varchar(255) NOT NULL,
	`content` text,
	`category` varchar(255),
	`file_url` text,
	`file_name` varchar(255),
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `politica_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `portuguese_lessons` (
	`id` char(36) NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`content` text NOT NULL,
	`level` varchar(100) NOT NULL,
	`category` varchar(255) NOT NULL,
	`order_index` int NOT NULL DEFAULT 0,
	`user_id` char(36),
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `portuguese_lessons_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `portuguese_vocabulary` (
	`id` char(36) NOT NULL,
	`lesson_id` char(36),
	`word` varchar(255) NOT NULL,
	`translation` varchar(255) NOT NULL,
	`pronunciation` varchar(255),
	`example_sentence` text,
	`example_translation` text,
	`audio_url` text,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `portuguese_vocabulary_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rodas` (
	`id` char(36) NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`video_url` text NOT NULL,
	`thumbnail_url` text,
	`location` varchar(255),
	`event_date` date,
	`duration` int,
	`participants` json,
	`tags` json,
	`views` int NOT NULL DEFAULT 0,
	`user_id` char(36),
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `rodas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `songs` (
	`id` char(36) NOT NULL,
	`title` varchar(255) NOT NULL,
	`type` varchar(100) NOT NULL,
	`lyrics` text NOT NULL,
	`translation` text,
	`context` text,
	`video_url` text,
	`audio_url` text,
	`mestre` varchar(255),
	`tags` json,
	`user_id` char(36),
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `songs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_lesson_progress` (
	`id` char(36) NOT NULL,
	`user_id` char(36) NOT NULL,
	`lesson_id` char(36) NOT NULL,
	`completed` boolean NOT NULL DEFAULT false,
	`score` int,
	`completed_at` datetime,
	CONSTRAINT `user_lesson_progress_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `usuarios` (
	`id` char(36) NOT NULL,
	`username` varchar(255) NOT NULL,
	`password_hash` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(255),
	`role` enum('admin','member') NOT NULL DEFAULT 'member',
	`apodo` varchar(255),
	`avatar` text,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `usuarios_id` PRIMARY KEY(`id`),
	CONSTRAINT `usuarios_username_unique` UNIQUE(`username`)
);
--> statement-breakpoint
ALTER TABLE `articles` ADD CONSTRAINT `articles_user_id_usuarios_id_fk` FOREIGN KEY (`user_id`) REFERENCES `usuarios`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `comments` ADD CONSTRAINT `comments_user_id_usuarios_id_fk` FOREIGN KEY (`user_id`) REFERENCES `usuarios`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `comments` ADD CONSTRAINT `comments_roda_id_rodas_id_fk` FOREIGN KEY (`roda_id`) REFERENCES `rodas`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `comments` ADD CONSTRAINT `comments_article_id_articles_id_fk` FOREIGN KEY (`article_id`) REFERENCES `articles`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `comments` ADD CONSTRAINT `comments_song_id_songs_id_fk` FOREIGN KEY (`song_id`) REFERENCES `songs`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `favorites` ADD CONSTRAINT `favorites_user_id_usuarios_id_fk` FOREIGN KEY (`user_id`) REFERENCES `usuarios`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `favorites` ADD CONSTRAINT `favorites_roda_id_rodas_id_fk` FOREIGN KEY (`roda_id`) REFERENCES `rodas`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `favorites` ADD CONSTRAINT `favorites_movement_id_movements_id_fk` FOREIGN KEY (`movement_id`) REFERENCES `movements`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `favorites` ADD CONSTRAINT `favorites_article_id_articles_id_fk` FOREIGN KEY (`article_id`) REFERENCES `articles`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `favorites` ADD CONSTRAINT `favorites_song_id_songs_id_fk` FOREIGN KEY (`song_id`) REFERENCES `songs`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `movements` ADD CONSTRAINT `movements_user_id_usuarios_id_fk` FOREIGN KEY (`user_id`) REFERENCES `usuarios`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `portuguese_lessons` ADD CONSTRAINT `portuguese_lessons_user_id_usuarios_id_fk` FOREIGN KEY (`user_id`) REFERENCES `usuarios`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `portuguese_vocabulary` ADD CONSTRAINT `portuguese_vocabulary_lesson_id_portuguese_lessons_id_fk` FOREIGN KEY (`lesson_id`) REFERENCES `portuguese_lessons`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `rodas` ADD CONSTRAINT `rodas_user_id_usuarios_id_fk` FOREIGN KEY (`user_id`) REFERENCES `usuarios`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `songs` ADD CONSTRAINT `songs_user_id_usuarios_id_fk` FOREIGN KEY (`user_id`) REFERENCES `usuarios`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_lesson_progress` ADD CONSTRAINT `user_lesson_progress_user_id_usuarios_id_fk` FOREIGN KEY (`user_id`) REFERENCES `usuarios`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_lesson_progress` ADD CONSTRAINT `user_lesson_progress_lesson_id_portuguese_lessons_id_fk` FOREIGN KEY (`lesson_id`) REFERENCES `portuguese_lessons`(`id`) ON DELETE cascade ON UPDATE no action;