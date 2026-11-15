-- AlterTable
ALTER TABLE `Usuario` ADD COLUMN `disponibilidade` VARCHAR(20) NULL,
    ADD COLUMN `fonteAmpliada` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `localizacao` VARCHAR(2) NULL,
    ADD COLUMN `mensagensPublicas` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `nivel` VARCHAR(20) NULL,
    ADD COLUMN `perfilPublico` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `tema` VARCHAR(10) NOT NULL DEFAULT 'escuro';

-- CreateTable
CREATE TABLE `habilidades` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `usuarioId` INTEGER NOT NULL,
    `nome` VARCHAR(30) NOT NULL,

    UNIQUE INDEX `habilidades_usuarioId_nome_key`(`usuarioId`, `nome`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mensagens` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `remetenteId` INTEGER NOT NULL,
    `destinatarioId` INTEGER NOT NULL,
    `texto` TEXT NOT NULL,
    `dataCriacao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `lidaEm` DATETIME(3) NULL,

    INDEX `mensagens_remetenteId_destinatarioId_id_idx`(`remetenteId`, `destinatarioId`, `id`),
    INDEX `mensagens_destinatarioId_lidaEm_id_idx`(`destinatarioId`, `lidaEm`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notificacoes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `usuarioId` INTEGER NOT NULL,
    `atorId` INTEGER NOT NULL,
    `tipo` VARCHAR(30) NOT NULL,
    `dataCriacao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `lidaEm` DATETIME(3) NULL,

    INDEX `notificacoes_usuarioId_lidaEm_id_idx`(`usuarioId`, `lidaEm`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `visitas_perfil` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `usuarioId` INTEGER NOT NULL,
    `visitanteId` INTEGER NOT NULL,
    `dataAtualizacao` DATETIME(3) NOT NULL,

    UNIQUE INDEX `visitas_perfil_usuarioId_visitanteId_key`(`usuarioId`, `visitanteId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `habilidades` ADD CONSTRAINT `habilidades_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `Usuario`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mensagens` ADD CONSTRAINT `mensagens_remetenteId_fkey` FOREIGN KEY (`remetenteId`) REFERENCES `Usuario`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mensagens` ADD CONSTRAINT `mensagens_destinatarioId_fkey` FOREIGN KEY (`destinatarioId`) REFERENCES `Usuario`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notificacoes` ADD CONSTRAINT `notificacoes_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `Usuario`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notificacoes` ADD CONSTRAINT `notificacoes_atorId_fkey` FOREIGN KEY (`atorId`) REFERENCES `Usuario`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `visitas_perfil` ADD CONSTRAINT `visitas_perfil_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `Usuario`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `visitas_perfil` ADD CONSTRAINT `visitas_perfil_visitanteId_fkey` FOREIGN KEY (`visitanteId`) REFERENCES `Usuario`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
