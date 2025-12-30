const db = require('../config/db');

// 1. Listar Planos (com suas características)
exports.listarTodos = async (req, res) => {
    try {
        // Busca todos os planos
        const [planos] = await db.query('SELECT * FROM Planos ORDER BY Preco ASC');
        
        // Busca todas as características
        const [features] = await db.query('SELECT * FROM PlanoCaracteristicas');
        
        // Junta as características dentro de cada plano (Manual Join no JS)
        const planosCompletos = planos.map(plano => {
            return {
                ...plano,
                features: features.filter(f => f.PlanoID === plano.ID)
            };
        });

        res.json(planosCompletos);
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao buscar planos' });
    }
};

exports.listarParaSelect = async (req, res) => {
    try {
        // TEM QUE TER O CAMPO 'Preco' AQUI:
        const [planos] = await db.query('SELECT ID, Nome, Preco FROM Planos ORDER BY Nome ASC');
        res.json(planos);
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao buscar lista simples' });
    }
};
// 3. Criar Plano (Com Transaction)
exports.criarPlano = async (req, res) => {
    const { nome, preco, destaque, features, feature_included } = req.body;
    const criadoPor = req.session.usuarioID;
    const destaqueBool = destaque ? 1 : 0;
    
    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        // Insere o Plano
        const [result] = await connection.query(
            'INSERT INTO Planos (Nome, Preco, Destaque, CriadoPor) VALUES (?, ?, ?, ?)',
            [nome, preco, destaqueBool, criadoPor]
        );
        const planoID = result.insertId;

        // Insere as Características (se houver)
        // O front manda arrays: features[] e feature_included[]
        if (features && Array.isArray(features)) {
            for (let i = 0; i < features.length; i++) {
                if (features[i].trim() !== '') {
                    const incluido = feature_included && feature_included[i] === 'on' ? 1 : 0;
                    await connection.query(
                        'INSERT INTO PlanoCaracteristicas (PlanoID, Descricao, Incluido) VALUES (?, ?, ?)',
                        [planoID, features[i], incluido]
                    );
                }
            }
        }

        await connection.commit();
        res.json({ sucesso: true, mensagem: 'Plano criado com sucesso!' });

    } catch (erro) {
        if (connection) await connection.rollback();
        console.error(erro);
        res.status(500).json({ sucesso: false, mensagem: 'Erro ao criar plano.' });
    } finally {
        if (connection) connection.release();
    }
};

// 4. Excluir Plano
exports.excluirPlano = async (req, res) => {
    const { id } = req.params;
    try {
        // Como configuramos ON DELETE RESTRICT no Usuario, mas ON DELETE CASCADE nas Caracteristicas:
        // Se tiver aluno vinculado, vai dar erro (o que é bom, protege o sistema).
        // Se não tiver aluno, apaga o plano e as características somem sozinhas.
        
        await db.query('DELETE FROM Planos WHERE ID = ?', [id]);
        res.json({ sucesso: true, mensagem: 'Plano excluído!' });
    } catch (erro) {
        console.error(erro);
        if (erro.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(400).json({ sucesso: false, mensagem: 'Não é possível excluir: Existem alunos neste plano.' });
        }
        res.status(500).json({ sucesso: false, mensagem: 'Erro ao excluir plano.' });
    }
};

// 5. Buscar Plano por ID (Para Edição)
exports.buscarPorId = async (req, res) => {
    const { id } = req.params;
    try {
        const [planos] = await db.query('SELECT * FROM Planos WHERE ID = ?', [id]);
        if (planos.length === 0) return res.status(404).json({ erro: 'Plano não encontrado' });
        
        const [features] = await db.query('SELECT * FROM PlanoCaracteristicas WHERE PlanoID = ?', [id]);
        
        res.json({ ...planos[0], features });
    } catch (erro) {
        res.status(500).json({ erro: 'Erro ao buscar plano' });
    }
}

// 6. Atualizar Plano (PUT)
exports.atualizarPlano = async (req, res) => {
    const { id } = req.params;
    const { nome, preco, destaque, features, feature_included } = req.body;
    const destaqueBool = destaque ? 1 : 0;

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        // 1. Atualiza os dados básicos do plano
        await connection.query(
            'UPDATE Planos SET Nome=?, Preco=?, Destaque=? WHERE ID=?',
            [nome, preco, destaqueBool, id]
        );

        // 2. Atualiza as Características
        // Estratégia: Apaga TODAS as características desse plano e recria as que vieram no formulário
        await connection.query('DELETE FROM PlanoCaracteristicas WHERE PlanoID = ?', [id]);

        // Recria (se houver)
        // Nota: Se vier apenas 1 item, o express pode não transformar em array, então forçamos:
        const featuresArray = Array.isArray(features) ? features : (features ? [features] : []);
        const includedArray = Array.isArray(feature_included) ? feature_included : (feature_included ? [feature_included] : []);

        for (let i = 0; i < featuresArray.length; i++) {
            if (featuresArray[i] && featuresArray[i].trim() !== '') {
                // Se o checkbox correspondente estiver marcado, vem 'on'
                // Se for um array de checkboxes, pegamos o índice correspondente
                // Atenção: Checkboxes não marcados não enviam valor no post padrão, 
                // mas como estamos montando via JS, vamos assumir paridade de índices ou tratar no front.
                
                // Simplificação: No front, vamos garantir que envie hidden ou checkbox
                const incluido = includedArray[i] === 'on' ? 1 : 0;
                
                await connection.query(
                    'INSERT INTO PlanoCaracteristicas (PlanoID, Descricao, Incluido) VALUES (?, ?, ?)',
                    [id, featuresArray[i], incluido]
                );
            }
        }

        await connection.commit();
        res.json({ sucesso: true, mensagem: 'Plano atualizado com sucesso!' });

    } catch (erro) {
        if (connection) await connection.rollback();
        console.error(erro);
        res.status(500).json({ sucesso: false, mensagem: 'Erro ao atualizar plano.' });
    } finally {
        if (connection) connection.release();
    }
}