import bcrypt from 'bcryptjs';
import { prisma } from '../src/config/prisma.js';

// Contas reservadas para demonstração. Nunca altera contas que já existem.
const pessoas = [
  ['Ana Souza', 'ana01', 'desenvolvimento_de_sistemas', 'tecnologia', 'Desenvolvedora frontend', ['javascript', 'html', 'css']],
  ['Bruno Lima', 'bruno02', 'automacao_industrial', 'automacao', 'Técnico em automação', ['arduino', 'sensores', 'iot']],
  ['Carla Santos', 'carla03', 'marketing', 'marketing', 'Designer', ['figma', 'design', 'comunicação']],
  ['Diego Oliveira', 'diego04', 'mecanica', 'mecanica', 'Projetista mecânico', ['cad', 'modelagem 3d', 'prototipagem']],
  ['Elisa Costa', 'elisa05', 'administracao', 'gestao', 'Assistente de projetos', ['planejamento', 'gestão', 'excel']],
  ['Felipe Rocha', 'felipe06', 'desenvolvimento_de_sistemas', 'tecnologia', 'Desenvolvedor backend', ['node.js', 'mysql', 'git']],
  ['Gabriela Alves', 'gabriela07', 'eletrotecnica', 'eletro', 'Técnica em eletrotécnica', ['eletricidade', 'energia solar', 'circuitos']],
  ['Henrique Silva', 'henrique08', 'logistica', 'logistica', 'Assistente de logística', ['logística', 'excel', 'organização']],
  ['Isabela Martins', 'isabela09', 'edificacoes', 'construcao', 'Projetista de edificações', ['autocad', 'desenho técnico', 'bim']],
  ['Joao Pereira', 'joao10', 'quimica', 'quimica', 'Técnico em química', ['laboratório', 'qualidade', 'pesquisa']],
  ['Larissa Gomes', 'larissa11', 'multimidia', 'marketing', 'Produtora multimídia', ['fotografia', 'vídeo', 'design']],
  ['Lucas Ribeiro', 'lucas12', 'seguranca_do_trabalho', 'seguranca', 'Técnico em segurança', ['prevenção', 'segurança', 'treinamento']],
];
const projetos = [
  ['Portal de estudos', 'Uma plataforma para organizar materiais, compartilhar exercícios e estudar em equipe.', ['web', 'educação'], true],
  ['Horta inteligente', 'Monitoramento da umidade do solo com sensores e irrigação automática.', ['iot', 'sustentabilidade'], true],
  ['Identidade da feira técnica', 'Criação de peças visuais e materiais de divulgação para uma feira de projetos.', ['design', 'comunicação'], true],
  ['Protótipo de esteira', 'Desenvolvimento de um protótipo de esteira para demonstrar processos industriais.', ['mecânica', 'automação'], false],
  ['Organização de eventos', 'Planejamento de atividades, recursos e cronograma para encontros da comunidade.', ['gestão', 'planejamento'], true],
  ['Painel de indicadores', 'Painel para acompanhar dados e apresentar indicadores de projetos estudantis.', ['dados', 'web'], false],
];

async function executar() {
  const senha = await bcrypt.hash('Nexus@123', 12);
  const resultado = await prisma.$transaction(async tx => {
    const usuarios = [];
    let criados = 0;
    for (const [i, [nome, usuario, curso, area, funcao, habilidades]] of pessoas.entries()) {
      const email = `${usuario}@demo.nexus.example`;
      const existente = await tx.usuario.findFirst({ where: { OR: [{ usuario }, { email }] } });
      if (existente) {
        // Uma colisão cancela a transação, sem tocar nos dados existentes.
        if (existente.usuario !== usuario || existente.email !== email) throw new Error(`O identificador ${usuario} já pertence a outra conta.`);
        usuarios.push({ ...existente, novo: false });
        continue;
      }
      const novo = await tx.usuario.create({ data: {
        nome, usuario, email, senha, curso, area, funcao, situacao: 'PENDENTE',
        comprovante: 'uploads/comprovantes/de000000-0000-4000-8000-000000000001.png',
        dataNasc: new Date('2002-05-15T12:00:00Z'), escolaridade: 'Ensino médio completo',
        biografia: `Estudante do SENAI com interesse em ${habilidades.join(', ')}. Busco aprender, trocar experiências e colaborar em projetos. Perfil de demonstração.`,
        localizacao: ['BA', 'SP', 'PE'][i % 3],
        nivel: ['Iniciante', 'Intermediário', 'Avançado'][i % 3],
        disponibilidade: i % 3 ? 'Disponível' : 'Ocupado',
        mensagensPublicas: i % 2 === 0,
        habilidades: { create: habilidades.map(nome => ({ nome })) },
      } });
      usuarios.push({ ...novo, novo: true }); criados++;
    }
    // Só gera conteúdo de contas novas: repetir o comando não duplica mensagens ou projetos.
    for (const [i, u] of usuarios.entries()) {
      if (!u.novo) continue;
      for (const salto of [1, 2]) {
        const outro = usuarios[(i + salto) % usuarios.length];
        const parMenorId = Math.min(u.id, outro.id), parMaiorId = Math.max(u.id, outro.id);
        const status = salto === 1 ? 'ACEITA' : 'PENDENTE';
        await tx.conexao.upsert({ where: { parMenorId_parMaiorId: { parMenorId, parMaiorId } }, update: {}, create: {
          solicitanteId: u.id, destinatarioId: outro.id, parMenorId, parMaiorId, status,
        } });
        await tx.notificacao.create({ data: { usuarioId: outro.id, atorId: u.id, tipo: status === 'PENDENTE' ? 'SOLICITACAO' : 'CONEXAO_ACEITA' } });
        if (status === 'ACEITA') {
          await tx.mensagem.createMany({ data: [
            { remetenteId: u.id, destinatarioId: outro.id, texto: 'Olá! Que bom ter você na minha rede. Vamos trocar ideias sobre os projetos?', dataCriacao: new Date(Date.now() - 3600000), lidaEm: new Date() },
            { remetenteId: outro.id, destinatarioId: u.id, texto: 'Vamos sim! Podemos começar organizando as ideias e dividindo as atividades.' },
          ] });
          await tx.notificacao.create({ data: { usuarioId: u.id, atorId: outro.id, tipo: 'MENSAGEM' } });
        }
        await tx.visitaPerfil.upsert({ where: { usuarioId_visitanteId: { usuarioId: u.id, visitanteId: outro.id } }, update: {}, create: { usuarioId: u.id, visitanteId: outro.id } });
      }
      if (i < projetos.length) {
        const [nome, descricao, tags, publico] = projetos[i];
        const membro = usuarios[(i + 1) % usuarios.length], convidado = usuarios[(i + usuarios.length - 1) % usuarios.length];
        const projeto = await tx.projeto.create({ data: {
          proprietarioId: u.id, nome, descricao, tags, publico,
          participantes: { create: [{ usuarioId: membro.id, aceita: true }, { usuarioId: convidado.id, aceita: false }] },
          etapas: { create: [{ titulo: 'Definir objetivos e escopo', concluida: true }, { titulo: 'Desenvolver o protótipo' }, { titulo: 'Preparar a apresentação' }] },
        } });
        await tx.notificacao.create({ data: { usuarioId: convidado.id, atorId: u.id, tipo: 'PROJETO_CONVITE', projetoId: projeto.id } });
      }
    }
    return { criados, contas: usuarios.map(({ usuario, email }) => ({ usuario, email })) };
  }, { timeout: 120000 });
  console.log(`Contas criadas: ${resultado.criados}. Senha das novas contas: Nexus@123`);
  console.table(resultado.contas);
}

executar().catch(erro => { console.error('Não foi possível popular os dados:', erro.message); process.exitCode = 1; }).finally(() => prisma.$disconnect());
