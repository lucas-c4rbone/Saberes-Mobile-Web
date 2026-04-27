const API_BASE = 'http://localhost/saberes/api/';

async function fazerLogin() {
const email = document.getElementById('loginEmail').value.trim();
const senha = document.getElementById('loginSenha').value.trim();
const msg = document.getElementById('msg');
msg.textContent = '';

if (!email || !senha) {
    msg.textContent = 'Preencha e-mail e senha.';
    return;
}

try {
    const formData = new FormData();
    formData.append("email", email);
    formData.append("senha", senha);

    const resp = await fetch(API_BASE + 'professor_login.php', {
        method: 'POST',
        body: formData
    });
    const data = await resp.json();
    if (data.sucesso) {
    // guarda os dados do professor no navegador
    localStorage.setItem('professorLogado', JSON.stringify(data.professor));
    // vai pra área logada
    window.location.href = 'dashboard.html';
    } else {
    msg.textContent = data.erro || 'E-mail ou senha inválidos.';
    }
} catch (e) {
    msg.textContent = 'Falha de conexão com o servidor.';
}
}