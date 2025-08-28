from flask import session, redirect, url_for
from functools import wraps
from database import get_user_by_id

def login_user(user):
    """Registra o usuário na sessão"""
    session['user_id'] = user['id']
    session['user_perfil'] = user['perfil']
    session['user_nome'] = user['nome']
    session['user_email'] = user['email']

def logout_user():
    """Remove o usuário da sessão"""
    session.pop('user_id', None)
    session.pop('user_perfil', None)
    session.pop('user_nome', None)

def is_authenticated():
    """Verifica se o usuário está autenticado"""
    return 'user_id' in session

def get_current_user():
    """Retorna o usuário atual da sessão"""
    if not is_authenticated():
        return None
    
    user_id = session.get('user_id')
    return get_user_by_id(user_id)

def login_required(f):
    """Decorator para rotas que exigem autenticação"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not is_authenticated():
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

def admin_required(f):
    """Decorator para rotas que exigem perfil de admin"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not is_authenticated() or session.get('user_perfil') != 'admin':
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

def professor_required(f):
    """Decorator para rotas que exigem perfil de professor ou admin"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not is_authenticated() or session.get('user_perfil') not in ['professor', 'admin']:
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

def aluno_required(f):
    """Decorator para rotas que exigem perfil de aluno"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not is_authenticated() or session.get('user_perfil') != 'aluno':
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function