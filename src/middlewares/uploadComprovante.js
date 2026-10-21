
import multer from "multer";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";

const pastaComprovantes = path.resolve(
  process.cwd(),
  "uploads",
  "comprovantes"
);

mkdirSync(pastaComprovantes, { recursive: true });

const tiposPermitidos = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
]);

const extensoesPermitidas = new Set([
  ".pdf",
  ".jpg",
  ".jpeg",
  ".png",
]);

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, pastaComprovantes);
  },

  filename: (_req, file, callback) => {
    const extensao = path.extname(file.originalname).toLowerCase();

    callback(null, `${randomUUID()}${extensao}`);
  },
});

export const uploadComprovante = multer({
  storage,

  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },

  fileFilter: (_req, file, callback) => {
    const extensao = path.extname(file.originalname).toLowerCase();

    if (
      !tiposPermitidos.has(file.mimetype) ||
      !extensoesPermitidas.has(extensao)
    ) {
      return callback(
        new Error("Envie somente arquivos PDF, JPG, JPEG ou PNG.")
      );
    }

    callback(null, true);
  },
});
