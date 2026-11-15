// Reconcilia somente a padronização do nome Usuario em migrations conhecidas.
// Aceita as variantes LF/CRLF, sem alterar tabelas nem registros de usuários.
import { prisma } from '../src/config/prisma.js';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const correcoes = [
  {
    "name": "20261020115648_campos_cadastro_usuario",
    "originais": [
      "54ec3044e0c8da34fd99325790fdba48ae6e74d04f18c79d466785759a7fa60b",
      "36eb9ea8d63b8209df024c6a4e4fac507940160418069203c2f251f6b25144a2"
    ],
    "corrigidos": [
      "b409e3c312c2eba23b9c4ee9f2f79b0a8d7ba6b04b185086d0e188ae867b36c0",
      "c6c4b4d543b492d391ec825bb4bd48d0fa624836089d672fa2c1eb64299bf43a"
    ]
  },
  {
    "name": "20261028111816_criar_conexoes",
    "originais": [
      "8eeec6f86121292a26703880cbaf591d0b2c47fa3fb92d46617a2da5f2282225",
      "ec46cc4be342b3d5b387395db075641f447a0d35d632fdfc52bda603334ea77f"
    ],
    "corrigidos": [
      "836a0ab572e491af28ed3770e7d8a79f73bb696a8ac37da4e501ef805cbeb29c",
      "01598d2f7eb40914a14553b78985ed69a43a09736d7b2c4a9cde9cc720bbdb28"
    ]
  },
  {
    "name": "20261113160000_dados_individuais",
    "originais": [
      "2fb5cf06fa86328485265e6f2eeb08fc9e92d02b00b7bcbb75bd386abd63028a",
      "1ba2bd202d96ebf4f24cd6b70fb7edbaf4f859b308323eb4a3e30f1a905bf155"
    ],
    "corrigidos": [
      "b709d4d50a8c7be8312e35c79158ae853e72712bcf793fdda1e6a2cbdd6c197b",
      "597bc933a5fb49d0460a92e2f62492bf81565c41038c2daec41ef011ae301070"
    ]
  }
];
try {
  const tabelas = await prisma.$queryRaw`SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = '_prisma_migrations'`;
  if (tabelas.length) {
    for (const item of correcoes) {
      const arquivo = readFileSync(new URL('../prisma/migrations/' + item.name + '/migration.sql', import.meta.url));
      const checksum = createHash('sha256').update(arquivo).digest('hex');
      if (!item.corrigidos.includes(checksum)) throw new Error('Migration local alterada: ' + item.name);
      const registros = await prisma.$queryRaw`SELECT checksum FROM _prisma_migrations WHERE migration_name = ${item.name} AND finished_at IS NOT NULL AND rolled_back_at IS NULL`;
      for (const registro of registros) {
        if (![...item.originais, ...item.corrigidos].includes(registro.checksum)) {
          throw new Error('Checksum desconhecido: ' + item.name + '. Confira o histórico antes de migrar.');
        }
        if (item.originais.includes(registro.checksum)) {
          await prisma.$executeRaw`UPDATE _prisma_migrations SET checksum = ${checksum} WHERE migration_name = ${item.name} AND checksum = ${registro.checksum} AND finished_at IS NOT NULL AND rolled_back_at IS NULL`;
        }
      }
    }
  }
} finally { await prisma.$disconnect(); }
