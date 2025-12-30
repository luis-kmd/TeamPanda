const express = require('express');
const router = express.Router();
const upload = require('../config/upload');

// Importar os Controllers
const alunoController = require('../controllers/alunoController');
const planoController = require('../controllers/planoController');
const usuarioController = require('../controllers/usuarioController');
const relatorioController = require('../controllers/relatorioController');
const pagamentoController = require('../controllers/pagamentoController');
const frequenciaController = require('../controllers/frequenciaController');
const authController = require('../controllers/authController');


// Importar Middlewares
const { estaLogado, ehProfessor } = require('../middlewares/authMiddleware');

// ==============================================
// ÁREA RESTRITA DO PROFESSOR (Gestão)
// ==============================================

// --- ALUNOS ---
router.get('/alunos', ehProfessor, alunoController.listarAlunos);
router.post('/alunos', ehProfessor, alunoController.criarAluno);
router.get('/alunos/:id', ehProfessor, alunoController.buscarPorId);
router.put('/alunos/:id', ehProfessor, alunoController.atualizarAluno);
router.delete('/alunos/:id', ehProfessor, alunoController.excluirAluno);
router.post('/pagamentos/novo', ehProfessor, pagamentoController.registrarPagamento);

// --- PLANOS ---
// 1. Listar Todos (Para a tela de gestão de planos)
router.get('/planos', ehProfessor, planoController.listarTodos);

// 2. Criar Novo Plano
router.post('/planos', ehProfessor, planoController.criarPlano);

// 3. Listar Simples (CORREÇÃO: Esta rota TEM que vir antes de /planos/:id)
router.get('/planos/select', ehProfessor, planoController.listarParaSelect);

// 4. Buscar/Editar/Excluir Específico (O :id é um coringa)
router.get('/planos/:id', ehProfessor, planoController.buscarPorId);
router.put('/planos/:id', ehProfessor, planoController.atualizarPlano);
router.delete('/planos/:id', ehProfessor, planoController.excluirPlano);

// --- FREQUÊNCIA ---
router.post('/frequencia/checkin', ehProfessor, frequenciaController.registrarPresenca);

// --- RELATÓRIOS ---
router.get('/relatorios/dashboard', ehProfessor, relatorioController.dadosDashboard);


// ==============================================
// ROTAS PÚBLICAS (Login/Recuperação)
// ==============================================
router.post('/esqueci-senha', authController.esqueciSenha);
router.post('/resetar-senha', authController.resetarSenha);


// ==============================================
// ÁREA DO ALUNO (e Comum)
// ==============================================

// Perfil
router.get('/usuario/me', estaLogado, usuarioController.meuPerfil);
router.put('/usuario/me', estaLogado, usuarioController.atualizarPerfil);

// Portal do Aluno
router.get('/aluno/perfil', estaLogado, alunoController.meuPerfil);
router.get('/aluno/plano', estaLogado, alunoController.meuPlanoDetalhado);
router.put('/aluno/perfil', estaLogado, alunoController.atualizarPerfil);
router.get('/aluno/pagamentos', estaLogado, pagamentoController.meusPagamentos);
router.get('/aluno/evolucao', estaLogado, frequenciaController.getDadosEvolucao);

// Upload de Foto
router.post('/aluno/foto', estaLogado, upload.single('foto_perfil'), alunoController.uploadFoto);

module.exports = router;