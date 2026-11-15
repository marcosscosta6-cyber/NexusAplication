-- Preserva conex?es existentes; duplicatas precisam ser resolvidas antes de aplicar.
ALTER TABLE conexoes ADD COLUMN parMenorId INTEGER NULL, ADD COLUMN parMaiorId INTEGER NULL;
UPDATE conexoes SET parMenorId = LEAST(solicitanteId, destinatarioId), parMaiorId = GREATEST(solicitanteId, destinatarioId);
ALTER TABLE conexoes MODIFY parMenorId INTEGER NOT NULL, MODIFY parMaiorId INTEGER NOT NULL,
 ADD UNIQUE INDEX conexoes_parMenorId_parMaiorId_key (parMenorId, parMaiorId),
 ADD CONSTRAINT conexoes_par_valido CHECK (parMenorId < parMaiorId);
