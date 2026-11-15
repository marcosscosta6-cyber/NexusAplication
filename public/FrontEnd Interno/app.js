window.addEventListener('pageshow',evento=>{if(evento.persisted)location.reload();});
import {api,sessao,aviso} from '/shared/ui.js';
const paginas={"home":"./home/home.js","explorar":"./explorar/explorar.js","conexoes":"./conexões/conec.js","perfil":"./perfil/perfil.js","mensagens":"./mensagens/mensagens.js","notificacoes":"./notificações/not.js","config":"./config/config.js","projetos":"./projetos/projetos.js","perfilUser":"./perfil/perfil.js","detalhe":"./projetos/detalhe.js"};
async function iniciar(){
 try {
  const {usuario}=await api('/usuarios/me');sessao(usuario);
  const busca=document.querySelector('.search-box input');
  busca?.addEventListener('keydown',evento=>{if(evento.key==='Enter'){evento.preventDefault();location.href='/FrontEnd Interno/explorar/explorar.html?q='+encodeURIComponent(busca.value.trim());}});
  const modulo=await import(paginas[document.body.dataset.pagina]);
  await modulo.iniciar();
  document.documentElement.dataset.sessao='pronta';
 }catch(erro){
  if(erro.status===403){location.replace('/FrontEnd/inicio/index.html');return;}
  document.documentElement.dataset.sessao='erro';aviso(erro.message||'Não foi possível carregar seus dados. Atualize a página para tentar novamente.');
 }
}
iniciar();
