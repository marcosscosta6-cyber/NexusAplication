import {api,e,aviso,usuarioAtual,data,fotoSrc} from '/shared/ui.js';
export async function iniciar(){
 const parametros=new URLSearchParams(location.search);
 const modos=document.createElement('nav');modos.className='chat-modos';modos.setAttribute('aria-label','Tipo de conversa');
 const emGrupo=parametros.has('grupo')||parametros.get('modo')==='grupos';
 modos.innerHTML='<a href="mensagens.html" '+(!emGrupo?'aria-current="page"':'')+'>Conversas</a><a href="mensagens.html?modo=grupos" '+(emGrupo?'aria-current="page"':'')+'>Equipes</a>';
 document.querySelector('.titulo-conversas').after(modos);
 document.getElementById('btn-novo-chat').setAttribute('aria-label',emGrupo?'Criar grupo de equipe':'Iniciar conversa');
 if(emGrupo){await (await import('./grupos.js')).iniciar();return;}
 const avatar=u=>'<img src="'+e(fotoSrc(u))+'" alt="">';
 const chats=document.getElementById('listaChats'),corpo=document.getElementById('chat-mensagens'),form=document.getElementById('enviar-mensagem');
 const texto=form.elements.texto,botao=form.querySelector('button'),anterior=document.getElementById('mensagens-anteriores');
 const rascunhos=new Map();
 const container=document.querySelector('.mensagens-container');
 const voltar=document.createElement('button');voltar.id='voltar-conversas';voltar.type='button';voltar.textContent='← Conversas';document.querySelector('.chat-area').prepend(voltar);
 voltar.addEventListener('click',()=>{container.classList.remove('conversa-aberta');chats.querySelector('[data-chat].ativo')?.focus();});
 let carregando=false;
 let selecionado=null,mensagens=[],pode=false,cursor=0,versao=0,consultando=false,enviando=false;
 async function listar(){
  const {conversas}=await api('/mensagens');
  const html=conversas.length?conversas.map(c=>'<button class="contato '+(c.usuario.id===selecionado?'ativo':'')+'" data-chat="'+c.usuario.id+'">'+avatar(c.usuario)+'<div><h4>'+e(c.usuario.nome)+'</h4><p>'+e(c.ultimaMensagem.texto)+'</p>'+(c.naoLidas?'<span class="badge-count">'+c.naoLidas+' não lida(s)</span>':'')+'</div></button>').join(''):'<p class="empty-state">Nenhuma conversa. Use + para iniciar.</p>';
  if(chats.innerHTML!==html){const foco=chats.contains(document.activeElement)?document.activeElement?.dataset.chat:null;chats.innerHTML=html;if(foco)chats.querySelector('[data-chat="'+foco+'"]')?.focus();}
 }
 function renderizar(rolar=false){
  const pertoDoFim=corpo.scrollHeight-corpo.scrollTop-corpo.clientHeight<80;
  corpo.innerHTML=mensagens.length?mensagens.map(m=>'<div class="mensagem '+(m.remetenteId===usuarioAtual.id?'enviada':'recebida')+'">'+e(m.texto)+'<time datetime="'+e(m.dataCriacao)+'">'+data(m.dataCriacao)+'</time></div>').join(''):'<p class="empty-state">Nenhuma mensagem nesta conversa.</p>';
  if(rolar||pertoDoFim)corpo.scrollTop=corpo.scrollHeight;
 }
 async function abrir(id){
  if(selecionado)rascunhos.set(selecionado,texto.value);
  carregando=true;container.classList.add('conversa-aberta');
  const token=++versao;selecionado=id;mensagens=[];cursor=0;pode=false;texto.disabled=botao.disabled=true;
  document.getElementById('chat-cabecalho').textContent='Carregando conversa...';corpo.replaceChildren();anterior.hidden=true;
  try{
   const dados=await api('/mensagens/'+id);if(token!==versao)return;
   mensagens=dados.mensagens;cursor=mensagens.at(-1)?.id||0;pode=dados.podeEnviar;
   document.getElementById('chat-cabecalho').innerHTML=avatar(dados.usuario)+'<div><h3><a class="nexus-text-link" href="../perfil/perfilUser.html?id='+dados.usuario.id+'">'+e(dados.usuario.nome)+'</a></h3><span id="chat-permissao">'+(pode?'Conversa privada':'Envio indisponível: este usuário recebe apenas mensagens de conexões aceitas.')+'</span></div>';
   texto.value=rascunhos.get(id)||'';texto.disabled=botao.disabled=!pode;anterior.hidden=!dados.temMais;
   history.replaceState(null,'','?usuario='+id);renderizar(true);await listar();
  }catch(err){if(token!==versao)return;document.getElementById('chat-cabecalho').textContent=err.message;aviso(err.message);}
  finally{if(token===versao)carregando=false;}
 }
 async function atualizar(){
  if(consultando||enviando||carregando||document.hidden)return;consultando=true;
  const token=versao;
  try{
   if(selecionado){
    const ultimo=cursor;
    const dados=await api('/mensagens/'+selecionado+'?depois='+ultimo);
    if(token!==versao)return;
    pode=dados.podeEnviar;texto.disabled=botao.disabled=!pode;const status=document.getElementById('chat-permissao');if(status)status.textContent=pode?'Conversa privada':'Envio indisponível: este usuário recebe apenas mensagens de conexões aceitas.';
    if(dados.mensagens.length){const ids=new Set(mensagens.map(m=>m.id));mensagens.push(...dados.mensagens.filter(m=>!ids.has(m.id)));mensagens.sort((a,b)=>a.id-b.id);cursor=dados.mensagens.at(-1).id;renderizar();}
   }
   await listar();
  }catch(err){if(token===versao){pode=false;texto.disabled=botao.disabled=true;aviso(err.message);}}
  finally{consultando=false;}
 }
 chats.addEventListener('click',evento=>{const b=evento.target.closest('[data-chat]');if(b)abrir(Number(b.dataset.chat)).catch(err=>aviso(err.message));});
 anterior.addEventListener('click',async()=>{
  if(!mensagens.length)return;const token=versao;anterior.disabled=true;
  try{const dados=await api('/mensagens/'+selecionado+'?antes='+mensagens[0].id);if(token!==versao)return;const altura=corpo.scrollHeight,posicao=corpo.scrollTop;const ids=new Set(mensagens.map(m=>m.id));mensagens=[...dados.mensagens.filter(m=>!ids.has(m.id)),...mensagens];renderizar();corpo.scrollTop=corpo.scrollHeight-altura+posicao;anterior.hidden=!dados.temMais;}catch(err){aviso(err.message);}finally{anterior.disabled=false;}
 });
 form.addEventListener('submit',async evento=>{
  evento.preventDefault();if(!pode||!selecionado||enviando)return;const valor=texto.value.trim();if(!valor)return;
  const id=selecionado,token=versao;enviando=true;botao.disabled=true;
  try{const dados=await api('/mensagens/'+id,{method:'POST',body:{texto:valor}});if(token===versao){if(!mensagens.some(m=>m.id===dados.mensagem.id))mensagens.push(dados.mensagem);mensagens.sort((a,b)=>a.id-b.id);if(texto.value.trim()===valor)texto.value='';rascunhos.set(id,texto.value);renderizar(true);texto.focus();}await listar();}catch(err){aviso(err.message);}finally{enviando=false;botao.disabled=!pode;}
 });
 const painel=document.getElementById('buscarUsuarios'),pessoas=document.getElementById('pessoas-chat'),busca=document.getElementById('pesquisaUsuario');
 let buscaVersao=0;
 async function buscar(){
  const token=++buscaVersao,q=busca.value.trim();let usuarios;
  if(q){usuarios=(await api('/usuarios?q='+encodeURIComponent(q))).usuarios;}
  else{const dados=await api('/conexoes');usuarios=dados.conexoes.map(c=>c.solicitanteId===usuarioAtual.id?c.destinatario:c.solicitante);}
  if(token!==buscaVersao)return;
  pessoas.innerHTML=usuarios.length?usuarios.map(u=>'<div class="usuario-item" role="button" tabindex="0" data-pessoa="'+u.id+'">'+e(u.nome)+'</div>').join(''):'<p class="empty-state">Busque pelo nome ou conecte-se com pessoas em Explorar.</p><a class="nexus-proximo-passo" href="../explorar/explorar.html">Explorar pessoas →</a>';
 }
 document.getElementById('btn-novo-chat').addEventListener('click',()=>{painel.hidden=!painel.hidden;painel.classList.toggle('ativo',!painel.hidden);if(!painel.hidden){busca.focus();buscar().catch(err=>aviso(err.message));}});
 let timerBusca;busca.addEventListener('input',()=>{clearTimeout(timerBusca);timerBusca=setTimeout(()=>buscar().catch(err=>aviso(err.message)),350);});
 pessoas.addEventListener('click',evento=>{const b=evento.target.closest('[data-pessoa]');if(b){painel.hidden=true;painel.classList.remove('ativo');abrir(Number(b.dataset.pessoa)).catch(err=>aviso(err.message));}});
 pessoas.addEventListener('keydown',evento=>{if((evento.key==='Enter'||evento.key===' ')&&evento.target.matches('[data-pessoa]')){evento.preventDefault();evento.target.click();}});
 await listar();
 const id=Number(new URLSearchParams(location.search).get('usuario'));
 if(Number.isInteger(id)&&id>0)await abrir(id);
 const timer=setInterval(atualizar,4000);window.addEventListener('pagehide',()=>clearInterval(timer),{once:true});
}
