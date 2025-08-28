# Configurações do banco de dados e da aplicação
import os

# Configurações do SQL Server com Windows Authentication
DB_CONFIG = {
    'server': '(localdb)\\local',  # Servidor local conforme informado
    'database': 'TeamPandaAcademia',       # Nome do banco de dados
    'trusted_connection': 'yes',   # Usar Windows Authentication
    'driver': '{ODBC Driver 17 for SQL Server}'  # Driver ODBC para SQL Server
}

# Configurações da aplicação
SECRET_KEY = 'chave_secreta_para_sessoes'  # Altere para uma chave segura em produção
DEBUG = True
