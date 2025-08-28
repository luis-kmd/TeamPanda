import pyodbc
from config import DB_CONFIG
import hashlib
from datetime import datetime

def get_connection():
    """Estabelece conexão com o banco de dados SQL Server usando Windows Authentication"""
    connection_string = (
        f"DRIVER={DB_CONFIG['driver']};"
        f"SERVER={DB_CONFIG['server']};"
        f"DATABASE={DB_CONFIG['database']};"
        f"Trusted_Connection={DB_CONFIG['trusted_connection']}"
    )
    
    try:
        conn = pyodbc.connect(connection_string)
        return conn
    except pyodbc.Error as e:
        print(f"Erro ao conectar ao banco de dados: {e}")
        return None

def hash_password(password):
    """Criptografa a senha usando SHA-256"""
    return hashlib.sha256(password.encode()).hexdigest()

def verify_user(email, password):
    """Verifica se o usuário existe e se a senha está correta"""
    conn = get_connection()
    if not conn:
        return None
    
    try:
        cursor = conn.cursor()
        hashed_password = hash_password(password)
        
        # Consulta para verificar o usuário
        query = """
        SELECT ID, NomeCompleto, Email, Perfil, Telefone, DataNascimento, Rua, Bairro, DataCriacao
        FROM Usuarios 
        WHERE Email = ? AND Senha = ?
        """
        
        cursor.execute(query, (email, hashed_password))
        user = cursor.fetchone()
        
        if user:
            # Retorna um dicionário com os dados do usuário
            return {
                'id': user[0],
                'nome': user[1],
                'email': user[2],
                'perfil': user[3],
                'telefone': user[4],
                'nascimento': user[5].strftime('%Y-%m-%d') if user[5] else None,
                'rua': user[6],
                'bairro': user[7],
                'criacao': user[8].strftime('%d/%m/%Y') if user[8] else None
            }
        return None
    
    except pyodbc.Error as e:
        print(f"Erro ao verificar usuário: {e}")
        return None
    finally:
        conn.close()

def get_user_by_id(user_id):
    """Busca um usuário pelo ID"""
    conn = get_connection()
    if not conn:
        return None
    
    try:
        cursor = conn.cursor()
        query = """
        SELECT ID, NomeCompleto, Email, Perfil, Telefone, DataNascimento, Rua, Bairro, DataCriacao
        FROM Usuarios 
        WHERE ID = ?
        """
        
        cursor.execute(query, (user_id,))
        user = cursor.fetchone()
        
        if user:
            return {
                'id': user[0],
                'nome': user[1],
                'email': user[2],
                'perfil': user[3],
                'telefone': user[4],
                'nascimento': user[5].strftime('%Y-%m-%d') if user[5] else None,
                'rua': user[6],
                'bairro': user[7],
                'criacao': user[8].strftime('%d/%m/%Y') if user[8] else None
            }
        return None
    
    except pyodbc.Error as e:
        print(f"Erro ao buscar usuário: {e}")
        return None
    finally:
        conn.close()

def update_user(user_id, nome, email, telefone, senha=None):
    """Atualiza os dados do usuário"""
    conn = get_connection()
    if not conn:
        return False, "Erro de conexão com o banco de dados"
    
    try:
        cursor = conn.cursor()
        
        # Verificar se o email já está em uso por outro usuário
        if email:
            cursor.execute("SELECT ID FROM Usuarios WHERE Email = ? AND ID != ?", (email, user_id))
            if cursor.fetchone():
                return False, "Este e-mail já está em uso por outro usuário"
        
        if senha:
            # Atualizar com nova senha
            hashed_password = hash_password(senha)
            cursor.execute(
                "UPDATE Usuarios SET NomeCompleto = ?, Email = ?, Telefone = ?, Senha = ? WHERE ID = ?",
                (nome, email, telefone, hashed_password, user_id)
            )
        else:
            # Atualizar sem mudar a senha
            cursor.execute(
                "UPDATE Usuarios SET NomeCompleto = ?, Email = ?, Telefone = ? WHERE ID = ?",
                (nome, email, telefone, user_id)
            )
        
        conn.commit()
        return True, "Perfil atualizado com sucesso"
    
    except pyodbc.Error as e:
        conn.rollback()
        return False, f"Erro ao atualizar usuário: {str(e)}"
    finally:
        conn.close()

def get_user_stats(user_id):
    """Obtém estatísticas do usuário (professor)"""
    conn = get_connection()
    if not conn:
        return None
    
    try:
        cursor = conn.cursor()
        
        # Contar alunos
        cursor.execute("SELECT COUNT(*) FROM Alunos WHERE ProfessorID = ?", (user_id,))
        alunos_count = cursor.fetchone()[0]
        
        # Contar turmas
        cursor.execute("SELECT COUNT(*) FROM Turmas WHERE ProfessorID = ?", (user_id,))
        turmas_count = cursor.fetchone()[0]
        
        # Calcular horas/mês
        cursor.execute("SELECT SUM(CargaHoraria) FROM Turmas WHERE ProfessorID = ?", (user_id,))
        horas_result = cursor.fetchone()[0]
        horas_mes = horas_result if horas_result else 0
        
        return {
            'alunos': alunos_count,
            'turmas': turmas_count,
            'horas_mes': f"{horas_mes}h"
        }
    
    except pyodbc.Error as e:
        print(f"Erro ao obter estatísticas: {e}")
        return None
    finally:
        conn.close()

def get_alunos(user_id, search='', page=1, per_page=10):
    """Lista os alunos do professor com paginação e busca"""
    conn = get_connection()
    if not conn:
        return None
    
    try:
        cursor = conn.cursor()
        offset = (page - 1) * per_page
        
        # Consulta base
        query = """
        SELECT a.ID, a.NomeCompleto, a.Email, p.Nome as Plano, a.Status
        FROM Alunos a
        LEFT JOIN Planos p ON a.PlanoID = p.ID
        WHERE a.ProfessorID = ?
        """
        count_query = """
        SELECT COUNT(*)
        FROM Alunos a
        WHERE a.ProfessorID = ?
        """
        
        params = [user_id]
        
        # Adicionar filtro de busca se fornecido
        if search:
            query += " AND (a.NomeCompleto LIKE ? OR CAST(a.ID AS NVARCHAR) LIKE ?)"
            count_query += " AND (a.NomeCompleto LIKE ? OR CAST(a.ID AS NVARCHAR) LIKE ?)"
            params.extend([f'%{search}%', f'%{search}%'])
        
        # Executar consulta de contagem
        cursor.execute(count_query, params)
        total = cursor.fetchone()[0]
        
        # Adicionar ordenação e paginação
        query += " ORDER BY a.NomeCompleto OFFSET ? ROWS FETCH NEXT ? ROWS ONLY"
        params.extend([offset, per_page])
        
        # Executar consulta principal
        cursor.execute(query, params)
        alunos = []
        
        for row in cursor.fetchall():
            alunos.append({
                'id': row[0],
                'nome': row[1],
                'email': row[2],
                'plano': row[3] if row[3] else 'Sem plano',
                'status': 'Ativo' if row[4] else 'Inativo',
                'status_value': row[4]
            })
        
        return {
            'alunos': alunos,
            'total': total,
            'page': page,
            'per_page': per_page,
            'total_pages': (total + per_page - 1) // per_page if total > 0 else 1
        }
    
    except pyodbc.Error as e:
        print(f"Erro ao listar alunos: {e}")
        return None
    finally:
        conn.close()

def get_aluno(aluno_id, user_id):
    """Obtém os detalhes de um aluno específico"""
    conn = get_connection()
    if not conn:
        return None
    
    try:
        cursor = conn.cursor()
        
        query = """
        SELECT a.ID, a.NomeCompleto, a.Email, a.Telefone, a.DataNascimento, 
               a.Rua, a.Bairro, a.Observacoes, a.Status, p.Nome as Plano, p.ID as PlanoID, a.DataCriacao
        FROM Alunos a
        LEFT JOIN Planos p ON a.PlanoID = p.ID
        WHERE a.ID = ? AND a.ProfessorID = ?
        """
        
        cursor.execute(query, (aluno_id, user_id))
        row = cursor.fetchone()
        
        if not row:
            return None
        
        # Buscar turmas do aluno
        cursor.execute("""
            SELECT t.ID, t.Nome
            FROM Turmas t
            JOIN AlunosTurmas at ON t.ID = at.TurmaID
            WHERE at.AlunoID = ?
        """, (aluno_id,))
        
        turmas = []
        for t_row in cursor.fetchall():
            turmas.append({
                'id': t_row[0],
                'nome': t_row[1]
            })
        
        return {
            'id': row[0],
            'nome': row[1],
            'email': row[2],
            'telefone': row[3],
            'nascimento': row[4].strftime('%Y-%m-%d') if row[4] else None,
            'rua': row[5],
            'bairro': row[6],
            'observacoes': row[7],
            'status': row[8],
            'plano': row[9],
            'plano_id': row[10],
            'criacao': row[11].strftime('%d/%m/%Y') if row[11] else None,
            'turmas': turmas
        }
    
    except pyodbc.Error as e:
        print(f"Erro ao obter aluno: {e}")
        return None
    finally:
        conn.close()

def save_aluno(user_id, data):
    """Cria ou atualiza um aluno"""
    conn = get_connection()
    if not conn:
        return False, "Erro de conexão com o banco de dados", None
    
    try:
        cursor = conn.cursor()
        
        aluno_id = data.get('id')
        nome = data.get('nome')
        email = data.get('email')
        telefone = data.get('telefone')
        nascimento = data.get('nascimento')
        plano_id = data.get('plano_id')
        rua = data.get('rua')
        bairro = data.get('bairro')
        observacoes = data.get('observacoes')
        status = data.get('status', True)
        
        # Validar dados obrigatórios
        if not nome or not email:
            return False, "Nome e e-mail são obrigatórios", None
        
        # Verificar se o email já está em uso por outro aluno
        if email:
            if aluno_id:
                cursor.execute("SELECT ID FROM Alunos WHERE Email = ? AND ID != ? AND ProfessorID = ?", 
                              (email, aluno_id, user_id))
            else:
                cursor.execute("SELECT ID FROM Alunos WHERE Email = ? AND ProfessorID = ?", 
                              (email, user_id))
                
            if cursor.fetchone():
                return False, "Este e-mail já está em uso por outro aluno", None
        
        if aluno_id:
            # Atualizar aluno existente
            query = """
            UPDATE Alunos 
            SET NomeCompleto = ?, Email = ?, Telefone = ?, DataNascimento = ?, 
                PlanoID = ?, Rua = ?, Bairro = ?, Observacoes = ?, Status = ?
            WHERE ID = ? AND ProfessorID = ?
            """
            
            cursor.execute(query, (
                nome, email, telefone, nascimento, plano_id, 
                rua, bairro, observacoes, status, aluno_id, user_id
            ))
            
            if cursor.rowcount == 0:
                return False, "Aluno não encontrado ou sem permissão", None
            
            message = "Aluno atualizado com sucesso"
        else:
            # Criar novo aluno
            query = """
            INSERT INTO Alunos (NomeCompleto, Email, Telefone, DataNascimento, 
                               PlanoID, Rua, Bairro, Observacoes, Status, ProfessorID)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
            SELECT SCOPE_IDENTITY();
            """
            
            cursor.execute("""
            INSERT INTO Alunos (NomeCompleto, Email, Telefone, DataNascimento, 
                               PlanoID, Rua, Bairro, Observacoes, Status, ProfessorID)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""", 
            (nome, email, telefone, nascimento, plano_id, 
            rua, bairro, observacoes, status, user_id
        ))
            
            # Obter o ID do aluno recém-inserido
        cursor.execute("SELECT SCOPE_IDENTITY()")
        aluno_id = int(cursor.fetchone()[0])
        message = "Aluno cadastrado com sucesso"
        
        # Atualizar turmas do aluno se fornecidas
        turmas = data.get('turmas', [])
        if turmas:
            # Remover associações existentes
            cursor.execute("DELETE FROM AlunosTurmas WHERE AlunoID = ?", (aluno_id,))
            
            # Adicionar novas associações
            for turma_id in turmas:
                cursor.execute(
                    "INSERT INTO AlunosTurmas (AlunoID, TurmaID) VALUES (?, ?)",
                    (aluno_id, turma_id)
                )
        
        conn.commit()
        return True, message, aluno_id
    
    except pyodbc.Error as e:
        conn.rollback()
        return False, f"Erro ao salvar aluno: {str(e)}", None
    finally:
        conn.close()

import pyodbc

def save_plano_simple(user_id, data):

    conn = None
    try:
        # Extrair dados básicos
        nome = data.get('nome', 'Novo Plano')
        preco = float(data.get('preco', 0.0))
        destaque = int(data.get('destaque', 0))
        
        # Conectar ao banco
        conn = get_connection()
        cursor = conn.cursor()
        
        # Inserir o plano
        cursor.execute("""
            INSERT INTO planos (Nome, Preco, Destaque, CriadoPor, DataCriacao)
            VALUES (?, ?, ?, ?, GETDATE())
        """, (nome, preco, destaque, user_id))
        
        # Commit para garantir que o plano foi inserido
        conn.commit()
        
        # Buscar o ID do plano recém-inserido
        cursor.execute("""
            SELECT TOP 1 ID FROM planos 
            WHERE Nome = ? AND CriadoPor = ? 
            ORDER BY DataCriacao DESC
        """, (nome, user_id))
        
        result = cursor.fetchone()
        
        if not result:
            return False, "Erro ao obter ID do plano", None
        
        plano_id = result[0]
        
        # Salvar características se houver
        features = data.get('features', [])
        if features:
            # Verificar se a tabela de características existe
            try:
                cursor.execute("SELECT TOP 1 * FROM plano_caracteristicas")
            except:
                # Se não existir, criar a tabela
                cursor.execute("""
                    CREATE TABLE plano_caracteristicas (
                        id INT IDENTITY(1,1) PRIMARY KEY,
                        plano_id INT,
                        descricao NVARCHAR(255),
                        incluido BIT DEFAULT 1,
                        CONSTRAINT FK_caracteristicas_planos FOREIGN KEY (plano_id) REFERENCES planos(ID)
                    )
                """)
                conn.commit()
            
            # Inserir características
            for i, feature in enumerate(features):
                incluido = data.get('feature_included', [])[i] if i < len(data.get('feature_included', [])) else 1
                cursor.execute("""
                    INSERT INTO plano_caracteristicas (plano_id, descricao, incluido)
                    VALUES (?, ?, ?)
                """, (plano_id, feature, incluido))
            
            conn.commit()
        
        return True, "Plano salvo com sucesso", plano_id
        
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"Erro ao salvar plano: {str(e)}")
        return False, f"Erro: {str(e)}", None
    finally:
        if conn:
            conn.close()

def update_plano(plano_id, data):
    """
    Atualiza um plano existente
    """
    conn = None
    try:
        # Extrair dados básicos
        nome = data.get('nome', 'Novo Plano')
        preco = float(data.get('preco', 0.0))
        destaque = int(data.get('destaque', 0))
        
        # Conectar ao banco
        conn = get_connection()
        cursor = conn.cursor()
        
        # Verificar se já existe outro plano com o mesmo nome (exceto o próprio plano)
        cursor.execute("""
            SELECT COUNT(*) FROM planos 
            WHERE Nome = ? AND ID != ?
        """, (nome, plano_id))
        
        count = cursor.fetchone()[0]
        
        if count > 0:
            return False, f"Já existe outro plano com o nome '{nome}'. Escolha outro nome."
        
        # Atualizar o plano
        cursor.execute("""
            UPDATE planos 
            SET Nome = ?, Preco = ?, Destaque = ? 
            WHERE ID = ?
        """, (nome, preco, destaque, plano_id))
        
        conn.commit()
        return True, "Plano atualizado com sucesso"
        
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"Erro ao atualizar plano: {str(e)}")
        return False, f"Erro: {str(e)}"
    finally:
        if conn:
            conn.close()

def get_plano_caracteristicas(plano_id):
    """
    Obtém as características de um plano
    """
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        # Verificar se a tabela existe
        try:
            cursor.execute("""
                SELECT id, descricao, incluido 
                FROM plano_caracteristicas 
                WHERE plano_id = ?
            """, (plano_id,))
            
            columns = [column[0] for column in cursor.description]
            caracteristicas = [dict(zip(columns, row)) for row in cursor.fetchall()]
            
            return caracteristicas
        except:
            return []
        
    except Exception as e:
        print(f"Erro ao obter características do plano: {str(e)}")
        return []
    finally:
        if conn:
            conn.close()
            
def save_exercicios(plano_id, exercicios):
    """
    Função separada para salvar os exercícios de um plano
    """
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        # Verificar se a tabela exercicios existe
        try:
            cursor.execute("SELECT TOP 1 * FROM exercicios")
        except:
            # Se não existir, criar a tabela
            cursor.execute("""
                CREATE TABLE exercicios (
                    id INT IDENTITY(1,1) PRIMARY KEY,
                    plano_id INT,
                    nome NVARCHAR(100),
                    series INT,
                    repeticoes INT,
                    descanso INT,
                    observacoes NVARCHAR(MAX)
                )
            """)
            conn.commit()
            print("Tabela exercicios criada")
        
        # Inserir os exercícios
        for exercicio in exercicios:
            cursor.execute("""
                INSERT INTO exercicios (plano_id, nome, series, repeticoes, descanso, observacoes)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (
                plano_id,
                exercicio.get('nome', ''),
                exercicio.get('series', 3),
                exercicio.get('repeticoes', 12),
                exercicio.get('descanso', 60),
                exercicio.get('observacoes', '')
            ))
        
        conn.commit()
        return True
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"Erro ao salvar exercícios: {str(e)}")
        return False
    finally:
        if conn:
            conn.close()


def gerar_relatorio(user_id, data):
    """Gera um novo relatório"""
    conn = get_connection()
    if not conn:
        return False, "Erro de conexão com o banco de dados", None
    
    try:
        cursor = conn.cursor()
        
        tipo = data.get('tipo')
        data_inicial = data.get('data_inicial')
        data_final = data.get('data_final')
        turma_id = data.get('turma_id')
        
        # Validar dados obrigatórios
        if not tipo or not data_inicial or not data_final:
            return False, "Tipo e período são obrigatórios", None
        
        # Gerar título baseado no tipo e período
        titulo = f"Relatório de {tipo.capitalize()} - {data_inicial} a {data_final}"
        
        # Verificar se a turma pertence ao professor, se fornecida
        if turma_id:
            cursor.execute("SELECT ID FROM Turmas WHERE ID = ? AND ProfessorID = ?", (turma_id, user_id))
            if not cursor.fetchone():
                return False, "Turma não encontrada ou sem permissão", None
        
        # Inserir o relatório
        query = """
        INSERT INTO Relatorios (Titulo, Tipo, DataInicial, DataFinal, TurmaID, ProfessorID)
        VALUES (?, ?, ?, ?, ?, ?);
        SELECT SCOPE_IDENTITY();
        """
        
        cursor.execute(query, (titulo, tipo, data_inicial, data_final, turma_id, user_id))
        
        # Obter o ID do relatório recém-inserido
        relatorio_id = cursor.fetchone()[0]
        
        conn.commit()
        return True, "Relatório gerado com sucesso", relatorio_id
    
    except pyodbc.Error as e:
        conn.rollback()
        return False, f"Erro ao gerar relatório: {str(e)}", None
    finally:
        conn.close()

def create_admin_user(nome, email, senha):
    """Cria um usuário administrador no banco de dados"""
    conn = get_connection()
    if not conn:
        return False, None
    
    try:
        cursor = conn.cursor()
        hashed_password = hash_password(senha)
        
        query = """
        INSERT INTO Usuarios (NomeCompleto, Email, Senha, Perfil)
        VALUES (?, ?, ?, 'admin');
        SELECT SCOPE_IDENTITY();
        """
        
        cursor.execute(query, (nome, email, hashed_password))
        user_id = cursor.fetchone()[0]
        
        conn.commit()
        return True, user_id
    
    except pyodbc.Error as e:
        print(f"Erro ao criar usuário admin: {e}")
        return False, None
    finally:
        conn.close()

def delete_aluno(aluno_id, user_id):
    """Exclui um aluno"""
    conn = get_connection()
    if not conn:
        return False, "Erro de conexão com o banco de dados"
    
    try:
        cursor = conn.cursor()
        
        # Verificar se o aluno pertence ao professor
        cursor.execute("SELECT ID FROM Alunos WHERE ID = ? AND ProfessorID = ?", (aluno_id, user_id))
        if not cursor.fetchone():
            return False, "Aluno não encontrado ou sem permissão"
        
        # Excluir o aluno
        cursor.execute("DELETE FROM Alunos WHERE ID = ?", (aluno_id,))
        
        conn.commit()
        return True, "Aluno excluído com sucesso"
    
    except pyodbc.Error as e:
        conn.rollback()
        return False, f"Erro ao excluir aluno: {str(e)}"
    finally:
        conn.close()

def get_planos(user_id):
    """Lista os planos do professor"""
    conn = get_connection()
    if not conn:
        return None
    
    try:
        cursor = conn.cursor()
        
        # Consulta para buscar planos
        query = """
        SELECT ID, Nome, Preco, Destaque
        FROM Planos
        WHERE CriadoPor = ?
        ORDER BY Destaque DESC, Preco
        """
        
        cursor.execute(query, (user_id,))
        planos = []
        
        for row in cursor.fetchall():
            plano_id = row[0]
            
            # Buscar características do plano
            cursor.execute(
                "SELECT Descricao, Incluido FROM PlanoCaracteristicas WHERE PlanoID = ? ORDER BY ID", 
                (plano_id,)
            )
            
            caracteristicas = []
            for c_row in cursor.fetchall():
                caracteristicas.append({
                    'descricao': c_row[0],
                    'incluido': c_row[1]
                })
            
            # Contar alunos que usam este plano
            cursor.execute("SELECT COUNT(*) FROM Alunos WHERE PlanoID = ?", (plano_id,))
            alunos_count = cursor.fetchone()[0]
            
            planos.append({
                'id': plano_id,
                'nome': row[1],
                'preco': float(row[2]),
                'destaque': row[3],
                'caracteristicas': caracteristicas,
                'alunos_count': alunos_count
            })
        
        return planos
    
    except pyodbc.Error as e:
        print(f"Erro ao listar planos: {e}")
        return None
    finally:
        conn.close()

def get_plano_by_id(plano_id):
    """
    Obtém um plano pelo ID
    """
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        # Obter o plano
        cursor.execute("SELECT * FROM planos WHERE ID = ?", (plano_id,))
        columns = [column[0] for column in cursor.description]
        plano = cursor.fetchone()
        
        if not plano:
            return None
        
        # Converter para dicionário
        plano_dict = dict(zip(columns, plano))
        
        # Obter exercícios do plano
        cursor.execute("SELECT * FROM exercicios WHERE plano_id = ?", (plano_id,))
        columns = [column[0] for column in cursor.description]
        exercicios = [dict(zip(columns, row)) for row in cursor.fetchall()]
        
        plano_dict['exercicios'] = exercicios
        
        return plano_dict
    except Exception as e:
        print(f"Erro ao obter plano: {str(e)}")
        return None
    finally:
        if conn:
            conn.close()

def get_plano(plano_id, user_id):
    """Obtém os detalhes de um plano específico"""
    conn = get_connection()
    if not conn:
        return None
    
    try:
        cursor = conn.cursor()
        
        query = """
        SELECT ID, Nome, Preco, Destaque
        FROM Planos
        WHERE ID = ? AND CriadoPor = ?
        """
        
        cursor.execute(query, (plano_id, user_id))
        row = cursor.fetchone()
        
        if not row:
            return None
        
        plano_id = row[0]
        
        # Buscar características do plano
        cursor.execute(
            "SELECT Descricao, Incluido FROM PlanoCaracteristicas WHERE PlanoID = ? ORDER BY ID", 
            (plano_id,)
        )
        
        caracteristicas = []
        for c_row in cursor.fetchall():
            caracteristicas.append({
                'descricao': c_row[0],
                'incluido': c_row[1]
            })
        
        return {
            'id': plano_id,
            'nome': row[1],
            'preco': float(row[2]),
            'destaque': row[3],
            'caracteristicas': caracteristicas
        }
    
    except pyodbc.Error as e:
        print(f"Erro ao obter plano: {e}")
        return None
    finally:
        conn.close()

def update_plano(plano_id, data):
    """
    Atualiza um plano existente
    """
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        # Extrair dados básicos
        nome = data.get('nome', 'Novo Plano')
        preco = float(data.get('preco', 0.0))
        destaque = int(data.get('destaque', 0))
        
        # Atualizar o plano
        cursor.execute("""
            UPDATE planos 
            SET Nome = ?, Preco = ?, Destaque = ?
            WHERE ID = ?
        """, (nome, preco, destaque, plano_id))
        
        # Commit para garantir que a atualização foi feita
        conn.commit()
        
        return True, "Plano atualizado com sucesso", plano_id
        
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"Erro ao atualizar plano: {str(e)}")
        return False, f"Erro: {str(e)}", None
    finally:
        if conn:
            conn.close()

def delete_plano(plano_id):
    """
    Exclui um plano e seus exercícios
    """
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        # Excluir exercícios do plano
        cursor.execute("DELETE FROM exercicios WHERE plano_id = ?", (plano_id,))
        
        # Excluir o plano
        cursor.execute("DELETE FROM planos WHERE ID = ?", (plano_id,))
        
        # Commit para garantir que a exclusão foi feita
        conn.commit()
        
        return True, "Plano excluído com sucesso"
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"Erro ao excluir plano: {str(e)}")
        return False, f"Erro: {str(e)}"
    finally:
        if conn:
            conn.close()


def get_turmas(user_id):
    """Lista as turmas do professor"""
    conn = get_connection()
    if not conn:
        return None
    
    try:
        cursor = conn.cursor()
        
        # Consulta para buscar turmas
        query = """
        SELECT ID, Nome, Descricao, CargaHoraria
        FROM Turmas
        WHERE ProfessorID = ?
        ORDER BY Nome
        """
        
        cursor.execute(query, (user_id,))
        turmas = []
        
        for row in cursor.fetchall():
            turma_id = row[0]
            
            # Contar alunos nesta turma
            cursor.execute("""
                SELECT COUNT(*) 
                FROM AlunosTurmas at
                JOIN Alunos a ON at.AlunoID = a.ID
                WHERE at.TurmaID = ? AND a.Status = 1
            """, (turma_id,))
            alunos_count = cursor.fetchone()[0]
            
            turmas.append({
                'id': turma_id,
                'nome': row[1],
                'descricao': row[2],
                'carga_horaria': row[3],
                'alunos_count': alunos_count
            })
        
        return turmas
    
    except pyodbc.Error as e:
        print(f"Erro ao listar turmas: {e}")
        return None
    finally:
        conn.close()

def get_relatorios(user_id):
    """Lista os relatórios do professor"""
    conn = get_connection()
    if not conn:
        return None
    
    try:
        cursor = conn.cursor()
        
        # Consulta para buscar relatórios
        query = """
        SELECT r.ID, r.Titulo, r.Tipo, r.DataInicial, r.DataFinal, 
               r.DataGeracao, t.Nome as TurmaNome
        FROM Relatorios r
        LEFT JOIN Turmas t ON r.TurmaID = t.ID
        WHERE r.ProfessorID = ?
        ORDER BY r.DataGeracao DESC
        """
        
        cursor.execute(query, (user_id,))
        relatorios = []
        
        for row in cursor.fetchall():
            # Mapear tipo para nome amigável
            tipo_nome = {
                'frequencia': 'Frequência',
                'desempenho': 'Desempenho',
                'financeiro': 'Financeiro',
                'atividades': 'Atividades'
            }.get(row[2], row[2])
            
            relatorios.append({
                'id': row[0],
                'titulo': row[1],
                'tipo': row[2],
                'tipo_nome': tipo_nome,
                'data_inicial': row[3].strftime('%d/%m/%Y') if row[3] else None,
                'data_final': row[4].strftime('%d/%m/%Y') if row[4] else None,
                'data_geracao': row[5].strftime('%d/%m/%Y') if row[5] else None,
                'turma_nome': row[6] if row[6] else 'Todas as Turmas'
            })
        
        return relatorios
    
    except pyodbc.Error as e:
        print(f"Erro ao listar relatórios: {e}")
        return None
    finally:
        conn.close()

def gerar_relatorio(user_id, data):
    """Gera um novo relatório"""
    conn = get_connection()
    if not conn:
        return False, "Erro de conexão com o banco de dados"
    
    try:
        cursor = conn.cursor()
        
        tipo = data.get('tipo')
        data_inicial = data.get('data_inicial')
        data_final = data.get('data_final')
        turma_id = data.get('turma_id')
        
        # Validar dados obrigatórios
        if not tipo or not data_inicial or not data_final:
            return False, "Tipo e período são obrigatórios"
        
        # Gerar título baseado no tipo e período
        titulo = f"Relatório de {tipo.capitalize()} - {data_inicial} a {data_final}"
        
        # Verificar se a turma pertence ao professor, se fornecida
        if turma_id:
            cursor.execute("SELECT ID FROM Turmas WHERE ID = ? AND ProfessorID = ?", (turma_id, user_id))
            if not cursor.fetchone():
                return False, "Turma não encontrada ou sem permissão"
        
        # Inserir o relatório
        query = """
        INSERT INTO Relatorios (Titulo, Tipo, DataInicial, DataFinal, TurmaID, ProfessorID)
        VALUES (?, ?, ?, ?, ?, ?)
        """
        
        cursor.execute(query, (titulo, tipo, data_inicial, data_final, turma_id, user_id))
        
        relatorio_id = cursor.lastrowid
        
        conn.commit()
        return True, "Relatório gerado com sucesso", relatorio_id
    
    except pyodbc.Error as e:
        conn.rollback()
        return False, f"Erro ao gerar relatório: {str(e)}"
    finally:
        conn.close()

def create_admin_user(nome, email, senha):
    """Cria um usuário administrador no banco de dados"""
    conn = get_connection()
    if not conn:
        return False
    
    try:
        cursor = conn.cursor()
        hashed_password = hash_password(senha)
        
        query = """
        INSERT INTO Usuarios (NomeCompleto, Email, Senha, Perfil)
        VALUES (?, ?, ?, 'admin')
        """
        
        cursor.execute(query, (nome, email, hashed_password))
        conn.commit()
        return True
    
    except pyodbc.Error as e:
        print(f"Erro ao criar usuário admin: {e}")
        return False
    finally:
        conn.close()