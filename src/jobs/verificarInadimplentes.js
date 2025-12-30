const cron = require('node-cron');
const db = require('../config/db');

// Função que faz o trabalho sujo
async function bloquearDevedores() {
    console.log('🕵️  CRON: Verificando alunos inadimplentes...');
    
    try {
        // Regra: Bloqueia quem tem pagamento 'Pendente' vencido há mais de 1 dia
        // (Usamos DATE_SUB ou comparamos direto com < CURRENT_DATE)
        
        const sql = `
            UPDATE Alunos A
            JOIN Pagamentos P ON A.ID = P.AlunoID
            SET A.Status = 0
            WHERE A.Status = 1             -- Só olha quem está ativo
              AND P.Status = 'Pendente'    -- Que deve
              AND P.DataVencimento < CURDATE() -- E já venceu (ontem ou antes)
        `;

        const [result] = await db.query(sql);

        if (result.changedRows > 0) {
            console.log(`🔒 CRON: ${result.changedRows} alunos foram bloqueados por falta de pagamento.`);
        } else {
            console.log('✅ CRON: Nenhum aluno novo para bloquear hoje.');
        }

    } catch (error) {
        console.error('❌ Erro no CRON de inadimplência:', error);
    }
}

// Configura o agendamento
function iniciarJob() {
    // A string '0 0 * * *' significa "Todo dia à meia-noite (00:00)"
    // Para testar agora, você pode usar '*/1 * * * *' (Roda a cada 1 minuto)
    cron.schedule('0 0 * * *', () => {
        bloquearDevedores();
    });
    
    console.log('⏰ Job de Verificação de Inadimplência iniciado (Roda 00:00).');
}

module.exports = { iniciarJob };