document.addEventListener('DOMContentLoaded', () => {
    // --- NAVEGAÇÃO ---
    const menuItems = document.querySelectorAll('.menu-item');
    const contentSections = document.querySelectorAll('.content-section');
    const sidebar = document.getElementById('sidebar');
    const toggleMenu = document.getElementById('toggle-menu');
    const mainContent = document.querySelector('.main-content');

    // Alternar abas do menu
    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            // 1. Lógica padrão das abas (Muda o conteúdo)
            menuItems.forEach(i => i.classList.remove('active'));
            contentSections.forEach(s => s.classList.remove('active'));

            item.classList.add('active');
            const sectionId = item.getAttribute('data-content') + '-content';
            const sectionToShow = document.getElementById(sectionId);
            if (sectionToShow) sectionToShow.classList.add('active');

            // 2. NOVO: Fecha o menu automaticamente no mobile
            // Verifica se está em tela pequena (ex: 768px)
            if (window.innerWidth <= 768) {
                sidebar.classList.remove('expanded');
            }
        });
    });

    if(toggleMenu) {
        toggleMenu.addEventListener('click', () => {
            // Apenas alterna a classe 'expanded'
            // O CSS acima cuida de aumentar de 70px para 250px
            sidebar.classList.toggle('expanded');
        });
    }

    // Função auxiliar para verificar segurança
    function verificarAuth(res) {
        if (res.status === 401 || res.status === 403) {
            window.location.href = '/';
            return false; // Indica que falhou
        }
        return true; // Indica que pode continuar
    }

    // --- AÇÕES DO ALUNO ---
    // Exemplo: Botão de Mudar Plano
    const changePlanBtns = document.querySelectorAll('.change-plan-btn');
    changePlanBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Futura integração com Node.js
            // fetch('/api/aluno/mudar-plano', { ... })
            const planoNome = btn.parentElement.querySelector('h3').innerText;
            if(confirm(`Deseja solicitar a mudança para o ${planoNome}?`)) {
                showToast('sucess', 'Solicitação enviada para a administração!', 'Aguarde a resposta!');
            }
        });
    });

// --- CARREGAR DADOS DO PERFIL ---
    async function carregarPerfil() {
        try {

            const res = await fetch('/api/aluno/plano');
            if (!verificarAuth(res)) return; // Se falhou, para aqui.

            const dados = await res.json();
            
            const response = await fetch('/api/aluno/perfil');
            
            // Se der erro (ex: sessão expirou), manda pro login
            if (!response.ok) {
                window.location.href = '/'; 
                return;
            }

            const aluno = await response.json();
            
            // Preencher os dados na tela
            // Vamos usar uma função auxiliar para não repetir código
            setText('user-name-display', aluno.NomeCompleto); // Nome no Header
            setText('profile-name', aluno.NomeCompleto); // Nome no Card
            setText('profile-since', `Aluno desde: ${new Date(aluno.DataCriacao).toLocaleDateString('pt-BR')}`);
            setText('profile-plan', `Plano: ${aluno.PlanoNome || 'Sem Plano'}`);
            
            // Preencher campos do formulário (Inputs desabilitados)
            setVal('input-nome', aluno.NomeCompleto);
            setVal('input-email', aluno.Email);
            setVal('input-telefone', aluno.Telefone);
            setVal('input-rua', aluno.Rua);
            setVal('input-bairro', aluno.Bairro);
            
            // Formatar data de nascimento
            if (aluno.DataNascimento) {
                const nasc = new Date(aluno.DataNascimento).toLocaleDateString('pt-BR');
                setVal('input-nascimento', nasc);
            } else {
                setVal('input-nascimento', 'Não informada');
            }

            // Lógica da Foto:
            const imgElement = document.getElementById('img-perfil-visual');
            if (imgElement) {
                if (aluno.FotoPath) {
                    // Se tiver foto no banco, usa ela
                    imgElement.src = `/uploads/perfil/${aluno.FotoPath}`;
                } else {
                    // Se não tiver, usa o Pandão padrão
                    imgElement.src = '/alunos/images/pandao.png';
                }
            }

        } catch (error) {
            console.error('Erro ao carregar perfil:', error);
        }
    }

    // Funções auxiliares para facilitar
    function setText(id, text) {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    }
    
    function setVal(id, val) {
        const el = document.getElementById(id);
        if (el) el.value = val || '';
    }

    // Chama a função
    carregarPerfil();

    // ==========================================
    // MÓDULO DE PLANOS (VISÃO DO ALUNO)
    // ==========================================

    const planosContent = document.getElementById('planos-content');

    async function carregarPlanoAluno() {
        // Verifica se estamos na tela certa
        if (!planosContent) return;

        try {
            const res = await fetch('/api/aluno/plano');
            const dados = await res.json();

            // Elementos onde vamos injetar o HTML
            const divPlanoAtual = document.querySelector('.current-plan');
            const divOutrosPlanos = document.querySelector('.available-plans .plans-container');

            if (!dados.temPlano) {
                divPlanoAtual.innerHTML = '<p class="alert">Você ainda não possui um plano ativo. Fale com a recepção.</p>';
                return;
            }

            // 1. RENDERIZAR MEU PLANO ATUAL
            const p = dados.plano;
            
            // Gerar lista de características (com check ou x)
            let featuresHtml = '';
            if (p.features && p.features.length > 0) {
                featuresHtml = '<ul>' + p.features.map(f => `
                    <li>
                        <i class="fas ${f.Incluido ? 'fa-check' : 'fa-times'}" 
                           style="color: ${f.Incluido ? 'var(--success-color)' : 'var(--danger-color)'}"></i> 
                        ${f.Descricao}
                    </li>
                `).join('') + '</ul>';
            } else {
                featuresHtml = '<p>Sem itens adicionais.</p>';
            }

            // Monta o Card Principal
            divPlanoAtual.innerHTML = `
                <h3>Meu Plano Atual</h3>
                <div class="plan-card current featured" style="border: 2px solid var(--success-color);">
                    <div class="plan-badge" style="background: var(--success-color);">Ativo</div>
                    <div class="plan-header">
                        <h3>${p.Nome}</h3>
                        <span class="plan-price">R$ ${parseFloat(p.Preco).toFixed(2).replace('.', ',')} <span class="period">/mês</span></span>
                    </div>
                    <div class="plan-features">
                        ${featuresHtml}
                    </div>
                    <div class="plan-info">
                        <p>Data de Início: <strong>${new Date(p.DataMatricula).toLocaleDateString('pt-BR')}</strong></p>
                        <p>Status: <span class="status-active" style="color: var(--success-color); font-weight: bold;">● Confirmado</span></p>
                    </div>
                </div>
            `;

            // 2. RENDERIZAR OUTROS PLANOS (UPGRADE)
            if (divOutrosPlanos && dados.outros.length > 0) {
                divOutrosPlanos.innerHTML = dados.outros.map(outro => `
                    <div class="plan-card">
                        <div class="plan-header">
                            <h3>${outro.Nome}</h3>
                            <span class="plan-price">R$ ${parseFloat(outro.Preco).toFixed(2).replace('.', ',')} <span class="period">/mês</span></span>
                        </div>
                        <div class="plan-actions" style="padding: 20px;">
                            <button class="change-plan-btn" onclick="alert('Solicitação de mudança enviada para a secretaria!')">
                                Tenho Interesse
                            </button>
                        </div>
                    </div>
                `).join('');
            } else if (divOutrosPlanos) {
                divOutrosPlanos.innerHTML = '<p>Não há outros planos disponíveis no momento.</p>';
            }

        } catch (err) {
            console.error('Erro ao carregar planos do aluno:', err);
        }
    }

    // Chama a função sempre que clicar na aba "Planos"
    // E também chama uma vez no início para garantir
    const btnMenuPlanos = document.querySelector('.menu-item[data-content="planos"]');
    if(btnMenuPlanos) {
        btnMenuPlanos.addEventListener('click', carregarPlanoAluno);
    }
    
    // Se a página já carregar (ou se for SPA simples), tenta carregar
    carregarPlanoAluno();

// ==========================================
    // MÓDULO DE EDIÇÃO DE PERFIL (ALUNO)
    // ==========================================

    // 1. ALTERAR DADOS PESSOAIS
    const btnEnableEdit = document.getElementById('btn-enable-edit');
    const btnSaveInfo = document.getElementById('btn-save-info');
    const inputsInfo = ['input-email', 'input-telefone', 'input-rua', 'input-bairro']; // Campos editáveis

    if (btnEnableEdit && btnSaveInfo) {
        // Habilitar Edição
        btnEnableEdit.addEventListener('click', () => {
            inputsInfo.forEach(id => {
                const el = document.getElementById(id);
                if(el) {
                    el.disabled = false;
                    el.style.border = '1px solid var(--primary-color)';
                }
            });
            btnEnableEdit.style.display = 'none';
            btnSaveInfo.style.display = 'block';
        });

        // Salvar Dados
        btnSaveInfo.addEventListener('click', async () => {
            const dados = {
                email: document.getElementById('input-email').value,
                telefone: document.getElementById('input-telefone').value,
                rua: document.getElementById('input-rua').value,
                bairro: document.getElementById('input-bairro').value
            };

            try {
                const res = await fetch('/api/aluno/perfil', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(dados)
                });
                const result = await res.json();

                if (result.sucesso) {
                    showToast('sucess', 'Dados atualizados!', 'Atualização concluída!');
                    // Bloqueia tudo de novo
                    inputsInfo.forEach(id => {
                        const el = document.getElementById(id);
                        if(el) {
                            el.disabled = true;
                            el.style.border = '1px solid var(--medium-gray)';
                        }
                    });
                    btnSaveInfo.style.display = 'none';
                    btnEnableEdit.style.display = 'block';
                } else {
                    showToast('error', 'Erro', result.mensagem);
                }
            } catch (err) {
                console.error(err);
                showToast('error', 'Erro de conexão.');
            }
        });
    }

    // 2. ALTERAR SENHA
    const btnChangePass = document.getElementById('btn-change-password');
    if (btnChangePass) {
        btnChangePass.addEventListener('click', async () => {
            const atual = document.getElementById('senha-atual').value;
            const nova = document.getElementById('nova-senha').value;
            const confirmar = document.getElementById('confirmar-senha').value;

            if (!atual || !nova || !confirmar) {
                showToast('sucess', 'Preencha todos os campos de senha.', 'Verifique os campos!');
                return;
            }

            if (nova !== confirmar) {
                showToast('sucess', 'A nova senha e a confirmação não batem.', 'Verifique os campos!');
                return;
            }

            try {
                const res = await fetch('/api/aluno/perfil', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        senha_atual: atual,
                        nova_senha: nova,
                        confirmar_senha: confirmar
                    })
                });
                const result = await res.json();

                if (result.sucesso) {
                    showToast('sucess', 'Senha alterada com sucesso!', 'Senha alterada!');
                    // Limpa os campos
                    document.getElementById('senha-atual').value = '';
                    document.getElementById('nova-senha').value = '';
                    document.getElementById('confirmar-senha').value = '';
                } else {
                    showToast('error', 'Erro', result.mensagem);
                }
            } catch (err) {
                console.error(err);
                showToast('error', 'Erro ao alterar senha.', 'Erro');
            }
        });
    }

    // ==========================================
    // MÓDULO DE PAGAMENTOS
    // ==========================================

    const sectionPagamentos = document.getElementById('pagamento-content');

    async function carregarPagamentos() {
        if (!sectionPagamentos) return;

        try {
            const res = await fetch('/api/aluno/pagamentos');
            const faturas = await res.json();

            // Vamos reconstruir a tela para tirar os cartões falsos e deixar só o histórico
            // Se quiser manter os cartões visuais, me avise, mas acho melhor limpar.
            
            let listaHtml = '';
            
            if (faturas.length === 0) {
                listaHtml = '<div class="empty-state"><p>Nenhuma fatura encontrada.</p></div>';
            } else {
                faturas.forEach(fat => {
                    // Formatação de datas e valores
                    const vencimento = new Date(fat.DataVencimento);
                    const mes = vencimento.toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase();
                    const dia = vencimento.getDate();
                    const valor = parseFloat(fat.Valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                    
                    // Classes de cor baseadas no status
                    let statusClass = 'pending'; // amarelo
                    if (fat.Status === 'Pago') statusClass = 'success'; // verde
                    if (fat.Status === 'Atrasado') statusClass = 'failed'; // vermelho
                    
                    // Data de pagamento (se houver)
                    const infoPago = fat.DataPagamento 
                        ? `<br><small style="color:#666">Pago em: ${new Date(fat.DataPagamento).toLocaleDateString('pt-BR')}</small>` 
                        : '';

                    listaHtml += `
                        <div class="payment-history-item">
                            <div class="payment-date">
                                <span class="month">${mes.replace('.', '')}</span>
                                <span class="day">${dia}</span>
                            </div>
                            <div class="payment-details">
                                <h4>${fat.Referencia}</h4>
                                <p>Vencimento: ${vencimento.toLocaleDateString('pt-BR')}${infoPago}</p>
                            </div>
                            <div class="payment-amount">
                                <span>${valor}</span>
                                <span class="payment-status ${statusClass}">${fat.Status}</span>
                            </div>
                        </div>
                    `;
                });
            }

            // Injeta o HTML limpo
            sectionPagamentos.innerHTML = `
                <h2>Histórico Financeiro</h2>
                <div class="payment-container" style="display: block;"> <div class="payment-history">
                        <h3>Minhas Mensalidades</h3>
                        <div class="payment-history-list">
                            ${listaHtml}
                        </div>
                    </div>
                </div>
            `;

        } catch (err) {
            console.error(err);
        }
    }

    // Chama ao clicar na aba
    const btnMenuPagamento = document.querySelector('.menu-item[data-content="pagamento"]');
    if(btnMenuPagamento) {
        btnMenuPagamento.addEventListener('click', carregarPagamentos);
    }


    // ==========================================
    // MÓDULO EVOLUÇÃO (ALUNO)
    // ==========================================
    async function carregarEvolucao() {
        // Verifica se a seção existe (lembre de renomear o ID no HTML se ainda não fez)
        const elOfensiva = document.getElementById('evo-ofensiva');
        if (!elOfensiva) return;

        try {
            const res = await fetch('/api/aluno/evolucao');
            const dados = await res.json();

            // 1. Preenche Cards
            elOfensiva.textContent = dados.ofensiva;
            document.getElementById('evo-mes').textContent = dados.treinosMes;

            // 2. Preenche Ranking
            const lista = document.getElementById('ranking-list');
            if (dados.ranking.length === 0) {
                lista.innerHTML = '<li>Ninguém treinou este mês ainda. Seja o primeiro!</li>';
            } else {
                lista.innerHTML = dados.ranking.map((r, index) => {
                    let icone = `<span style="font-weight:bold; width: 25px; display:inline-block;">${r.posicao}º</span>`;
                    if (r.posicao === 1) icone = '🥇';
                    if (r.posicao === 2) icone = '🥈';
                    if (r.posicao === 3) icone = '🥉';
                    
                    // Destaca se for o usuário atual
                    const isMe = (r.posicao === dados.minhaPosicao);
                    const style = isMe ? 'background: #f0f8ff; border: 1px solid #b3d7ff;' : 'border-bottom: 1px solid #eee;';

                    return `
                        <li style="padding: 12px; display: flex; justify-content: space-between; align-items: center; ${style} border-radius: 8px;">
                            <div>
                                <span style="font-size: 1.2rem; margin-right: 10px;">${icone}</span>
                                <span style="font-weight: 500;">${r.nome}</span>
                            </div>
                            <span style="background: #eee; padding: 4px 10px; border-radius: 20px; font-size: 0.9rem;">${r.treinos} treinos</span>
                        </li>
                    `;
                }).join('');
            }

            // 3. Minha Posição
            const alerta = document.getElementById('minha-posicao-alert');
            if (dados.minhaPosicao > 0) {
                alerta.textContent = `Você está na ${dados.minhaPosicao}ª posição no ranking geral! 🚀`;
            } else {
                alerta.textContent = 'Faça seu primeiro check-in para entrar no ranking!';
            }

        } catch (err) {
            console.error('Erro ao carregar evolução:', err);
        }
    }

    const btnEvolucao = document.querySelector('.menu-item[data-content="evolucao"]');
    if (btnEvolucao) {
        btnEvolucao.addEventListener('click', carregarEvolucao);
    }

    // ==========================================
    // SISTEMA DE NOTIFICAÇÕES (TOASTS)
    // ==========================================
    
    function showToast(type, title, message) {
        const container = document.getElementById('toast-container');
        if (!container) return;

        // Cria o elemento do toast
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`; // success, error, warning, info
        
        // Define o ícone baseado no tipo
        let iconClass = 'fa-info-circle';
        if (type === 'success') iconClass = 'fa-check-circle';
        if (type === 'error') iconClass = 'fa-exclamation-triangle';
        if (type === 'warning') iconClass = 'fa-exclamation-circle';

        toast.innerHTML = `
            <div class="toast-icon"><i class="fas ${iconClass}"></i></div>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close"><i class="fas fa-times"></i></button>
        `;

        // Adiciona ao container
        container.appendChild(toast);

        // Função para remover
        const removeToast = () => {
            toast.classList.add('hiding');
            toast.addEventListener('transitionend', () => toast.remove());
        };

        // Remove automático após 4 segundos
        setTimeout(removeToast, 4000);

        // Remove ao clicar no X
        const btnClose = toast.querySelector('.toast-close');
        if(btnClose) btnClose.addEventListener('click', removeToast);
    }


    // ==========================================
    // MÓDULO DE FOTO (UPLOAD)
    // ==========================================
    const btnCamera = document.getElementById('btn-camera');
    const inputFoto = document.getElementById('input-foto-perfil');
    const imgPerfil = document.getElementById('img-perfil-visual');

    if(btnCamera && inputFoto) {
        // 1. Clique no ícone abre o seletor de arquivo
        btnCamera.addEventListener('click', (e) => {
            e.preventDefault();
            inputFoto.click();
        });

        // 2. Quando seleciona a foto
        inputFoto.addEventListener('change', async () => {
            if (inputFoto.files && inputFoto.files[0]) {
                const arquivo = inputFoto.files[0];
                
                // Validação de tamanho (5MB)
                if (arquivo.size > 5 * 1024 * 1024) {
                    alert('A imagem deve ter no máximo 5MB.');
                    return;
                }

                const formData = new FormData();
                formData.append('foto_perfil', arquivo);

                try {
                    // Efeito visual de carregando
                    if (imgPerfil) imgPerfil.style.opacity = '0.5';

                    const res = await fetch('/api/aluno/foto', {
                        method: 'POST',
                        // NÃO coloque Content-Type aqui, o browser resolve sozinho
                        body: formData 
                    });
                    
                    const result = await res.json();

                    if(result.sucesso) {
                        // Atualiza a imagem com timestamp para evitar cache
                        if (imgPerfil) {
                            imgPerfil.src = result.novoCaminho + '?t=' + new Date().getTime();
                            imgPerfil.style.opacity = '1';
                        }
                        // Se tiver a função de toast no aluno, use: showToast(...)
                        alert('Foto atualizada com sucesso!');
                    } else {
                        alert('Erro: ' + result.mensagem);
                        if (imgPerfil) imgPerfil.style.opacity = '1';
                    }
                } catch (err) {
                    console.error(err);
                    alert('Erro ao enviar foto.');
                    if (imgPerfil) imgPerfil.style.opacity = '1';
                }
                
                // Limpa o input para permitir selecionar a mesma foto se errar
                inputFoto.value = '';
            }
        });
    }
    
    // Atualizar Hora
    function updateTime() {
        const now = new Date();
        const timeEl = document.getElementById('current-time');
        if(timeEl) timeEl.innerText = now.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'});
    }
    setInterval(updateTime, 1000);
    updateTime();
});