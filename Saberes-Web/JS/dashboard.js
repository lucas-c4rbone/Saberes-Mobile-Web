const API_BASE = 'http://localhost/saberes/api/';

let professorLogado = null;
let chatConteudoId = null;
let chatAlunoId = null;

// verifica login ao carregar a página
window.addEventListener('load', () => {
const profStr = localStorage.getItem('professorLogado');
if (!profStr) {
    window.location.href = 'login.html';
    return;
}
professorLogado = JSON.parse(profStr);
document.getElementById('profInfo').textContent =
    professorLogado.nome + ' • ' + professorLogado.materia + ' • ' + professorLogado.serie;
carregarMeusConteudos();
});

function sair() {
localStorage.removeItem('professorLogado');
window.location.href = 'login.html';
}

async function carregarMeusConteudos() {
if (!professorLogado) return;
const busca = document.getElementById('buscaConteudo').value.trim();
const lista = document.getElementById('listaConteudos');
lista.innerHTML = 'Carregando...';

const params = new URLSearchParams();
params.append('professor_id', professorLogado.id);
if (busca) params.append('busca', busca);

try {
    const resp = await fetch(API_BASE + 'professor_listar_conteudos.php?' + params.toString());
    const data = await resp.json();
    if (!Array.isArray(data) || data.length === 0) {
    lista.innerHTML = '<p>Nenhum conteúdo cadastrado.</p>';
    return;
    }
    lista.innerHTML = '';
    data.forEach(c => {
    const div = document.createElement('div');
    div.innerHTML = `<strong>${c.titulo}</strong><br>
                        <small>${c.materia} • ${c.serie} • ${c.criado_em}</small>`;
    div.onclick = () => abrirChatConteudo(c.id, c.titulo);
    lista.appendChild(div);
    });
} catch (e) {
    lista.innerHTML = '<p>Erro ao carregar conteúdos.</p>';
}
}

async function salvarConteudo() {
if (!professorLogado) return;
const titulo  = document.getElementById('ctTitulo').value.trim();
const materia = document.getElementById('ctMateria').value.trim();
const serie   = document.getElementById('ctSerie').value.trim();
const texto   = document.getElementById('ctTexto').value.trim();
const imagens = document.getElementById('ctImagens').value.trim();
const videos  = document.getElementById('ctVideos').value.trim();
const links   = document.getElementById('ctLinks').value.trim();
const msg     = document.getElementById('msgConteudo');
msg.style.color = '#ff5252';
msg.textContent = '';

if (!titulo || !materia || !serie) {
    msg.textContent = 'Título, matéria e série são obrigatórios.';
    return;
}

try {
    const formData = new FormData();
    formData.append("professor_id", professorLogado.id);
    formData.append("titulo", titulo);
    formData.append("materia", materia);
    formData.append("serie", serie);
    formData.append("texto", texto);
    formData.append("imagens", imagens);
    formData.append("videos", videos);
    formData.append("links", links);

    const resp = await fetch(API_BASE + 'professor_salvar_conteudo.php', {
        method: 'POST',
        body: formData
    });

    const data = await resp.json();
    if (data.sucesso) {
    msg.style.color = '#00c853';
    msg.textContent = 'Conteúdo salvo com sucesso.';
    carregarMeusConteudos();
    // opcional: limpar campos
    // document.getElementById('ctTitulo').value = '';
    // ...
    } else {
    msg.textContent = data.erro || 'Erro ao salvar conteúdo.';
    }
} catch (e) {
    msg.textContent = 'Falha de conexão.';
}
}

async function abrirChatConteudo(conteudoId, titulo) {
if (!professorLogado) return;
chatConteudoId = conteudoId;
chatAlunoId = null;
document.getElementById('chatTituloConteudo').textContent =
    'Chat do conteúdo: ' + titulo;
carregarMensagensProfessor();
}

async function carregarMensagensProfessor() {
if (!professorLogado || !chatConteudoId) {
    document.getElementById('chatMensagens').innerHTML = '<p>Selecione um conteúdo.</p>';
    return;
}
const div = document.getElementById('chatMensagens');
div.innerHTML = 'Carregando...';

const params = new URLSearchParams();
params.append('professor_id', professorLogado.id);
params.append('conteudo_id', chatConteudoId);

try {
    const resp = await fetch(API_BASE + 'professor_listar_mensagens.php?' + params.toString());
    const data = await resp.json();
    if (!Array.isArray(data) || data.length === 0) {
    div.innerHTML = '<p>Nenhuma mensagem neste conteúdo ainda.</p>';
    return;
    }
    div.innerHTML = '';
    data.forEach(m => {
    chatAlunoId = m.aluno_id; // último aluno que falou
    const msgDiv = document.createElement('div');
    msgDiv.className = 'msg ' + (m.origem === 'aluno' ? 'aluno' : 'professor');
    msgDiv.innerHTML = `
        <div class="autor">${m.origem === 'aluno' ? m.aluno_nome : 'Você'}</div>
        <div class="texto">${m.texto}</div>
        <div class="hora">${m.enviado_em}</div>
    `;
    div.appendChild(msgDiv);
    });
    div.scrollTop = div.scrollHeight;
} catch (e) {
    div.innerHTML = '<p>Erro ao carregar mensagens.</p>';
}
}

async function enviarResposta() {
if (!professorLogado || !chatConteudoId || !chatAlunoId) {
    document.getElementById('msgChat').textContent = 'Selecione um conteúdo com mensagens.';
    return;
}
const texto = document.getElementById('chatTexto').value.trim();
const msg = document.getElementById('msgChat');
msg.style.color = '#ff5252';
msg.textContent = '';
if (!texto) return;

try {
    const formData = new FormData();
    formData.append("conteudo_id", chatConteudoId);
    formData.append("aluno_id", chatAlunoId);
    formData.append("professor_id", professorLogado.id);
    formData.append("texto", texto);

    const resp = await fetch(API_BASE + 'professor_responder_mensagem.php', {
        method: 'POST',
        body: formData
    });

    const data = await resp.json();
    if (data.sucesso) {
    document.getElementById('chatTexto').value = '';
    msg.style.color = '#00c853';
    msg.textContent = 'Mensagem enviada.';
    carregarMensagensProfessor();
    } else {
    msg.textContent = data.erro || 'Erro ao enviar mensagem.';
    }
} catch (e) {
    msg.textContent = 'Falha de conexão.';
}
}