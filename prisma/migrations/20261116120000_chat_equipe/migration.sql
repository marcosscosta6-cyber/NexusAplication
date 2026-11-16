CREATE TABLE `grupos_chat` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `projetoId` INTEGER NOT NULL,
  `nome` VARCHAR(120) NOT NULL,
  `dataCriacao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `grupos_chat_projetoId_key` (`projetoId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE TABLE `mensagens_grupo` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `grupoId` INTEGER NOT NULL,
  `remetenteId` INTEGER NOT NULL,
  `texto` TEXT NOT NULL,
  `dataCriacao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `mensagens_grupo_grupoId_id_idx` (`grupoId`, `id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `grupos_chat` ADD CONSTRAINT `grupos_chat_projetoId_fkey` FOREIGN KEY (`projetoId`) REFERENCES `projetos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `mensagens_grupo` ADD CONSTRAINT `mensagens_grupo_grupoId_fkey` FOREIGN KEY (`grupoId`) REFERENCES `grupos_chat`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `mensagens_grupo` ADD CONSTRAINT `mensagens_grupo_remetenteId_fkey` FOREIGN KEY (`remetenteId`) REFERENCES `Usuario`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
