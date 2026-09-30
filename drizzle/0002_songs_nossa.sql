ALTER TABLE `songs` ADD `nossa` boolean DEFAULT false NOT NULL;--> statement-breakpoint
-- Marcado inicial (agregado a mano): canciones cuyo autor es el grupo o un
-- integrante conocido. El resto se marca desde la UI.
UPDATE `songs` SET `nossa` = true WHERE LOWER(`mestre`) LIKE '%gaia%' OR LOWER(`mestre`) LIKE '%candeia%';
