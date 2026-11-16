ALTER TABLE `Usuario` ADD COLUMN `admin` BOOLEAN NOT NULL DEFAULT false;
CREATE TABLE `analises_cadastro` (
 `id` INTEGER NOT NULL AUTO_INCREMENT,
 `usuarioId` INTEGER NOT NULL,
 `adminId` INTEGER NOT NULL,
 `situacao` VARCHAR(20) NOT NULL,
 `motivo` VARCHAR(1000) NULL,
 `dataCriacao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 INDEX `analises_cadastro_usuarioId_id_idx` (`usuarioId`, `id`),
 PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `analises_cadastro` ADD CONSTRAINT `analises_cadastro_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `Usuario`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `analises_cadastro` ADD CONSTRAINT `analises_cadastro_adminId_fkey` FOREIGN KEY (`adminId`) REFERENCES `Usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
