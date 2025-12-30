const db = require('../config/db');
const bcrypt = require('bcryptjs');

// 1. Obter dados do usuário logado
exports.meuPerfil = async (req, res) => {
    const id = req.session.usuarioID;
    try {
        const [usuarios] = await db.query('SELECT ID, NomeCompleto, Email, Telefone, Perfil FROM Usuarios WHERE ID = ?', [id]);
        
        if (usuarios.length === 0) return res.status(404).json({ erro: 'Usuário não encontrado' });
        
        res.json(usuarios[0]);
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao buscar perfil' });
    }
};

// 2. Atualizar perfil (com opção de senha)
exports.atualizarPerfil = async (req, res) => {
    const id = req.session.usuarioID;
    const { nome, email, telefone, senha, confirmar_senha } = req.body;

    // Validação básica de senha
    if (senha && senha !== confirmar_senha) {
        return res.status(400).json({ sucesso: false, mensagem: 'As senhas não coincidem.' });
    }

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        // Atualiza dados básicos
        let sql = 'UPDATE Usuarios SET NomeCompleto = ?, Email = ?, Telefone = ? WHERE ID = ?';
        let params = [nome, email, telefone, id];

        await connection.query(sql, params);

        // Se o usuário digitou uma nova senha, atualiza ela também
        if (senha && senha.trim() !== '') {
            const hash = await bcrypt.hash(senha, 10);
            await connection.query('UPDATE Usuarios SET Senha = ? WHERE ID = ?', [hash, id]);
        }
        
        // Atualiza a sessão para refletir o novo nome imediatamente
        req.session.usuarioNome = nome;

        await connection.commit();
        res.json({ sucesso: true, mensagem: 'Perfil atualizado com sucesso!' });

    } catch (erro) {
        if (connection) await connection.rollback();
        console.error(erro);
        res.status(500).json({ sucesso: false, mensagem: 'Erro ao atualizar perfil.' });
    } finally {
        if (connection) connection.release();
    }
};