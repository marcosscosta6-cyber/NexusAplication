/*
  Warnings:

  - You are about to alter the column `nome` on the `usuario` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `VarChar(120)`.
  - You are about to alter the column `curso` on the `usuario` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `VarChar(100)`.
  - You are about to alter the column `area` on the `usuario` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `VarChar(100)`.
  - You are about to alter the column `funcao` on the `usuario` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `VarChar(100)`.
  - A unique constraint covering the columns `[usuario]` on the table `Usuario` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `usuario` ADD COLUMN `comprovante` VARCHAR(255) NULL,
    ADD COLUMN `dataNasc` DATETIME(3) NULL,
    ADD COLUMN `escolaridade` VARCHAR(100) NULL,
    ADD COLUMN `usuario` VARCHAR(50) NULL,
    MODIFY `nome` VARCHAR(120) NOT NULL,
    MODIFY `senha` VARCHAR(255) NOT NULL,
    MODIFY `curso` VARCHAR(100) NULL,
    MODIFY `area` VARCHAR(100) NULL,
    MODIFY `funcao` VARCHAR(100) NULL,
    MODIFY `fotoPerfil` VARCHAR(255) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Usuario_usuario_key` ON `Usuario`(`usuario`);
