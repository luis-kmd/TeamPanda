const db = require('../config/db');

// Listar pagamentos do aluno logado
exports.meusPagamentos = async (req, res) => {
    const usuarioId = req.session.usuarioID;

    try {
        // Precisamos primeiro achar o ID de Aluno baseado no UsuarioID da sessão
        // Poderíamos guardar isso na sessão no login, mas vamos buscar rapidinho:
        const [aluno] = await db.query('SELECT ID FROM Alunos WHERE UsuarioID = ?', [usuarioId]);
        
        if (aluno.length === 0) return res.json([]); // Não é aluno

        const alunoId = aluno[0].ID;

        const sql = `
            SELECT * FROM Pagamentos 
            WHERE AlunoID = ? 
            ORDER BY DataVencimento DESC
        `;
        
        const [faturas] = await db.query(sql, [alunoId]);
        res.json(faturas);

    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao buscar pagamentos' });
    }
};

// Novo: Registrar Pagamento Manual e Ativar Aluno
exports.registrarPagamento = async (req, res) => {
    const { alunoId, referencia, valor, forma_pagamento, planoId } = req.body;
    
    if (!alunoId || !valor) {
        return res.status(400).json({ sucesso: false, mensagem: 'Dados incompletos.' });
    }

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        // 1. Registra o Pagamento no Histórico
        const sqlPagamento = `
            INSERT INTO Pagamentos 
            (AlunoID, Referencia, Valor, DataVencimento, DataPagamento, Status, FormaPagamento)
            VALUES (?, ?, ?, CURRENT_DATE, CURRENT_DATE, 'Pago', ?)
        `;
        await connection.query(sqlPagamento, [alunoId, referencia, valor, forma_pagamento]);

        // 2. ATUALIZAÇÃO DO ALUNO (O Pulo do Gato 🐱)
        if (planoId) {
            // Cenário A: Mudou de plano ou escolheu um novo
            // Atualiza o Plano E ativa o aluno
            await connection.query(
                'UPDATE Alunos SET PlanoID = ?, Status = 1 WHERE ID = ?', 
                [planoId, alunoId]
            );
        } else {
            // Cenário B: Pagou mensalidade do mesmo plano
            // Apenas reativa o aluno (caso estivesse bloqueado pelo robô)
            await connection.query(
                'UPDATE Alunos SET Status = 1 WHERE ID = ?', 
                [alunoId]
            );
        }

        await connection.commit();
        res.json({ sucesso: true, mensagem: 'Pagamento recebido e acesso liberado!' });

    } catch (erro) {
        if (connection) await connection.rollback();
        console.error(erro);
        res.status(500).json({ sucesso: false, mensagem: 'Erro ao registrar pagamento.' });
    } finally {
        if (connection) connection.release();
    }
};