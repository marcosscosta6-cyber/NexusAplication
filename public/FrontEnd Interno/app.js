window.addEventListener('pageshow',evento=>{if(evento.persisted)location.reload();});
import {api,sessao,aviso} from '/shared/ui.js';
import {instalarBusca} from '/shared/busca.js';
const paginas={"home":"./home/home.js","explorar":"./explorar/explorar.js","conexoes":"./conexões/conec.js","perfil":"./perfil/perfil.js","mensagens":"./mensagens/mensagens.js","notificacoes":"./notificações/not.js","config":"./config/config.js","projetos":"./projetos/projetos.js","perfilUser":"./perfil/perfil.js","detalhe":"./projetos/detalhe.js"};
function instalarIndicadores(){
 const links=[...document.querySelectorAll('a[href*="notificações/not.html"]')];
 async function atualizar(){try{const {naoLidas}=await api('/notificacoes');for(const link of links){link.classList.toggle('tem-notificacoes',naoLidas>0);link.setAttribute('aria-label',naoLidas?`Notificações: ${naoLidas} não lida(s)`:'Notificações');}}catch{/* Mantém o último estado até a próxima atualização. */}}
 atualizar();const timer=setInterval(()=>{if(!document.hidden)atualizar();},15000);
 window.addEventListener('notificacoes-alteradas',atualizar);document.addEventListener('visibilitychange',()=>{if(!document.hidden)atualizar();});window.addEventListener('pagehide',()=>clearInterval(timer),{once:true});
}
async function iniciar(){
 try {
  const {usuario}=await api('/usuarios/me');sessao(usuario);
  instalarIndicadores();
  const modulo=await import(paginas[document.body.dataset.pagina]);
  await modulo.iniciar();
  instalarBusca();
  document.documentElement.dataset.sessao='pronta';
 }catch(erro){
  if(erro.status===403){location.replace('/FrontEnd/inicio/index.html');return;}
  document.documentElement.dataset.sessao='erro';aviso(erro.message||'Não foi possível carregar seus dados. Atualize a página para tentar novamente.');
 }
}
iniciar();
