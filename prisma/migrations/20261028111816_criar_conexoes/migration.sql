-- AlterTable
ALTER TABLE `usuario` ADD COLUMN `situacao` VARCHAR(20) NOT NULL DEFAULT 'PENDENTE';

-- CreateTable
CREATE TABLE `conexoes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `solicitanteId` INTEGER NOT NULL,
    `destinatarioId` INTEGER NOT NULL,
    `status` ENUM('PENDENTE', 'ACEITA', 'RECUSADA') NOT NULL DEFAULT 'PENDENTE',
    `dataCriacao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `dataAtualizacao` DATETIME(3) NOT NULL,

    INDEX `conexoes_solicitanteId_status_idx`(`solicitanteId`, `status`),
    INDEX `conexoes_destinatarioId_status_idx`(`destinatarioId`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `conexoes` ADD CONSTRAINT `conexoes_solicitanteId_fkey` FOREIGN KEY (`solicitanteId`) REFERENCES `Usuario`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `conexoes` ADD CONSTRAINT `conexoes_destinatarioId_fkey` FOREIGN KEY (`destinatarioId`) REFERENCES `Usuario`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
