// server.js
require('dotenv').config();
const express = require('express');
const path = require('path');
const db = require('./src/config/db'); 
const session = require('express-session');
const bcrypt = require('bcryptjs');
const cronInadimplentes = require('./src/jobs/verificarInadimplentes'); // <--- Importe

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para processar JSON (importante para receber dados de formulários)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')));

// 1. Configuração da Sessão (Memória do Servidor)
app.use(session({
    secret: 'segredo-super-secreto-do-panda', // Mude para algo aleatório em produção
    resave: false,
    saveUninitialized: false,
    // Use true se estiver usando HTTPS
    cookie: { secure: false } 
}));

// 2. Rota de LOGIN (Recebe o email/senha do front)
// Rota de LOGIN (Agora por CPF)
app.post('/login', async (req, res) => {
    let { cpf, senha } = req.body; // Recebe 'cpf' em vez de 'email'

    try {
        // 1. Limpa o CPF (tira pontos e traços) para garantir
        // (Assumindo que vamos salvar no banco apenas números ou texto limpo. 
        // Se você prefere salvar com pontuação, remova a linha abaixo).
        // Minha sugestão: Salve COM pontuação no banco para padronizar visualmente, 
        // ou SEM pontuação para padronizar dados.
        // VAMOS ASSUMIR QUE VEM COM PONTUAÇÃO DO FRONT, JÁ QUE A MÁSCARA MANDA ASSIM.
        
        // Busca o usuário pelo CPF
        cpf = cpf.replace(/[^\d]+/g, '');
        const [usuarios] = await db.query('SELECT * FROM Usuarios WHERE CPF = ?', [cpf]);
        
        if (usuarios.length === 0) {
            return res.status(401).json({ sucesso: false, mensagem: 'CPF não encontrado!' });
        }

        const usuario = usuarios[0];

        // Compara a senha
        const senhaBate = await bcrypt.compare(senha, usuario.Senha);

        if (!senhaBate) {
            return res.status(401).json({ sucesso: false, mensagem: 'Senha incorreta!' });
        }

        // Login aprovado
        req.session.usuarioID = usuario.ID;
        req.session.usuarioNome = usuario.NomeCompleto;
        req.session.perfil = usuario.Perfil;

        let destino = '/dashboard/aluno';
        if (usuario.Perfil === 'professor' || usuario.Perfil === 'admin') {
            destino = '/dashboard/professor';
        }

        res.json({ sucesso: true, destino: destino });

    } catch (erro) {
        console.error(erro);
        res.status(500).json({ sucesso: false, mensagem: 'Erro no servidor.' });
    }
});

// 3. Rota auxiliar para CRIAR um usuário de teste (já criptografando a senha)
// Acesse http://localhost:3000/criar-admin uma vez para criar seu primeiro usuário
app.get('/criar-admin', async (req, res) => {
    const senhaForte = await bcrypt.hash('123456', 10); // Cria hash da senha "123456"
    try {
        await db.query(`
            INSERT INTO Usuarios (NomeCompleto, Email, Senha, Perfil) 
            VALUES ('Admin Panda', 'admin@panda.com', ?, 'admin')
        `, [senhaForte]);
        res.send('Usuário Admin criado! Login: admin@panda.com / Senha: 123456');
    } catch (e) {
        res.send('Erro (provavelmente email já existe): ' + e.message);
    }
});

// 4. Rotas Protegidas (Dashboard)
// Só deixa entrar se tiver sessão
app.get('/dashboard/professor', (req, res) => {
    if (!req.session.usuarioID) return res.redirect('/');
    // Serve o arquivo da pasta professores
    res.sendFile(path.join(__dirname, 'public/professores/index.html'));
});

app.get('/dashboard/aluno', (req, res) => {
    if (!req.session.usuarioID) return res.redirect('/');
    // Serve o arquivo da pasta alunos
    res.sendFile(path.join(__dirname, 'public/alunos/index.html'));
});

// 5. Logout
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

// --- SERVIR ARQUIVOS ESTÁTICOS ---
// Libera o acesso às pastas que você moveu para dentro de /public
const apiRoutes = require('./src/routes/api');
const { log } = require('console');
app.use('/api', apiRoutes)

// --- ROTAS DE PÁGINAS ---
// Quando acessar a raiz, manda para o login
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/login/index.html'));
});

// --- ROTA DE TESTE DA API (Para ver se o banco traz dados) ---
app.get('/api/teste-db', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT 1 + 1 AS resultado');
        res.json({ 
            mensagem: 'Banco conectado!', 
            calculo_banco: rows[0].resultado 
        });
    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

cronInadimplentes.iniciarJob();

// --- INICIAR SERVIDOR ---
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});