import pyodbc
from config import DB_CONFIG
import sys

def test_connection():
    """Testa a conexão com o banco de dados"""
    connection_string = (
        f"DRIVER={DB_CONFIG['driver']};"
        f"SERVER={DB_CONFIG['server']};"
        f"DATABASE={DB_CONFIG['database']};"
        f"Trusted_Connection={DB_CONFIG['trusted_connection']}"
    )
    
    print(f"Tentando conectar com: {connection_string}")
    
    try:
        conn = pyodbc.connect(connection_string)
        print("Conexão estabelecida com sucesso!")
        
        # Verificar se o driver ODBC está instalado corretamente
        cursor = conn.cursor()
        cursor.execute("SELECT @@version")
        version = cursor.fetchone()
        print(f"Versão do SQL Server: {version[0]}")
        
        # Verificar se o banco de dados existe
        cursor.execute("SELECT DB_NAME()")
        db_name = cursor.fetchone()
        print(f"Banco de dados atual: {db_name[0]}")
        
        # Verificar se as tabelas existem
        cursor.execute("""
        SELECT TABLE_NAME 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_TYPE = 'BASE TABLE'
        """)
        tables = cursor.fetchall()
        print("Tabelas encontradas:")
        for table in tables:
            print(f"  - {table[0]}")
        
        # Verificar a estrutura da tabela Posts
        try:
            cursor.execute("SELECT TOP 0 * FROM Posts")
            columns = [column[0] for column in cursor.description]
            print("\nEstrutura da tabela Posts:")
            for column in columns:
                print(f"  - {column}")
        except pyodbc.ProgrammingError:
            print("\nTabela Posts não encontrada!")
        
        # Verificar permissões do usuário
        try:
            cursor.execute("INSERT INTO Posts (UsuarioID, Conteudo) VALUES (1, 'Teste de permissão')")
            cursor.execute("DELETE FROM Posts WHERE Conteudo = 'Teste de permissão'")
            conn.commit()
            print("\nPermissões de escrita OK!")
        except pyodbc.Error as e:
            print(f"\nErro ao testar permissões de escrita: {e}")
        
        conn.close()
        return True
    except pyodbc.Error as e:
        print(f"Erro ao conectar: {e}")
        return False

if __name__ == "__main__":
    print("Iniciando teste de conexão com o banco de dados...")
    test_connection()
