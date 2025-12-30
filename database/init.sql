-- Criação do banco com suporte a caracteres especiais (emojis, acentos)
CREATE DATABASE IF NOT EXISTS TeamPandaAcademia
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE TeamPandaAcademia;

-- 1. Tabela de Usuários (Auth: Login e Senha)
-- Esta tabela gerencia QUEM entra no sistema (Admin, Professor ou Aluno)
CREATE TABLE Usuarios (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    NomeCompleto VARCHAR(100) NOT NULL,
    Email VARCHAR(100) NOT NULL UNIQUE,
    Senha VARCHAR(255) NOT NULL, -- Aumentado para suportar hashs longos (bcrypt/argon2)
    Perfil ENUM('admin', 'professor', 'aluno') NOT NULL DEFAULT 'aluno',
    Telefone VARCHAR(20),
    DataNascimento DATE,
    Rua VARCHAR(100),
    Bairro VARCHAR(100),
    DataCriacao DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. Tabela de Planos
-- CriadoPor refere-se a um Usuario (Professor ou Admin)
CREATE TABLE Planos (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    Nome VARCHAR(100) NOT NULL,
    Preco DECIMAL(10, 2) NOT NULL,
    Destaque BOOLEAN DEFAULT FALSE, -- BOOLEAN é alias para TINYINT(1) no MySQL
    CriadoPor INT NOT NULL,
    DataCriacao DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (CriadoPor) REFERENCES Usuarios(ID) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- 3. Tabela de Características dos Planos
-- ON DELETE CASCADE: Se apagar o Plano, apaga as características dele automaticamente
CREATE TABLE PlanoCaracteristicas (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    PlanoID INT NOT NULL,
    Descricao VARCHAR(255) NOT NULL,
    Incluido BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (PlanoID) REFERENCES Planos(ID) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 4. Tabela de Alunos (Perfil Detalhado)
-- IMPORTANTE: Adicionei UsuarioID para vincular o cadastro do aluno ao login dele
CREATE TABLE Alunos (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    UsuarioID INT UNIQUE, -- Link opcional para a tabela de login se o aluno logar no app
    NomeCompleto VARCHAR(100) NOT NULL,
    Email VARCHAR(100) NOT NULL,
    CPF VARCHAR(14) UNIQUE, -- CPF deve ser único
    Telefone VARCHAR(20),
    DataNascimento DATE,
    PlanoID INT,
    Rua VARCHAR(100),
    Bairro VARCHAR(100),
    Observacoes TEXT, -- TEXT é melhor que VARCHAR(MAX) no MySQL
    Status BOOLEAN DEFAULT TRUE, -- Ativo/Inativo
    ProfessorID INT NOT NULL, -- Professor responsável
    FotoPath VARCHAR(255) NULL, -- Integrado do seu ALTER TABLE
    DataCriacao DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (PlanoID) REFERENCES Planos(ID) ON DELETE SET NULL, -- Se excluir plano, aluno fica 'sem plano'
    FOREIGN KEY (ProfessorID) REFERENCES Usuarios(ID) ON DELETE RESTRICT,
    FOREIGN KEY (UsuarioID) REFERENCES Usuarios(ID) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 5. Tabela de Turmas
CREATE TABLE Turmas (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    Nome VARCHAR(100) NOT NULL,
    Descricao VARCHAR(255),
    CargaHoraria INT DEFAULT 0,
    ProfessorID INT NOT NULL,
    DataCriacao DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ProfessorID) REFERENCES Usuarios(ID) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- 6. Tabela de Relacionamento Alunos-Turmas (Matrícula)
CREATE TABLE AlunosTurmas (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    AlunoID INT NOT NULL,
    TurmaID INT NOT NULL,
    DataInicio DATE DEFAULT (CURRENT_DATE),
    FOREIGN KEY (AlunoID) REFERENCES Alunos(ID) ON DELETE CASCADE,
    FOREIGN KEY (TurmaID) REFERENCES Turmas(ID) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 7. Tabela de Relatórios
CREATE TABLE Relatorios (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    Titulo VARCHAR(100) NOT NULL,
    Tipo VARCHAR(50) NOT NULL,
    DataInicial DATE,
    DataFinal DATE,
    TurmaID INT,
    ProfessorID INT NOT NULL,
    DataGeracao DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (TurmaID) REFERENCES Turmas(ID) ON DELETE SET NULL,
    FOREIGN KEY (ProfessorID) REFERENCES Usuarios(ID) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 8. Tabela de Pagamentos

CREATE TABLE Pagamentos (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    AlunoID INT NOT NULL,
    Referencia VARCHAR(50) NOT NULL, -- Ex: "Mensalidade Maio/2025"
    Valor DECIMAL(10, 2) NOT NULL,
    DataVencimento DATE NOT NULL,
    DataPagamento DATE, -- Se estiver NULL, não pagou ainda
    Status ENUM('Pendente', 'Pago', 'Atrasado', 'Cancelado') DEFAULT 'Pendente',
    FormaPagamento VARCHAR(50), -- Pix, Dinheiro, Cartão (Apenas informativo por enquanto)
    FOREIGN KEY (AlunoID) REFERENCES Alunos(ID) ON DELETE CASCADE
);

-- 9. Tabela de Frequência

CREATE TABLE Frequencia (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    AlunoID INT NOT NULL,
    DataPresenca DATE NOT NULL,
    HoraEntrada TIME DEFAULT (CURRENT_TIME),
    FOREIGN KEY (AlunoID) REFERENCES Alunos(ID) ON DELETE CASCADE
);

-- Dica: Crie um índice para deixar o ranking rápido no futuro
CREATE INDEX idx_frequencia_data ON Frequencia(DataPresenca);

-- recuperar senha

ALTER TABLE Usuarios 
ADD COLUMN ResetToken VARCHAR(255) NULL,
ADD COLUMN ResetExpires DATETIME NULL;

ALTER TABLE Pagamentos 
ADD COLUMN GatewayID VARCHAR(100) NULL, -- ID do MercadoPago/Asaas
ADD COLUMN LinkPagamento TEXT NULL,     -- O Link ou "Copia e Cola" do Pix
ADD COLUMN QrCodeBase64 TEXT NULL;      -- A imagem do QR Code

-- Índices de Performance
CREATE INDEX idx_alunos_professor ON Alunos(ProfessorID);
CREATE INDEX idx_planos_criador ON Planos(CriadoPor);
CREATE INDEX idx_turmas_professor ON Turmas(ProfessorID);
CREATE INDEX idx_relatorios_professor ON Relatorios(ProfessorID);

-- Adiciona CPF na tabela de login
ALTER TABLE Usuarios ADD COLUMN CPF VARCHAR(14) NULL;

-- (Opcional) Se quiser garantir que não tenha CPF repetido no login
ALTER TABLE Usuarios ADD CONSTRAINT UQ_Usuarios_CPF UNIQUE (CPF);

-- ATENÇÃO: Se você já tem um usuário ADMIN (admin@panda.com), 
-- vá no banco e coloque um CPF nele manualmente agora (ex: '00000000000'), 
-- senão ele não vai conseguir logar depois!