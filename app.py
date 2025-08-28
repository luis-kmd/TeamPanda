from flask import Flask, render_template, request, redirect, url_for, flash, session, send_from_directory
import os
import secrets
from database import verify_user, get_user_by_id
from auth import login_user, logout_user, login_required, professor_required, is_authenticated
from api import api  # Certifique-se de que esta linha existe
from datetime import datetime

app = Flask(__name__, 
            static_folder='static',
            template_folder='pages')

# Gerar uma chave secreta aleatória
app.secret_key = secrets.token_hex(32)
print(f"Chave secreta gerada: {app.secret_key}")

# Registrar blueprint da API
app.register_blueprint(api)  # Certifique-se de que esta linha existe

# Configurações da aplicação
app.config['TEMPLATES_AUTO_RELOAD'] = True

# Configurações adicionais para sessão
app.config['SESSION_COOKIE_SECURE'] = False  # Para desenvolvimento local
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'

# Rota para servir arquivos estáticos das pastas de páginas
@app.route('/pages/<path:path>')
def serve_pages_files(path):
    directory = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'pages')
    return send_from_directory(directory, path)

# Rota específica para servir arquivos CSS, JS e imagens para cada seção
@app.route('/<section>/<filename>')
def serve_section_files(section, filename):
    if section in ['professores', 'alunos', 'login']:
        directory = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'pages', section)
        return send_from_directory(directory, filename)
    return '', 404

# Rota principal - redireciona para login se não estiver autenticado
@app.route('/')
def index():
    if is_authenticated():
        perfil = session.get('user_perfil')
        if perfil in ['admin', 'professor']:
            return redirect(url_for('professor_dashboard'))
        else:
            return redirect(url_for('aluno_dashboard'))
    return redirect(url_for('login'))

# Rota de login
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form.get('email')
        senha = request.form.get('senha')
        
        if not email or not senha:
            flash('Por favor, preencha todos os campos', 'error')
            return redirect(url_for('login'))
        
        user = verify_user(email, senha)
        
        if user:
            login_user(user)
            session['user_nome'] = user['nome']
            session['user_email'] = user['email']
            session['user_telefone']  = user['telefone']  
            session['user_nascimento'] = user['nascimento']
            session['user_rua'] = user['rua']
            session['user_bairro'] = user['bairro']
            session['user_criacao'] = user['criacao']
            session['user_id'] = user['id']
            # Redireciona com base no perfil do usuário
            if user['perfil'] in ['admin', 'professor']:
                return redirect(url_for('professor_dashboard'))
            else:
                return redirect(url_for('aluno_dashboard'))
        else:
            flash('Email ou senha incorretos', 'error')
    
    # Se for GET ou se houver erro no login
    return render_template('login/index.html')


# Rota de logout
@app.route('/logout')
def logout():
    logout_user()
    return redirect(url_for('login'))

# Rota para o dashboard do professor (acessível por admin e professor)
@app.route('/professor')
@professor_required
def professor_dashboard():
    user_id = session.get('user_id')  # Pegando o ID da session
    user = get_user_by_id(user_id)  # Puxando do banco direto

    nome = session.get('user_nome', 'Usuário')
    return render_template('professores/index.html', nome=nome, email=user['email'], telefone=user['telefone'], id=user['id'])

# Rota para o dashboard do aluno
@app.route('/aluno')
@login_required
def aluno_dashboard():
    user_id = session.get('user_id')  # Pegando o ID da session
    
    user = get_user_by_id(user_id)  # Puxando do banco direto
    
    if user and user['perfil'] not in ['admin', 'professor']:
        return render_template('alunos/index.html', nome=user['nome'], email=user['email'], telefone=user['telefone'], nascimento=user['nascimento'], rua=user['rua'], bairro=user['bairro'], criacao=user['criacao'])
    
    return redirect(url_for('professor_dashboard'))


# Manipulador de erro 404
@app.errorhandler(404)
def page_not_found(e):
    return render_template('login/index.html'), 404

if __name__ == '__main__':
    app.run(debug=True, port=5000)