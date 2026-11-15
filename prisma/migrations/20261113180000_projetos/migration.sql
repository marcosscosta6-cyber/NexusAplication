-- AlterTable
ALTER TABLE `notificacoes` ADD COLUMN `projetoId` INTEGER NULL;

-- CreateTable
CREATE TABLE `projetos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `proprietarioId` INTEGER NOT NULL,
    `nome` VARCHAR(120) NOT NULL,
    `descricao` TEXT NOT NULL,
    `publico` BOOLEAN NOT NULL DEFAULT true,
    `status` VARCHAR(20) NOT NULL DEFAULT 'ATIVO',
    `tags` JSON NOT NULL,
    `dataCriacao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `dataAtualizacao` DATETIME(3) NOT NULL,

    INDEX `projetos_proprietarioId_status_idx`(`proprietarioId`, `status`),
    INDEX `projetos_publico_dataAtualizacao_idx`(`publico`, `dataAtualizacao`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `participacoes_projeto` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `projetoId` INTEGER NOT NULL,
    `usuarioId` INTEGER NOT NULL,
    `aceita` BOOLEAN NOT NULL DEFAULT false,
    `dataCriacao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `participacoes_projeto_usuarioId_aceita_idx`(`usuarioId`, `aceita`),
    UNIQUE INDEX `participacoes_projeto_projetoId_usuarioId_key`(`projetoId`, `usuarioId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `etapas_projeto` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `projetoId` INTEGER NOT NULL,
    `titulo` VARCHAR(160) NOT NULL,
    `concluida` BOOLEAN NOT NULL DEFAULT false,
    `dataCriacao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `etapas_projeto_projetoId_id_idx`(`projetoId`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `notificacoes` ADD CONSTRAINT `notificacoes_projetoId_fkey` FOREIGN KEY (`projetoId`) REFERENCES `projetos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `projetos` ADD CONSTRAINT `projetos_proprietarioId_fkey` FOREIGN KEY (`proprietarioId`) REFERENCES `Usuario`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `participacoes_projeto` ADD CONSTRAINT `participacoes_projeto_projetoId_fkey` FOREIGN KEY (`projetoId`) REFERENCES `projetos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `participacoes_projeto` ADD CONSTRAINT `participacoes_projeto_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `Usuario`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `etapas_projeto` ADD CONSTRAINT `etapas_projeto_projetoId_fkey` FOREIGN KEY (`projetoId`) REFERENCES `projetos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
