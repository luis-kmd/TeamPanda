from flask import Blueprint, jsonify, request, session
import time
# Criar o blueprint
api = Blueprint('api', __name__)
from database import (
    get_user_stats, update_user, get_alunos, get_aluno, save_aluno, delete_aluno,
    get_planos, get_plano, delete_plano, get_turmas, get_relatorios, gerar_relatorio, save_plano_simple,
    get_connection, update_plano, get_plano_by_id
)

api = Blueprint('api', __name__)

# API para obter estatísticas do usuário
@api.route('/api/user/stats', methods=['GET'])
def user_stats():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Usuário não autenticado'}), 401
    
    stats = get_user_stats(user_id)
    if stats:
        return jsonify(stats)
    
    return jsonify({'error': 'Erro ao obter estatísticas'}), 500

# API para atualizar perfil do usuário
@api.route('/api/user/update', methods=['POST'])
def update_user_profile():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Usuário não autenticado'}), 401
    
    data = request.json
    nome = data.get('nome')
    email = data.get('email')
    telefone = data.get('telefone')
    senha = data.get('senha')
    
    if not nome or not email or not telefone:
        return jsonify({'error': 'Dados incompletos'}), 400
    
    success, message = update_user(user_id, nome, email, telefone, senha)
    
    if success:
        # Atualizar dados da sessão
        session['user_nome'] = nome
        session['user_email'] = email
        session['user_telefone'] = telefone
        
        return jsonify({'success': True, 'message': message})
    
    return jsonify({'error': message}), 500

# API para listar alunos
@api.route('/api/alunos', methods=['GET'])
def list_alunos():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Usuário não autenticado'}), 401
    
    search = request.args.get('search', '')
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 10))
    
    result = get_alunos(user_id, search, page, per_page)
    
    if result:
        return jsonify(result)
    
    return jsonify({'error': 'Erro ao listar alunos'}), 500

# API para obter detalhes de um aluno
@api.route('/api/alunos/<int:aluno_id>', methods=['GET'])
def get_aluno_details(aluno_id):
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Usuário não autenticado'}), 401
    
    aluno = get_aluno(aluno_id, user_id)
    
    if aluno:
        return jsonify(aluno)
    
    return jsonify({'error': 'Aluno não encontrado'}), 404

# API para criar/atualizar aluno
@api.route('/api/alunos', methods=['POST'])
def save_aluno_data():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Usuário não autenticado'}), 401
    
    data = request.json
    
    # Modificar para lidar com o caso em que save_aluno retorna apenas 2 valores
    result = save_aluno(user_id, data)
    
    if len(result) == 3:
        success, message, aluno_id = result
    else:
        success, message = result
        aluno_id = None
    
    if success:
        return jsonify({'success': True, 'message': message, 'id': aluno_id})
    
    return jsonify({'error': message}), 500

# API para excluir aluno
@api.route('/api/alunos/<int:aluno_id>', methods=['DELETE'])
def delete_aluno_data(aluno_id):
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Usuário não autenticado'}), 401
    
    success, message = delete_aluno(aluno_id, user_id)
    
    if success:
        return jsonify({'success': True, 'message': message})
    
    return jsonify({'error': message}), 500

# API para listar planos
@api.route('/api/planos', methods=['GET'])
def list_planos():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Usuário não autenticado'}), 401
    
    planos = get_planos(user_id)
    
    if planos is not None:
        return jsonify(planos)
    
    return jsonify({'error': 'Erro ao listar planos'}), 500

# API para obter detalhes de um plano
@api.route('/api/planos/<int:plano_id>', methods=['GET'])
def get_plano_details(plano_id):
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Usuário não autenticado'}), 401
    
    plano = get_plano(plano_id, user_id)
    
    if plano:
        return jsonify(plano)
    
    return jsonify({'error': 'Plano não encontrado'}), 404

# API para listar turmas
@api.route('/api/turmas', methods=['GET'])
def list_turmas():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Usuário não autenticado'}), 401
    
    turmas = get_turmas(user_id)
    
    if turmas is not None:
        return jsonify(turmas)
    
    return jsonify({'error': 'Erro ao listar turmas'}), 500

# API para listar relatórios
@api.route('/api/relatorios', methods=['GET'])
def list_relatorios():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Usuário não autenticado'}), 401
    
    relatorios = get_relatorios(user_id)
    
    if relatorios is not None:
        return jsonify(relatorios)
    
    return jsonify({'error': 'Erro ao listar relatórios'}), 500

# API para gerar relatório
@api.route('/api/relatorios', methods=['POST'])
def generate_report():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Usuário não autenticado'}), 401
    
    data = request.json
    
    # Modificar para lidar com o caso em que gerar_relatorio retorna apenas 2 valores
    result = gerar_relatorio(user_id, data)
    
    if len(result) == 3:
        success, message, relatorio_id = result
    else:
        success, message = result
        relatorio_id = None
    
    if success:
        return jsonify({'success': True, 'message': message, 'id': relatorio_id})
    
    return jsonify({'error': message}), 500

# Adicione esta rota de teste no final do arquivo api.py

@api.route('/api/test/connection', methods=['GET'])
def test_connection():
    """Rota de teste para verificar a conexão com o banco"""
    from database import get_connection
    
    conn = get_connection()
    if not conn:
        return jsonify({'error': 'Não foi possível conectar ao banco de dados'}), 500
    
    try:
        cursor = conn.cursor()
        
        # Testar consulta simples
        cursor.execute("SELECT COUNT(*) FROM Usuarios")
        usuarios_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM Planos")
        planos_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM Alunos")
        alunos_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM Turmas")
        turmas_count = cursor.fetchone()[0]
        
        # Testar dados específicos
        cursor.execute("SELECT TOP 5 ID, NomeCompleto, Email, Perfil FROM Usuarios")
        usuarios = []
        for row in cursor.fetchall():
            usuarios.append({
                'id': row[0],
                'nome': row[1],
                'email': row[2],
                'perfil': row[3]
            })
        
        return jsonify({
            'success': True,
            'message': 'Conexão com banco de dados OK',
            'counts': {
                'usuarios': usuarios_count,
                'planos': planos_count,
                'alunos': alunos_count,
                'turmas': turmas_count
            },
            'sample_users': usuarios
        })
    
    except Exception as e:
        return jsonify({'error': f'Erro ao consultar banco: {str(e)}'}), 500
    finally:
        conn.close()

@api.route('/api/test/user-data/<int:user_id>', methods=['GET'])
def test_user_data(user_id):
    """Testa os dados específicos de um usuário"""
    from database import get_connection
    
    conn = get_connection()
    if not conn:
        return jsonify({'error': 'Não foi possível conectar ao banco de dados'}), 500
    
    try:
        cursor = conn.cursor()
        
        # Dados do usuário
        cursor.execute("SELECT * FROM Usuarios WHERE ID = ?", (user_id,))
        user_row = cursor.fetchone()
        
        if not user_row:
            return jsonify({'error': 'Usuário não encontrado'}), 404
        
        # Planos do usuário
        cursor.execute("SELECT * FROM Planos WHERE CriadoPor = ?", (user_id,))
        planos_rows = cursor.fetchall()
        
        # Alunos do usuário
        cursor.execute("SELECT * FROM Alunos WHERE ProfessorID = ?", (user_id,))
        alunos_rows = cursor.fetchall()
        
        # Turmas do usuário
        cursor.execute("SELECT * FROM Turmas WHERE ProfessorID = ?", (user_id,))
        turmas_rows = cursor.fetchall()
        
        return jsonify({
            'success': True,
            'user_id': user_id,
            'user_data': {
                'id': user_row[0],
                'nome': user_row[1],
                'email': user_row[2],
                'perfil': user_row[3]
            },
            'counts': {
                'planos': len(planos_rows),
                'alunos': len(alunos_rows),
                'turmas': len(turmas_rows)
            },
            'raw_data': {
                'planos': [list(row) for row in planos_rows],
                'alunos': [list(row) for row in alunos_rows],
                'turmas': [list(row) for row in turmas_rows]
            }
        })
    
    except Exception as e:
        return jsonify({'error': f'Erro ao consultar dados do usuário: {str(e)}'}), 500
    finally:
        conn.close()

@api.route('/api/test/session', methods=['GET'])
def test_session():
    """Testa os dados da sessão atual"""
    return jsonify({
        'user_id': session.get('user_id'),
        'user_nome': session.get('user_nome'),
        'user_email': session.get('user_email'),
        'user_perfil': session.get('user_perfil'),
        'all_session': dict(session)
    })

@api.route('/api/test/login', methods=['POST'])
def test_login():
    """Rota de teste para verificar o login"""
    from database import verify_user
    from auth import login_user
    
    data = request.json
    email = data.get('email')
    senha = data.get('senha')
    
    if not email or not senha:
        return jsonify({'error': 'Email e senha são obrigatórios'}), 400
    
    # Testar verificação do usuário
    user = verify_user(email, senha)
    
    if user:
        # Fazer login
        login_user(user)
        session['user_nome'] = user['nome']
        session['user_email'] = user['email']
        session['user_telefone'] = user['telefone']
        session['user_id'] = user['id']
        
        return jsonify({
            'success': True,
            'message': 'Login realizado com sucesso',
            'user': user,
            'session_after_login': dict(session)
        })
    else:
        return jsonify({'error': 'Email ou senha incorretos'}), 401
    
@api.route('/api/test/users', methods=['GET'])
def test_users():
    """Testa a consulta de usuários no banco de dados"""
    from database import get_connection
    
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT TOP 5 * FROM usuarios")
        columns = [column[0] for column in cursor.description]
        users = [dict(zip(columns, row)) for row in cursor.fetchall()]
        
        return jsonify({
            'success': True,
            'message': 'Consulta realizada com sucesso',
            'users': users,
            'count': len(users)
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
    finally:
        if conn:
            conn.close()

@api.route('/api/test/verify-user', methods=['POST'])
def test_verify_user():
    """Testa a verificação de usuário sem fazer login"""
    from database import verify_user
    
    data = request.json
    email = data.get('email')
    senha = data.get('senha')
    
    if not email or not senha:
        return jsonify({'error': 'Email e senha são obrigatórios'}), 400
    
    try:
        user = verify_user(email, senha)
        
        if user:
            # Não faz login, apenas retorna os dados do usuário
            return jsonify({
                'success': True,
                'message': 'Usuário verificado com sucesso',
                'user': user
            })
        else:
            return jsonify({
                'success': False,
                'message': 'Email ou senha incorretos'
            }), 401
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
    
@api.route('/api/planos', methods=['POST'])
def save_plano_data():
    """Salva um novo plano de treino"""
    if 'user_id' not in session:
        return jsonify({'error': 'Usuário não autenticado'}), 401
    
    user_id = session['user_id']
    data = request.json
    
    if not data:
        return jsonify({'error': 'Dados inválidos'}), 400
    
    try:
        # Usar a função simplificada
        success, message, _ = save_plano_simple(user_id, data)
        
        if success:
            return jsonify({
                'success': True,
                'message': message
            })
        else:
            return jsonify({
                'success': False,
                'error': message
            }), 400
    except Exception as e:
        print(f"Erro ao salvar plano: {str(e)}")
        return jsonify({
            'success': False,
            'error': f"Erro ao salvar plano: {str(e)}"
        }), 500

@api.route('/api/planos', methods=['GET'])
def get_planos_data():
    """Obtém a lista de planos de treino"""
    if 'user_id' not in session:
        return jsonify({'error': 'Usuário não autenticado'}), 401
    
    user_id = session['user_id']
    search = request.args.get('search', '')
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 10))
    
    try:
        planos, total = get_planos(user_id, search, page, per_page)
        
        return jsonify({
            'planos': planos,
            'total': total,
            'page': page,
            'per_page': per_page
        })
    except Exception as e:
        print(f"Erro ao obter planos: {str(e)}")
        return jsonify({
            'error': f"Erro ao obter planos: {str(e)}"
        }), 500
    
@api.route('/api/test/routes', methods=['GET'])
def test_routes():
    """Testa se as rotas estão funcionando"""
    return jsonify({
        'message': 'Rotas funcionando!',
        'available_routes': [
            'GET /api/planos',
            'POST /api/planos',
            'GET /api/test/routes',
            'GET /api/test/session'
        ]
    })

@api.route('/api/planos/<int:plano_id>', methods=['PUT'])
def update_plano_data(plano_id):
    """Atualiza um plano existente"""
    if 'user_id' not in session:
        return jsonify({'error': 'Usuário não autenticado'}), 401
    
    user_id = session['user_id']
    data = request.json
    
    if not data:
        return jsonify({'error': 'Dados inválidos'}), 400
    
    try:
        # Verificar se o plano pertence ao usuário
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT CriadoPor FROM planos WHERE ID = ?", (plano_id,))
        result = cursor.fetchone()
        
        if not result:
            return jsonify({'error': 'Plano não encontrado'}), 404
        
        if result[0] != user_id:
            return jsonify({'error': 'Você não tem permissão para editar este plano'}), 403
        
        # Atualizar o plano
        success, message, _ = update_plano(plano_id, data)
        
        if success:
            return jsonify({
                'success': True,
                'message': message
            })
        else:
            return jsonify({
                'success': False,
                'error': message
            }), 400
    except Exception as e:
        print(f"Erro ao atualizar plano: {str(e)}")
        return jsonify({
            'success': False,
            'error': f"Erro ao atualizar plano: {str(e)}"
        }), 500
    
@api.route('/api/planos/<int:plano_id>', methods=['GET'])
def get_plano_data(plano_id):
    """Obtém um plano pelo ID"""
    if 'user_id' not in session:
        return jsonify({'error': 'Usuário não autenticado'}), 401
    
    try:
        plano = get_plano_by_id(plano_id)
        
        if not plano:
            return jsonify({'error': 'Plano não encontrado'}), 404
        
        return jsonify({
            'success': True,
            'plano': plano
        })
    except Exception as e:
        print(f"Erro ao obter plano: {str(e)}")
        return jsonify({
            'success': False,
            'error': f"Erro ao obter plano: {str(e)}"
        }), 500
    
@api.route('/api/planos/<int:plano_id>', methods=['DELETE'])
def delete_plano_data(plano_id):
    """Exclui um plano"""
    if 'user_id' not in session:
        return jsonify({'error': 'Usuário não autenticado'}), 401
    
    user_id = session['user_id']
    
    try:
        # Verificar se o plano pertence ao usuário
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT CriadoPor FROM planos WHERE ID = ?", (plano_id,))
        result = cursor.fetchone()
        
        if not result:
            return jsonify({'error': 'Plano não encontrado'}), 404
        
        if result[0] != user_id:
            return jsonify({'error': 'Você não tem permissão para excluir este plano'}), 403
        
        # Excluir o plano
        success, message = delete_plano(plano_id)
        
        if success:
            return jsonify({
                'success': True,
                'message': message
            })
        else:
            return jsonify({
                'success': False,
                'error': message
            }), 400
    except Exception as e:
        print(f"Erro ao excluir plano: {str(e)}")
        return jsonify({
            'success': False,
            'error': f"Erro ao excluir plano: {str(e)}"
        }), 500


