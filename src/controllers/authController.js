const db = require('../config/db');
const bcrypt = require('bcryptjs');
const crypto = require('crypto'); // Nativo do Node, para gerar códigos aleatórios
const nodemailer = require('nodemailer');

// 1. Configuração do Enviador de E-mail (Fake/Teste)
// Quando for para produção, você troca isso pelos dados do Gmail/SendGrid
let transporter;

async function criarTransporter() {
    if (transporter) return transporter;

    // Cria conta de teste automaticamente no Ethereal
    const testAccount = await nodemailer.createTestAccount();

    transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
            user: testAccount.user,
            pass: testAccount.pass,
        },
    });
    return transporter;
}

// 2. Solicitar Recuperação (Gera Token e Envia Email)
exports.esqueciSenha = async (req, res) => {
    const { email } = req.body;

    try {
        const [user] = await db.query('SELECT ID FROM Usuarios WHERE Email = ?', [email]);
        
        if (user.length === 0) {
            // Por segurança, não dizemos que o e-mail não existe, apenas dizemos "Se existir, enviamos"
            // Mas para facilitar seu teste agora, vou retornar erro 404
            return res.status(404).json({ sucesso: false, mensagem: 'E-mail não cadastrado.' });
        }

        const id = user[0].ID;

        // Gera um token aleatório e data de expiração (1 hora)
        const token = crypto.randomBytes(20).toString('hex');
        const agora = new Date();
        agora.setHours(agora.getHours() + 1);

        // Salva no banco
        await db.query('UPDATE Usuarios SET ResetToken = ?, ResetExpires = ? WHERE ID = ?', [token, agora, id]);

        // Envia o e-mail
        const transport = await criarTransporter();
        
        // Link que o usuário clicaria (no seu front teria uma pagina reset-password.html)
        // Como não temos essa página ainda, vamos mandar o token puro para testar
        const info = await transport.sendMail({
            from: '"TeamPanda" <nao-responda@teampanda.com>',
            to: email,
            subject: 'Recuperação de Senha',
            html: `<p>Você pediu para recuperar a senha.</p>
                   <p>Use este token: <b>${token}</b></p>
                   <p>Ou imagine que isso é um link: <a href="http://localhost:3000/resetar?token=${token}">Clique aqui</a></p>`
        });

        console.log('URL para visualizar o e-mail:', nodemailer.getTestMessageUrl(info));

        res.json({ 
            sucesso: true, 
            mensagem: 'E-mail enviado! (Olhe o console do Node.js para ver o link do Ethereal)' 
        });

    } catch (erro) {
        console.error(erro);
        res.status(500).json({ sucesso: false, mensagem: 'Erro ao tentar recuperar senha.' });
    }
};

// 3. Resetar a Senha (Recebe Token + Nova Senha)
exports.resetarSenha = async (req, res) => {
    const { email, token, nova_senha } = req.body;

    try {
        // Busca usuário pelo email que tenha esse token e que não esteja expirado
        const [users] = await db.query(`
            SELECT ID FROM Usuarios 
            WHERE Email = ? AND ResetToken = ? AND ResetExpires > NOW()
        `, [email, token]);

        if (users.length === 0) {
            return res.status(400).json({ sucesso: false, mensagem: 'Token inválido ou expirado.' });
        }

        const id = users[0].ID;
        const hash = await bcrypt.hash(nova_senha, 10);

        // Atualiza a senha e limpa o token (para não ser usado de novo)
        await db.query(`
            UPDATE Usuarios 
            SET Senha = ?, ResetToken = NULL, ResetExpires = NULL 
            WHERE ID = ?
        `, [hash, id]);

        res.json({ sucesso: true, mensagem: 'Senha alterada com sucesso! Faça login.' });

    } catch (erro) {
        console.error(erro);
        res.status(500).json({ sucesso: false, mensagem: 'Erro ao resetar senha.' });
    }
};