export let usuarioAtual;
export const e = valor => String(valor ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export async function api(caminho,opcoes={}) {
 let resposta;
 try {resposta=await fetch('/api'+caminho,{credentials:'include',cache:'no-store',signal:AbortSignal.timeout(20000),...opcoes,headers:{...(opcoes.body && !(opcoes.body instanceof FormData)?{'Content-Type':'application/json'}:{}),...opcoes.headers},body:opcoes.body && !(opcoes.body instanceof FormData)?JSON.stringify(opcoes.body):opcoes.body});}catch{throw new Error('Não foi possível conectar ao Nexus. Confira sua conexão e tente novamente.');}
 if(resposta.status!==204 && !resposta.headers.get('content-type')?.includes('application/json'))throw new Error('O serviço está temporariamente indisponível. Tente novamente em instantes.');
 const dados=resposta.status===204?null:await resposta.json();
 if(resposta.status===401) {location.replace('/FrontEnd/inicio/index.html');throw new Error('Entre na sua conta para continuar.');}
 if(!resposta.ok){const erro=new Error(dados?.mensagem||'Não foi possível concluir a ação.');erro.status=resposta.status;erro.campos=dados?.erros;throw erro;}
 return dados;
}
export function aviso(texto,tipo='erro') {
 const alvo=document.getElementById('aviso-app');alvo.hidden=false;alvo.dataset.tipo=tipo;alvo.textContent=texto;
}
export const data=valor=>new Date(valor).toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'});
export function avatar(pessoa,classe='nx-avatar') {
 const iniciais=(pessoa.nome||'?').trim().split(/\s+/).slice(0,2).map(n=>n[0]).join('');
 return /^\/media\/perfis\/[a-f0-9-]+\.(png|jpg)$/.test(pessoa.fotoPerfil||'') ? '<img class="'+classe+'" src="'+e(pessoa.fotoPerfil)+'" alt="Foto de '+e(pessoa.nome)+'">' : '<span class="'+classe+'" aria-hidden="true">'+e(iniciais)+'</span>';
}
export function sessao(usuario) {
 usuarioAtual=usuario;
 document.documentElement.classList.toggle('texto-ampliado',!!usuario.fonteAmpliada);
 document.querySelectorAll('[data-usuario-nome]').forEach(el=>el.textContent=usuario.nome);
 document.querySelectorAll('[data-usuario-cargo]').forEach(el=>el.textContent=usuario.funcao||'Complete seu perfil');
 document.querySelectorAll('[data-usuario-foto]').forEach(el=>{el.src=fotoSrc(usuario);el.hidden=false;});
 document.querySelectorAll('[data-saudacao]').forEach(el=>el.textContent='Olá, '+usuario.nome.split(' ')[0]+'!');


}
export function erroFormulario(form,erro) {
 form.querySelectorAll('[aria-invalid]').forEach(el=>el.removeAttribute('aria-invalid'));
 const detalhes=[];
 for(const item of erro.campos||[]){const campo=form.elements.namedItem(item.campo);if(campo){campo.setAttribute('aria-invalid','true');detalhes.push(item.mensagem);}}
 aviso(detalhes.length?detalhes.join(' '):erro.message);
 form.querySelector('[aria-invalid="true"]')?.focus();
}
export function paginas(alvo,atual,total,acao) {
 alvo.replaceChildren();
 if(total<2)return;
 for(const [texto,pagina] of [['Anterior',atual-1],['Próxima',atual+1]]){const b=document.createElement('button');b.textContent=texto;b.disabled=pagina<1||pagina>total;b.addEventListener('click',()=>acao(pagina));alvo.appendChild(b);}
 const info=document.createElement('span');info.textContent='Página '+atual+' de '+total;alvo.prepend(info);
}
export const acao=fn=>async evento=>{const botao=evento?.target?.closest('button');if(botao)botao.disabled=true;try{await fn(evento);}catch(erro){aviso(erro.message);}finally{if(botao)botao.disabled=false;}};
export function mensagemNotificacao(n) {return n.ator.nome+' '+({SOLICITACAO:'enviou uma solicitação de conexão.',CONEXAO_ACEITA:'aceitou sua solicitação de conexão.',MENSAGEM:'enviou uma mensagem para você.',PROJETO_CONVITE:'convidou você para um projeto.'}[n.tipo]||'interagiu com você.');}
export function linkNotificacao(n){return n.tipo==='PROJETO_CONVITE'?'/FrontEnd Interno/projetos/projetos.html?convites=1':n.tipo==='MENSAGEM'?'/FrontEnd Interno/mensagens/mensagens.html?usuario='+n.ator.id:'/FrontEnd Interno/conexões/conec.html';}

export function fotoSrc(pessoa){
 if(/^\/media\/perfis\/[a-f0-9-]+\.(png|jpg)$/.test(pessoa.fotoPerfil||''))return pessoa.fotoPerfil;
 const iniciais=(pessoa.nome||'').trim().split(/\s+/).slice(0,2).map(n=>n[0]||'').join('');
 return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" rx="50" fill="#8b2cff"/><text x="50" y="55" text-anchor="middle" dominant-baseline="middle" fill="white" font-family="sans-serif" font-size="32">'+e(iniciais)+'</text></svg>');
}
