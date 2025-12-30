const bcrypt = require('bcryptjs');
const db = require('../config/db');
// IMPORTANTE: Importar o validador que criamos
const { validarCPF } = require('../utils/validators'); // <--- ESSA LINHA ERA A QUE FALTAVA

// 1. Listar
exports.listarAlunos = async (req, res) => {
    try {
        const sql = `
            SELECT A.ID, A.NomeCompleto, A.Email, A.Telefone, A.Status, P.Nome AS Plano
            FROM Alunos A
            LEFT JOIN Planos P ON A.PlanoID = P.ID
            ORDER BY A.NomeCompleto ASC
        `;
        const [alunos] = await db.query(sql);
        res.json(alunos);
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ mensagem: 'Erro interno' });
    }
};

// 2. Criar Aluno (Com Validação de CPF)
exports.criarAluno = async (req, res) => {
    const { nome, email, telefone, cpf, nascimento, rua, bairro, plano, observacoes, status } = req.body;
    const professorId = req.session.usuarioID; 
    const statusBooleano = status ? 1 : 0;

    if (cpf) cpf = cpf.replace(/[^\d]+/g, '');

    // --- VALIDAÇÃO DE CPF (O CÓDIGO QUE FALTAVA) ---
    if (!cpf || !validarCPF(cpf)) {
        return res.status(400).json({ sucesso: false, mensagem: 'CPF inválido. Verifique os números.' });
    }
    // -----------------------------------------------

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        // Verifica email duplicado
        const [userExists] = await connection.query('SELECT ID FROM Usuarios WHERE Email = ?', [email]);
        if (userExists.length > 0) {
            throw new Error('Este e-mail já está sendo usado.');
        }

        // Verifica CPF duplicado (Segurança extra)
        const [cpfExists] = await connection.query('SELECT ID FROM Alunos WHERE CPF = ?', [cpf]);
        if (cpfExists.length > 0) {
            throw new Error('Este CPF já está cadastrado.');
        }

        // Cria Usuario
        const senhaHash = await bcrypt.hash('123456', 10);
        const sqlUsuario = `
            INSERT INTO Usuarios (NomeCompleto, Email, CPF, Senha, Perfil, Telefone, DataNascimento, Rua, Bairro)
            VALUES (?, ?, ?, ?, 'aluno', ?, ?, ?, ?)
        `;
        const [userResult] = await connection.query(sqlUsuario, [
            nome, email, cpf, senhaHash, telefone, nascimento, rua, bairro
        ]);
        const novoUsuarioID = userResult.insertId;

        // Cria Aluno
        const sqlAluno = `INSERT INTO Alunos (UsuarioID, NomeCompleto, Email, CPF, Telefone, DataNascimento, Rua, Bairro, PlanoID, Observacoes, Status, ProfessorID) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        await connection.query(sqlAluno, [novoUsuarioID, nome, email, cpf, telefone, nascimento, rua, bairro, plano, observacoes, statusBooleano, professorId]);

        await connection.commit();
        res.json({ sucesso: true, mensagem: 'Aluno cadastrado! Senha: 123456' });

    } catch (erro) {
        if (connection) await connection.rollback();
        console.error(erro);
        // Retorna mensagem amigável se for erro de duplicação
        const msg = erro.message.includes('e-mail') || erro.message.includes('CPF') ? erro.message : 'Erro ao cadastrar.';
        res.status(500).json({ sucesso: false, mensagem: msg });
    } finally {
        if (connection) connection.release();
    }
};

// 3. Atualizar Aluno (Com Validação de CPF)
exports.atualizarAluno = async (req, res) => {
    const { id } = req.params;
    const { nome, email, telefone, cpf, nascimento, rua, bairro, plano, observacoes, status } = req.body;
    const statusBool = status ? 1 : 0;

    if (cpf) cpf = cpf.replace(/[^\d]+/g, '');

    // --- VALIDAÇÃO DE CPF ---
    if (cpf && !validarCPF(cpf)) {
        return res.status(400).json({ sucesso: false, mensagem: 'CPF inválido. Verifique os dígitos.' });
    }
    // ------------------------

    try {
        const sql = `
            UPDATE Alunos SET 
                NomeCompleto = ?, Email = ?, CPF = ?, Telefone = ?, DataNascimento = ?, 
                Rua = ?, Bairro = ?, PlanoID = ?, Observacoes = ?, Status = ?
            WHERE ID = ?
        `;
        await db.query(sql, [nome, email, cpf, telefone, nascimento, rua, bairro, plano, observacoes, statusBool, id]);
        res.json({ sucesso: true, mensagem: 'Aluno atualizado!' });
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ sucesso: false, mensagem: 'Erro ao atualizar.' });
    }
};

exports.meuPerfil = async (req, res) => {
    const usuarioId = req.session.usuarioID;
    try {
        const sql = `SELECT A.*, P.Nome as PlanoNome, P.Preco as PlanoPreco FROM Alunos A LEFT JOIN Planos P ON A.PlanoID = P.ID WHERE A.UsuarioID = ?`;
        const [dados] = await db.query(sql, [usuarioId]);
        if (dados.length === 0) return res.status(404).json({ erro: 'Aluno não encontrado.' });
        res.json(dados[0]);
    } catch (erro) {
        res.status(500).json({ erro: 'Erro interno.' });
    }
};

// 1. Buscar um único aluno pelo ID (Com dados do Plano para o Pagamento)
// src/controllers/alunoController.js

exports.buscarPorId = async (req, res) => {
    const { id } = req.params;
    try {
        // CORREÇÃO: Adicionado o JOIN para pegar o preço do plano
        const sql = `
            SELECT 
                A.*, 
                P.Nome as PlanoNome, 
                P.Preco as PlanoPreco 
            FROM Alunos A
            LEFT JOIN Planos P ON A.PlanoID = P.ID
            WHERE A.ID = ?
        `;
        
        const [rows] = await db.query(sql, [id]);
        
        if (rows.length === 0) return res.status(404).json({ erro: 'Aluno não encontrado' });
        
        res.json(rows[0]);
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao buscar aluno' });
    }
};

// 3. Atualizar Aluno (Com Validação de CPF)
exports.atualizarAluno = async (req, res) => {
    const { id } = req.params;
    const { nome, email, telefone, cpf, nascimento, rua, bairro, plano, observacoes, status } = req.body;
    const statusBool = status ? 1 : 0;

    // --- VALIDAÇÃO DE CPF ---
    if (cpf && !validarCPF(cpf)) {
        return res.status(400).json({ sucesso: false, mensagem: 'CPF inválido. Verifique os dígitos.' });
    }
    // ------------------------

    try {
        const sql = `
            UPDATE Alunos SET 
                NomeCompleto = ?, Email = ?, CPF = ?, Telefone = ?, DataNascimento = ?, 
                Rua = ?, Bairro = ?, PlanoID = ?, Observacoes = ?, Status = ?
            WHERE ID = ?
        `;
        await db.query(sql, [nome, email, cpf, telefone, nascimento, rua, bairro, plano, observacoes, statusBool, id]);
        res.json({ sucesso: true, mensagem: 'Aluno atualizado!' });
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ sucesso: false, mensagem: 'Erro ao atualizar.' });
    }
};

// 3. Excluir Aluno (DELETE)
exports.excluirAluno = async (req, res) => {
    const { id } = req.params;
    try {
        const [aluno] = await db.query('SELECT UsuarioID FROM Alunos WHERE ID = ?', [id]);
        if (aluno.length > 0 && aluno[0].UsuarioID) {
            await db.query('DELETE FROM Usuarios WHERE ID = ?', [aluno[0].UsuarioID]);
        } else {
            await db.query('DELETE FROM Alunos WHERE ID = ?', [id]);
        }
        res.json({ sucesso: true, mensagem: 'Aluno excluído com sucesso!' });
    } catch (erro) {
        res.status(500).json({ sucesso: false, mensagem: 'Erro ao excluir.' });
    }
};

// 4. Buscar detalhes do Plano do Aluno (com características)
exports.meuPlanoDetalhado = async (req, res) => {
    const usuarioId = req.session.usuarioID;
    try {
        const [plano] = await db.query(`SELECT P.*, A.DataCriacao as DataMatricula FROM Alunos A JOIN Planos P ON A.PlanoID = P.ID WHERE A.UsuarioID = ?`, [usuarioId]);
        if (plano.length === 0) return res.json({ temPlano: false });
        const dadosPlano = plano[0];
        const [features] = await db.query('SELECT Descricao, Incluido FROM PlanoCaracteristicas WHERE PlanoID = ?', [dadosPlano.ID]);
        const [outrosPlanos] = await db.query('SELECT ID, Nome, Preco FROM Planos WHERE ID != ? ORDER BY Preco ASC', [dadosPlano.ID]);
        res.json({ temPlano: true, plano: { ...dadosPlano, features }, outros: outrosPlanos });
    } catch (erro) {
        res.status(500).json({ erro: 'Erro ao buscar plano' });
    }
};

// ... (mantenha o código anterior) ...

// 5. Atualizar Perfil do Aluno (Senha e Dados)
exports.atualizarPerfil = async (req, res) => {
    const usuarioId = req.session.usuarioID;
    
    // Recebe tudo que o formulário mandar
    const { 
        senha_atual, nova_senha, confirmar_senha, // Para troca de senha
        email, telefone, rua, bairro, nascimento // Para dados cadastrais
    } = req.body;

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        // --- PARTE 1: TROCA DE SENHA (Se enviada) ---
        if (nova_senha && nova_senha.trim() !== '') {
            if (nova_senha !== confirmar_senha) {
                throw new Error('As novas senhas não coincidem.');
            }

            // Busca senha atual para verificar
            const [user] = await connection.query('SELECT Senha FROM Usuarios WHERE ID = ?', [usuarioId]);
            
            // Verifica se a senha atual bate (segurança)
            // Se o campo senha_atual vier vazio, podemos decidir se exigimos ou não. 
            // Por segurança, é bom exigir.
            if (!senha_atual || !(await bcrypt.compare(senha_atual, user[0].Senha))) {
                throw new Error('Senha atual incorreta.');
            }

            // Criptografa e salva a nova
            const hash = await bcrypt.hash(nova_senha, 10);
            await connection.query('UPDATE Usuarios SET Senha = ? WHERE ID = ?', [hash, usuarioId]);
        }

        // --- PARTE 2: ATUALIZAR DADOS CADASTRAIS (Se enviados) ---
        // Atualiza tabela USUARIOS (Login principal)
        if (email || telefone) {
            // Nota: Se mudar o email, verifica se já existe
            if(email) {
                 const [existente] = await connection.query('SELECT ID FROM Usuarios WHERE Email = ? AND ID != ?', [email, usuarioId]);
                 if(existente.length > 0) throw new Error('Este e-mail já está em uso.');
            }

            // Monta query dinâmica ou fixa (aqui faremos fixa para simplificar, usando COALESCE para não zerar se vier null)
            // Mas como vamos enviar os dados carregados na tela, podemos dar UPDATE direto.
            const sqlUser = `
                UPDATE Usuarios SET 
                    Email = COALESCE(?, Email), 
                    Telefone = COALESCE(?, Telefone),
                    Rua = COALESCE(?, Rua), 
                    Bairro = COALESCE(?, Bairro)
                WHERE ID = ?
            `;
            await connection.query(sqlUser, [email, telefone, rua, bairro, usuarioId]);
        }

        // Atualiza tabela ALUNOS (Dados físicos/redundantes)
        // Precisamos atualizar aqui também para o professor ver os dados novos
        const sqlAluno = `
            UPDATE Alunos SET 
                Email = COALESCE(?, Email), 
                Telefone = COALESCE(?, Telefone),
                Rua = COALESCE(?, Rua), 
                Bairro = COALESCE(?, Bairro)
            WHERE UsuarioID = ?
        `;
        await connection.query(sqlAluno, [email, telefone, rua, bairro, usuarioId]);

        await connection.commit();
        res.json({sucesso: true, mensagem: "Função de atualizar perfil mantida"});

    } catch (erro) {
        if (connection) await connection.rollback();
        console.error(erro);
        res.status(400).json({ sucesso: false, mensagem: erro.message || 'Erro ao atualizar.' });
    } finally {
        if (connection) connection.release();
    }
}

// 6. Upload de Foto de Perfil
// Vou incluir uploadFoto e buscarPorId para garantir que o arquivo fique completo com o que você tinha:
exports.uploadFoto = async (req, res) => {
    const usuarioId = req.session.usuarioID;
    if (!req.file) return res.status(400).json({ sucesso: false, mensagem: 'Nenhum arquivo enviado.' });
    const nomeArquivo = req.file.filename;
    try {
        await db.query('UPDATE Alunos SET FotoPath = ? WHERE UsuarioID = ?', [nomeArquivo, usuarioId]);
        res.json({ sucesso: true, mensagem: 'Foto atualizada!', novoCaminho: `/uploads/perfil/${nomeArquivo}` });
    } catch (erro) {
        res.status(500).json({ sucesso: false, mensagem: 'Erro ao salvar.' });
    }
};