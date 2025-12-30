const db = require('../config/db');

exports.dadosDashboard = async (req, res) => {
    try {
        // 1. Total de Alunos Ativos
        const [totalAtivos] = await db.query('SELECT COUNT(*) as total FROM Alunos WHERE Status = 1');
        
        // 2. Faturamento Mensal Estimado (Soma dos planos dos alunos ativos)
        const [faturamento] = await db.query(`
            SELECT SUM(P.Preco) as total 
            FROM Alunos A 
            JOIN Planos P ON A.PlanoID = P.ID 
            WHERE A.Status = 1
        `);

        // 3. Distribuição por Plano (Quantos alunos em cada plano)
        const [porPlano] = await db.query(`
            SELECT P.Nome, COUNT(A.ID) as qtd 
            FROM Planos P
            LEFT JOIN Alunos A ON P.ID = A.PlanoID AND A.Status = 1
            GROUP BY P.ID, P.Nome
            HAVING qtd > 0
        `);

        // 4. Ativos vs Inativos
        const [status] = await db.query(`
            SELECT 
                SUM(CASE WHEN Status = 1 THEN 1 ELSE 0 END) as ativos,
                SUM(CASE WHEN Status = 0 THEN 1 ELSE 0 END) as inativos
            FROM Alunos
        `);

        res.json({
            alunosAtivos: totalAtivos[0].total || 0,
            receitaMensal: faturamento[0].total || 0,
            alunosPorPlano: porPlano,
            status: status[0]
        });

    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao gerar relatórios' });
    }
};