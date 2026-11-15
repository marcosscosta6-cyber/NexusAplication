#  Nexus

Plataforma criada por alunos do SENAI para conectar estudantes, facilitar a comunicação e impulsionar projetos colaborativos.

##  Sobre o Projeto

O **Nexus** transforma ideias acadêmicas em oportunidades reais de mercado.

###  O Problema
* Alunos com boas ideias sem parceiros.
* Falta de rede de conexão estudantil.
* Abandono precoce de projetos inovadores.
* Dificuldade em achar sócios na comunidade.

###  A Solução
* Plataforma de conexão independente de instituições.
* Comunicação direta entre alunos do SENAI.
* Atuação ampla sem restrição regional.
* Ecossistema focado em inovação técnica.

##  Tecnologias Utilizadas

* HTML5
* CSS3
* JavaScript
* Framework Bootstrap
* Git & GitHub
* Prototipação no Figma

##  Estrutura de Pastas

```text
NexusApplication-main/
└── Nexus/
    ├── FrontEnd/
    │   ├── cadastro/
    │   ├── inicio/
    │   ├── redsenha/
    │   └── img/
    ├── FrontEnd Interno/
    │   ├── home/
    │   ├── explorar/
    │   ├── conexões/
    │   ├── projetos/
    │   ├── mensagens/
    │   ├── notificações/
    │   ├── perfil/
    │   ├── config/
    │   └── Img/
    ├── index.html
    └── README.md
```

##  Funcionalidades Sistema

###  FrontEnd Público (Sem Login)
* Tela de cadastro de novas contas.
* Página inicial institucional com apresentação.
* Formulário para recuperação de senhas.

### FrontEnd Interno (Pós-Login)
* Painel inicial dinâmico com novidades.
* Busca ativa por novos parceiros.
* Gerenciamento de conexões da rede.
* Criação e monitoramento de projetos.
* Sistema interno de mensagens diretas.
* Alertas e notificações de interações.
* Customização de perfil e configurações.

##  Equipe Desenvolvedora

* **Docente:** Jessica Arnaut
* **Integrantes:**
  * Alessandra das Neves
  * Ana Clara Teixeira
  * Marcos Saulo Simões
  * Pedro Vinícius Marques

  comando para instalar o necessario do site:
  npm install express zod bcryptjs jsonwebtoken dotenv cors @prisma/client@7 @prisma/adapter-mariadb

## Backend e banco de dados

Requer Node.js compatível com Prisma 7 e MySQL 8.0.16+ (ou MariaDB com suporte a CHECK).

1. Copie .env.example para .env e configure DATABASE_URL e um JWT_SECRET aleatório. Caracteres especiais nas credenciais da URL precisam estar codificados.
2. Execute npm install (gera o Prisma Client automaticamente).
3. Execute npm run db:deploy.
4. Execute npm start e abra http://localhost:3000/FrontEnd/inicio/index.html. O Express serve o frontend e a API na mesma origem.

DATABASE_URL é a única fonte da conexão, tanto na API quanto nas migrations. As antigas variáveis DATABASE_HOST, DATABASE_PORT, DATABASE_USER, DATABASE_PASSWORD e DATABASE_NAME não são mais utilizadas. No PowerShell com bloqueio de npm.ps1, utilize npm.cmd.

A aprovação de comprovantes fica para uma próxima etapa: o comprovante continua obrigatório e o cadastro permanece PENDENTE, mas isso não bloqueia o login nem as conexões. Não há aprovação automática do documento.

Cadastro, login e logout usam a API. Todas as telas internas carregam a identidade da sessão. Perfis, habilidades, fotos, filtros, conexões, mensagens, notificações e preferências usam dados persistidos por conta. Não há contas de demonstração ou dados pessoais fixos. Projetos podem ser criados e editados pelo proprietário, com tags, status, convites para conexões aceitas e etapas.

Mensagens respeitam a preferência de quem recebe: por padrão somente conexões aceitas; Configurações permite receber de qualquer usuário cadastrado. A permissão é direcional, então o destinatário pode aceitar mensagens enquanto o remetente mantém sua própria conta restrita. A conversa existente continua legível por seus participantes se o envio for restringido depois. Novas mensagens são buscadas a cada 4 segundos enquanto a aba está visível. Histórico usa lotes de 50 mensagens com cursores e botão para carregar anteriores.

Excluir uma solicitação permite novo convite em qualquer direção. Cancelar remove um convite enviado; Remover desfaz uma conexão aceita. Operações e notificações são gravadas na mesma transação.

O perfil permite nome, curso, função, área, estado, nível, disponibilidade, biografia, até 30 habilidades de até 30 caracteres e foto PNG/JPG de até 2 MB. A configuração de perfil público controla busca e visita; perfis restritos são visíveis apenas ao próprio dono e conexões aceitas. E-mail, nascimento, senha e comprovante não aparecem no perfil público. Visitas contam pessoas distintas e não o próprio usuário.

As tabelas habilidades, mensagens, notificacoes e visitas_perfil se relacionam a Usuario por chaves estrangeiras com exclusão em cascata. Notificações podem ser lidas ou excluídas somente pelo dono. Comprovantes permanecem privados; somente fotos de perfil são servidas em /media/perfis.

Configurações salva privacidade do perfil, recebimento de mensagens, atuação e tamanho do texto, além de permitir troca de senha com verificação da senha atual. O visual original das telas e o estilo do modal de perfil foram preservados; os campos, listas e contadores recebem somente dados reais. E-mail automático, push e recuperação de acesso por e-mail ainda não estão disponíveis; não há controles simulando esses serviços.

As migrations antigas tinham ALTER TABLE usuario e referências a Usuario. Os nomes foram padronizados como Usuario. db:deploy reconcilia somente os checksums originais conhecidos das migrations listadas no script, sem alterar registros de usuários. Um checksum desconhecido interrompe o comando para conferência. A nova migration preserva os registros e adiciona unicidade ao par normalizado da conexão; pares duplicados preexistentes precisam ser resolvidos antes de aplicá-la. Não execute reset para corrigir conflitos de migrations.

Validação: npm run db:validate e npm run db:status. npm test executa as validações locais e pula os testes de integração por padrão. Para executá-lo no PowerShell: $env:RUN_DB_TESTS='1'; npm test. Ele cria contas com prefixo exclusivo no banco configurado e remove essas contas e seus arquivos no final; prefira um banco de desenvolvimento.


## Projetos

Novo projeto abre um formulário curto com título (3–120 caracteres), descrição (10–5000), até 8 tags de até 24 caracteres e visibilidade. Públicos aparecem para a comunidade autenticada; privados só para proprietário e integrantes que aceitaram o convite. O proprietário é definido pela sessão. Apenas ele altera projeto, tags e etapas, convida conexões aceitas e remove integrantes. Convites aparecem na lista de projetos e em notificações; aceitar libera a participação, recusar não dá acesso. O integrante pode sair da equipe. Contadores e listas no perfil e painel usam os projetos reais.

A edição de perfil mostra foto, nome, curso e biografia. Estado e habilidades ficam em Mais informações, fechado por padrão. Área, função, nível e disponibilidade ficam em Configurações → Disponibilidade e atuação, para não sobrecarregar o perfil. Os novos diálogos reutilizam as cores, bordas e botões do modal original.
