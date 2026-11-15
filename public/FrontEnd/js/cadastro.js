function voltar() { window.location.href = "../inicio/index.html"; }
const formulario = document.getElementById("FormCadastro");
const botao = document.getElementById("cadastrar");
const aviso = document.getElementById("avisoCadastro");
const campos = Object.fromEntries(Array.from(formulario.elements).filter(el => el.name).map(el => [el.name, el]));
const ajudas = {
  nome: "De 3 a 120 caracteres.",
  email: "Informe um e-mail válido que ainda não esteja cadastrado.",
  usuario: "De 3 a 50 caracteres: letras sem acento, números, ponto, hífen ou underline. Sem espaços.",
  senha: "No mínimo 8 caracteres e no máximo 72 bytes. Acentos e emojis ocupam mais de um byte. Não é obrigatório usar letras maiúsculas ou símbolos.",
  confirm: "Digite exatamente a mesma senha.",
  dataNasc: "Informe sua data de nascimento; datas futuras não são aceitas.",
  escolaridade: "Selecione uma das opções da lista.",
};
const limites = { nome: 120, email: 191, usuario: 50 };
for (const [nome, campo] of Object.entries(campos)) {
  const grupo = campo.closest('.input-group');
  if (ajudas[nome]) {
    const ajuda = document.createElement('p');
    ajuda.id = 'ajuda-' + nome; ajuda.className = 'campo-ajuda'; ajuda.textContent = ajudas[nome];
    grupo.appendChild(ajuda);
  }
  const erro = document.createElement('p');
  erro.id = 'erro-' + nome; erro.className = 'campo-erro'; erro.hidden = true;
  grupo.appendChild(erro);
  campo.setAttribute('aria-describedby', (ajudas[nome] ? 'ajuda-' + nome + ' ' : '') + erro.id);
  if (limites[nome]) campo.maxLength = limites[nome];
  campo.addEventListener('blur', () => mostrarErro(nome, validar(nome)));
  campo.addEventListener(campo.type === 'file' || campo.tagName === 'SELECT' ? 'change' : 'input', () => {
    if (campo.getAttribute('aria-invalid') === 'true') mostrarErro(nome, validar(nome));
    if (nome === 'senha' && campos.confirm.value) mostrarErro('confirm', validar('confirm'));
    if (aviso.dataset.tipo === 'erro') aviso.hidden = true;
  });
}
campos.nome.autocomplete = 'name';
campos.email.autocomplete = 'email';
campos.usuario.autocomplete = 'username';
campos.senha.autocomplete = campos.confirm.autocomplete = 'new-password';
const hoje = new Date();
campos.dataNasc.max = hoje.getFullYear() + '-' + String(hoje.getMonth()+1).padStart(2,'0') + '-' + String(hoje.getDate()).padStart(2,'0');
campos.dataNasc.min = '1000-01-01';
function validar(nome) {
  const campo = campos[nome];
  const valor = campo.value;
  const texto = valor.trim();
  if (nome === 'Comprovante') {
    const arquivo = campo.files[0];
    if (!arquivo) return 'Selecione o comprovante de matrícula ou certificado de conclusão.';
    if (!/\.(pdf|jpe?g|png)$/i.test(arquivo.name) || (arquivo.type && !['application/pdf','image/jpeg','image/png'].includes(arquivo.type))) return 'Envie somente PDF, JPG, JPEG ou PNG.';
    if (arquivo.size > 5 * 1024 * 1024) return 'O comprovante deve ter no máximo 5 MB.';
    return '';
  }
  if (!valor || (!['senha','confirm'].includes(nome) && !texto)) return 'Preencha este campo.';
  if (nome === 'nome' && (texto.length < 3 || texto.length > 120)) return 'O nome deve ter entre 3 e 120 caracteres.';
  if (nome === 'email' && (texto.length > 191 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(texto))) return 'Informe um e-mail válido, como nome@exemplo.com (até 191 caracteres).';
  if (nome === 'usuario' && (texto.length < 3 || texto.length > 50 || !/^[a-zA-Z0-9_.-]+$/.test(texto))) return 'Use de 3 a 50 caracteres: letras sem acento, números, ponto, hífen ou underline. Sem espaços.';
  if (nome === 'senha' && (valor.length < 8 || new TextEncoder().encode(valor).length > 72)) return 'A senha precisa ter ao menos 8 caracteres e no máximo 72 bytes. Acentos e emojis ocupam mais espaço.';
  if (nome === 'confirm' && valor !== campos.senha.value) return 'As senhas não coincidem. Digite a mesma senha nos dois campos.';
  if (nome === 'dataNasc') {
    const data = new Date(valor + 'T00:00:00');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(valor) || Number.isNaN(data.getTime()) || valor < '1000-01-01' || valor > campos.dataNasc.max || campo.validity.badInput) return 'Informe uma data de nascimento válida, que não esteja no futuro.';
  }
  return '';
}
function mostrarErro(nome, mensagem) {
  if (!campos[nome]) return;
  const erro = document.getElementById('erro-' + nome);
  erro.textContent = mensagem; erro.hidden = !mensagem;
  campos[nome].setAttribute('aria-invalid', mensagem ? 'true' : 'false');
}
function mensagem(texto, tipo = 'erro') {
  aviso.textContent = texto; aviso.dataset.tipo = tipo; aviso.hidden = false;
}
function focarErro() {
  const campo = Object.values(campos).find(c => c.getAttribute('aria-invalid') === 'true');
  if (campo) { campo.focus(); campo.closest('.input-group').scrollIntoView({ block: 'center', behavior: 'smooth' }); }
  else aviso.scrollIntoView({block:'center',behavior:'smooth'});
}
campos.Comprovante.addEventListener('change', () => {
  document.getElementById('nomeArquivo').textContent = campos.Comprovante.files[0]?.name || 'Clique para enviar arquivo';
  mostrarErro('Comprovante', validar('Comprovante'));
});
formulario.addEventListener('submit', async evento => {
  evento.preventDefault();
  if (botao.disabled) return;
  let invalido = false;
  for (const nome of Object.keys(campos)) {
    const erro = validar(nome); mostrarErro(nome, erro); if (erro) invalido = true;
  }
  if (invalido) { mensagem('Confira os campos destacados abaixo. O cadastro ainda não foi enviado.'); focarErro(); return; }
  botao.disabled = true; botao.textContent = 'Cadastrando...';
  mensagem('Enviando seu cadastro. Aguarde...', 'enviando');
  try {
    const resposta = await fetch('/api/usuarios', { method: 'POST', body: new FormData(formulario), signal: AbortSignal.timeout(30000) });
    if (!resposta.headers.get('content-type')?.includes('application/json')) throw new Error('Não foi possível enviar o cadastro. Abra o site em http://localhost:3000 e tente novamente.');
    const resultado = await resposta.json();
    if (!resposta.ok) {
      for (const erro of resultado.erros || []) mostrarErro(erro.campo, erro.mensagem);
      mensagem(resultado.mensagem || 'Não foi possível cadastrar. Tente novamente.'); focarErro(); return;
    }
    formulario.reset();
    document.getElementById('nomeArquivo').textContent = 'Clique para enviar arquivo';
    for (const nome of Object.keys(campos)) mostrarErro(nome, '');
    mensagem('Cadastro realizado com sucesso! Você já pode entrar com seu e-mail ou usuário e senha.', 'sucesso');
    const link = document.createElement('a'); link.href = '../inicio/index.html'; link.textContent = ' Ir para o login'; aviso.appendChild(link);
    aviso.scrollIntoView({block:'center',behavior:'smooth'});
  } catch (erro) {
    mensagem(erro.name === 'TimeoutError' ? 'O envio demorou demais. Confira sua conexão e tente novamente; se a conta já foi criada, entre pelo login.' : erro instanceof TypeError ? 'Não foi possível conectar ao servidor. Confira sua conexão e se o site está disponível em http://localhost:3000.' : erro.message);
    aviso.scrollIntoView({block:'center',behavior:'smooth'});
  } finally { botao.disabled = false; botao.textContent = 'Cadastrar'; }
});
