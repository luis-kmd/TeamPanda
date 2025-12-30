const db = require('../config/db');

// 1. Registrar Presença (Manual pelo Professor)
exports.registrarPresenca = async (req, res) => {
    const { alunoId } = req.body;
    
    try {
        // Verifica se já tem presença hoje para não duplicar
        const [existe] = await db.query(
            'SELECT ID FROM Frequencia WHERE AlunoID = ? AND DataPresenca = CURRENT_DATE', 
            [alunoId]
        );
        
        if (existe.length > 0) {
            return res.status(400).json({ sucesso: false, mensagem: 'Aluno já fez check-in hoje!' });
        }

        await db.query('INSERT INTO Frequencia (AlunoID, DataPresenca) VALUES (?, CURRENT_DATE)', [alunoId]);
        res.json({ sucesso: true, mensagem: 'Presença confirmada! 🔥' });

    } catch (erro) {
        console.error(erro);
        res.status(500).json({ sucesso: false, mensagem: 'Erro ao registrar presença.' });
    }
};

// 2. Dados de Evolução do Aluno (Ofensiva e Ranking)
exports.getDadosEvolucao = async (req, res) => {
    const usuarioId = req.session.usuarioID;

    try {
        // A. Descobre o ID do Aluno
        const [aluno] = await db.query('SELECT ID, NomeCompleto FROM Alunos WHERE UsuarioID = ?', [usuarioId]);
        if (aluno.length === 0) return res.json({ erro: 'Aluno não encontrado' });
        const meuId = aluno[0].ID;
        const meuNome = aluno[0].NomeCompleto;

        // B. Calcula Frequência no Mês Atual
        const [freqMes] = await db.query(`
            SELECT COUNT(*) as total 
            FROM Frequencia 
            WHERE AlunoID = ? AND MONTH(DataPresenca) = MONTH(CURRENT_DATE) AND YEAR(DataPresenca) = YEAR(CURRENT_DATE)
        `, [meuId]);

        // C. Calcula Ofensiva (Dias consecutivos até ontem/hoje)
        // Lógica simplificada: Busca os últimos 30 registros e conta a sequência no JS
        const [historico] = await db.query(`
            SELECT DataPresenca FROM Frequencia 
            WHERE AlunoID = ? 
            ORDER BY DataPresenca DESC LIMIT 30
        `, [meuId]);

        let ofensiva = 0;
        let dataEsperada = new Date();
        // Zera hora para comparar apenas datas
        dataEsperada.setHours(0,0,0,0);

        // Se o último treino não foi hoje, verificamos se foi ontem. Se não, a ofensiva quebrou.
        if (historico.length > 0) {
            const ultimoTreino = new Date(historico[0].DataPresenca);
            ultimoTreino.setHours(0,0,0,0);
            
            const ontem = new Date();
            ontem.setDate(ontem.getDate() - 1);
            ontem.setHours(0,0,0,0);

            // Se treinou hoje ou ontem, a sequência está ativa
            if (ultimoTreino.getTime() === dataEsperada.getTime() || ultimoTreino.getTime() === ontem.getTime()) {
                // Loop para contar para trás
                for (let i = 0; i < historico.length; i++) {
                    const diaTreino = new Date(historico[i].DataPresenca);
                    diaTreino.setHours(0,0,0,0);
                    
                    // Diferença em dias
                    const diffTime = Math.abs(dataEsperada.getTime() - diaTreino.getTime());
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
                    
                    if (diffDays <= i + 1) { // Permite "hoje" contar como sequência do loop
                        ofensiva++;
                    } else {
                        break; // Quebrou a sequência
                    }
                }
            }
        }

        // D. Ranking (Top 5 do Mês)
        const [rankingGeral] = await db.query(`
            SELECT A.NomeCompleto, COUNT(F.ID) as Treinos
            FROM Frequencia F
            JOIN Alunos A ON F.AlunoID = A.ID
            WHERE MONTH(F.DataPresenca) = MONTH(CURRENT_DATE)
            GROUP BY A.ID
            ORDER BY Treinos DESC
        `);

        // Formatar Ranking (Top 5 + Minha Posição)
        let minhaPosicao = 0;
        const top5 = rankingGeral.slice(0, 5).map((r, index) => {
            if (r.NomeCompleto === meuNome) minhaPosicao = index + 1;
            return {
                nome: r.NomeCompleto.split(' ')[0], // Só o primeiro nome para privacidade
                treinos: r.Treinos,
                posicao: index + 1
            };
        });

        // Se eu não estou no top 5, descobre minha posição
        if (minhaPosicao === 0) {
            const index = rankingGeral.findIndex(r => r.NomeCompleto === meuNome);
            if (index !== -1) minhaPosicao = index + 1;
        }

        res.json({
            ofensiva,
            treinosMes: freqMes[0].total,
            ranking: top5,
            minhaPosicao,
            historico: historico // Para pintar o calendário se quiser
        });

    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao calcular evolução' });
    }
};