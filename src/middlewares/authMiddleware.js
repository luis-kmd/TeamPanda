// src/middlewares/authMiddleware.js

// 1. Verifica apenas se o usuário está logado (para Alunos e Professores)
exports.estaLogado = (req, res, next) => {
    if (req.session && req.session.usuarioID) {
        return next(); // Pode passar
    }
    // Se não tiver sessão, nega o acesso
    return res.status(401).json({ sucesso: false, mensagem: 'Acesso negado. Faça login para continuar.' });
};

// 2. Verifica se é Professor ou Admin (Para rotas administrativas)
exports.ehProfessor = (req, res, next) => {
    // Primeiro checa se está logado
    if (!req.session || !req.session.usuarioID) {
        return res.status(401).json({ sucesso: false, mensagem: 'Faça login.' });
    }

    // Depois checa o perfil
    const perfil = req.session.perfil;
    if (perfil === 'admin' || perfil === 'professor') {
        return next(); // É chefe, pode passar
    }

    // Se for aluno tentando entrar aqui...
    return res.status(403).json({ sucesso: false, mensagem: 'Acesso restrito a professores.' });
};