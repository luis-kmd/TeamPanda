document.addEventListener('DOMContentLoaded', () => {
    // --- NAVEGAÇÃO LATERAL (SIDEBAR) ---
    const menuItems = document.querySelectorAll('.menu-item');
    const contentSections = document.querySelectorAll('.content-section');
    const sidebar = document.getElementById('sidebar');
    const toggleMenu = document.getElementById('toggle-menu');
    const mainContent = document.querySelector('.main-content');

    let listaPlanosCache = [];
    let listaAlunosCache = [];
    
    // NOTA: Removemos o 'selectPlano' daqui de cima para evitar o erro de referência antiga
    let formAluno = document.getElementById('aluno-form'); // Usamos let para poder atualizar a referência

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
    
    // Alternar abas do menu
    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            menuItems.forEach(i => i.classList.remove('active'));
            contentSections.forEach(s => s.classList.remove('active'));

            item.classList.add('active');
            const sectionId = item.getAttribute('data-content') + '-content';
            const sectionToShow = document.getElementById(sectionId);
            if (sectionToShow) sectionToShow.classList.add('active');
        });
    });

    // Toggle Menu Mobile/Collapse
    toggleMenu.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
        mainContent.classList.toggle('expanded');
    });

    // --- GERENCIAMENTO DE MODAIS ---
    function setupModal(triggerId, modalId, closeBtnId, cancelBtnId) {
        const trigger = document.getElementById(triggerId);
        const modal = document.getElementById(modalId);
        const closeBtn = document.getElementById(closeBtnId);
        const cancelBtn = document.getElementById(cancelBtnId);

        if (trigger && modal) {
            trigger.addEventListener('click', () => modal.classList.add('active'));
        }
        
        const closeFunc = () => modal.classList.remove('active');
        if (closeBtn) closeBtn.addEventListener('click', closeFunc);
        if (cancelBtn) cancelBtn.addEventListener('click', closeFunc);
        
        window.addEventListener('click', (e) => {
            if (e.target === modal) closeFunc();
        });
    }

    setupModal('edit-profile-btn', 'edit-profile-modal', 'close-profile-modal', 'cancel-profile-edit');
    setupModal('add-aluno-btn', 'aluno-modal', 'close-aluno-modal', 'cancel-aluno');
    setupModal('add-plano-btn', 'add-plano-modal', 'close-add-plano-modal', 'cancel-add-plano');

    // --- TABELA DE ALUNOS ---
    const alunosTableBody = document.getElementById('alunos-table-body');

    // Busca dados no servidor e salva no cache
    async function carregarAlunos() {
        try {
            const response = await fetch('/api/alunos');
            const alunos = await response.json();
            
            // Salva na memória global para a busca funcionar
            listaAlunosCache = alunos;
            
            renderAlunos(listaAlunosCache); // Renderiza tudo inicialmente
        } catch (error) {
            console.error('Erro:', error);
        }
    }

    function renderAlunos(lista) {
        if (!alunosTableBody) return;
        alunosTableBody.innerHTML = ''; 

        if (lista.length === 0) {
            alunosTableBody.innerHTML = `<tr><td colspan="6" class="empty-message">Nenhum aluno encontrado.</td></tr>`;
            return;
        }

        // Adicionei o parametro 'index' no forEach
        lista.forEach((aluno, index) => {
            const statusClass = aluno.Status ? 'active' : 'inactive';
            const statusText = aluno.Status ? 'Ativo' : 'Inativo';
            const planoNome = aluno.Plano || 'Sem Plano'; 

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${index + 1}</td> <td>${aluno.NomeCompleto}</td>
                <td>${aluno.Email}</td>
                <td>${planoNome}</td>
                <td><span class="status ${statusClass}">${statusText}</span></td>
                <td>
                    <button class="action-btn pay" data-id="${aluno.ID}" title="Registrar Pagamento" style="color: var(--success-color);"><i class="fas fa-dollar-sign"></i></button>
                    <button class="action-btn edit" data-id="${aluno.ID}" title="Editar"><i class="fas fa-edit"></i></button>
                    <button class="action-btn delete" data-id="${aluno.ID}" title="Excluir"><i class="fas fa-trash"></i></button>
                </td>
            `;
            alunosTableBody.appendChild(tr);
        });
    }

    // --- LÓGICA DE BUSCA (FILTRO) ---
    const inputSearch = document.getElementById('aluno-search');
    const btnSearch = document.getElementById('search-aluno-btn');

    function filtrarAlunos() {
        const termo = inputSearch.value.toLowerCase();
        
        // Filtra a lista cacheada
        const filtrados = listaAlunosCache.filter(aluno => 
            aluno.NomeCompleto.toLowerCase().includes(termo) ||
            aluno.Email.toLowerCase().includes(termo) || 
            aluno.ID.toString().includes(termo) // Ainda permite buscar pelo ID real se precisar
        );
        
        renderAlunos(filtrados);
    }

    if (inputSearch) {
        // Filtra enquanto digita (tempo real)
        inputSearch.addEventListener('input', filtrarAlunos);
    }
    
    if (btnSearch) {
        btnSearch.addEventListener('click', filtrarAlunos);
    }

    // --- LÓGICA DE EVENTOS (EDITAR/EXCLUIR) ---
    alunosTableBody.addEventListener('click', async (e) => {
        const btnDelete = e.target.closest('.delete');
        const btnEdit = e.target.closest('.edit');

        // EXCLUIR
        if (btnDelete) {
            const id = btnDelete.dataset.id;
            if (confirm('Tem certeza que deseja excluir?')) {
                try {
                    const res = await fetch(`/api/alunos/${id}`, { method: 'DELETE' });
                    const dados = await res.json();
                    if (dados.sucesso) {
                        showToast('success', 'Excluído', 'O aluno e seu login foram removidos.');
                        carregarAlunos();
                    } else {
                        showToast('error', 'Erro', 'Não foi possível excluir o aluno.');
                    }
                } catch (err) { console.error(err); }
            }
        }

        // EDITAR (Preencher Modal)
        if (btnEdit) {
            const id = btnEdit.dataset.id;
            try {
                const res = await fetch(`/api/alunos/${id}`);
                const aluno = await res.json();

                document.getElementById('aluno-id').value = aluno.ID;
                document.getElementById('aluno-nome').value = aluno.NomeCompleto;
                document.getElementById('aluno-email').value = aluno.Email;
                document.getElementById('aluno-telefone').value = aluno.Telefone;
                document.getElementById('aluno-cpf').value = aluno.CPF;
                if(aluno.DataNascimento) {
                    document.getElementById('aluno-nascimento').value = new Date(aluno.DataNascimento).toISOString().split('T')[0];
                }
                document.getElementById('aluno-rua').value = aluno.Rua;
                document.getElementById('aluno-bairro').value = aluno.Bairro;
                
                // Aqui o select já deve estar populado, então podemos setar o valor
                document.getElementById('aluno-plano').value = aluno.PlanoID;
                
                document.getElementById('aluno-observacoes').value = aluno.Observacoes;
                document.getElementById('aluno-status').checked = (aluno.Status == 1);

                document.getElementById('aluno-modal-title').innerText = "Editar Aluno";
                document.getElementById('aluno-modal').classList.add('active');

            } catch (err) { console.error(err); }
        }
    });

    // --- CONFIGURAÇÃO DO FORMULÁRIO (Novo e Editar) ---
    if (formAluno) {
        // Truque para limpar listeners antigos: clonar e substituir
        const novoFormAluno = formAluno.cloneNode(true);
        formAluno.parentNode.replaceChild(novoFormAluno, formAluno);
        formAluno = novoFormAluno; // Atualizamos a variável global para apontar para o novo

        // Listener do formulário NOVO
        formAluno.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(formAluno);
            const dados = Object.fromEntries(formData); 
            dados.status = document.getElementById('aluno-status').checked;
            
            const id = document.getElementById('aluno-id').value;
            
            let url = '/api/alunos';
            let method = 'POST';

            if (id) {
                url = `/api/alunos/${id}`;
                method = 'PUT';
            }

            try {
                const response = await fetch(url, {
                    method: method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(dados)
                });
                
                const resultado = await response.json();
                
                if (resultado.sucesso) {
                    showToast('success', 'Sucesso!', id ? 'Dados do aluno atualizados.' : 'Novo aluno cadastrado.');
                    document.getElementById('aluno-modal').classList.remove('active')
                    formAluno.reset();
                    document.getElementById('aluno-id').value = '';
                    document.getElementById('aluno-modal-title').innerText = "Adicionar Novo Aluno";
                    carregarAlunos();
                } else {
                    showToast('error', 'Erro ao salvar', resultado.mensagem);
                }
            } catch (error) {
                console.error(error);
                showToast('error', 'Erro de conexão', 'Erro de conexão!')
            }
        });
        
        // Botão Novo Aluno (Limpar form)
        const btnNovoAluno = document.getElementById('add-aluno-btn');
        if (btnNovoAluno) {
            btnNovoAluno.addEventListener('click', () => {
                formAluno.reset();
                document.getElementById('aluno-id').value = '';
                document.getElementById('aluno-modal-title').innerText = "Adicionar Novo Aluno";
            });
        }
    }


    // --- CARREGAR PLANOS (Corrigido) ---
    async function carregarPlanosSelect() {
        try {
            // CORREÇÃO: Buscamos o elemento pelo ID aqui dentro, para pegar o formulário VIVO
            const selectAtual = document.getElementById('aluno-plano');
            
            if (!selectAtual) return; // Segurança

            const response = await fetch('/api/planos/select');
            const planos = await response.json();
            
            selectAtual.innerHTML = '<option value="">Selecione um plano</option>';
            
            planos.forEach(plano => {
                const option = document.createElement('option');
                option.value = plano.ID;
                option.textContent = plano.Nome;
                selectAtual.appendChild(option);
            });
        } catch (error) {
            console.error('Erro ao carregar planos:', error);
        }
    }

    // ==========================================
    // MÓDULO DE PLANOS
    // ==========================================
    
    const plansContainer = document.getElementById('plans-container');
    const addFeatureBtn = document.getElementById('add-add-feature-btn'); 
    const addFeaturesContainer = document.getElementById('add-features-container');
    const formAddPlano = document.getElementById('add-plano-form');
    const modalPlano = document.getElementById('add-plano-modal');
    const modalPlanoTitle = modalPlano ? modalPlano.querySelector('h3') : null;
    const btnSubmitPlano = formAddPlano ? formAddPlano.querySelector('button[type="submit"]') : null;

    // Variável para controlar se estamos Editando (ID) ou Criando (null)
    let editingPlanId = null;

    // 1. CARREGAR PLANOS (Cards)
    async function carregarPlanos() {
        if (!plansContainer) return;
        
        try {
            const res = await fetch('/api/planos');
            const planos = await res.json();
            
            // Limpa container
            plansContainer.innerHTML = '';

            // Renderiza cada plano
            planos.forEach(plano => {
                const destaqueClass = plano.Destaque ? 'featured' : '';
                const destaqueBadge = plano.Destaque ? '<div class="plan-badge">Destaque</div>' : '';
                
                let featuresHtml = '';
                if(plano.features && plano.features.length > 0) {
                    featuresHtml = '<ul>' + plano.features.map(f => `
                        <li><i class="fas ${f.Incluido ? 'fa-check' : 'fa-times'}"></i> ${f.Descricao}</li>
                    `).join('') + '</ul>';
                } else {
                    featuresHtml = '<p style="text-align:center; color:#888; font-size: 0.9rem;">Sem itens cadastrados</p>';
                }

                const card = document.createElement('div');
                card.className = `plan-card ${destaqueClass}`;
                card.innerHTML = `
                    ${destaqueBadge}
                    <div class="plan-header">
                        <h3>${plano.Nome}</h3>
                        <span class="plan-price">R$ ${parseFloat(plano.Preco).toFixed(2).replace('.', ',')}</span>
                        <span class="period">/mês</span>
                    </div>
                    <div class="plan-features">${featuresHtml}</div>
                    <div class="plan-actions">
                        <button class="edit-plan" data-id="${plano.ID}"><i class="fas fa-edit"></i> Editar</button>
                        <button class="delete-btn" data-id="${plano.ID}"><i class="fas fa-trash"></i></button>
                    </div>
                `;
                plansContainer.appendChild(card);
            });

            // Adiciona o Botão "Novo Plano" no final (Estilo Card Tracejado)
            const addCard = document.createElement('div');
            addCard.className = 'plan-card add-new';
            addCard.innerHTML = `
                <i class="fas fa-plus-circle"></i>
                <span>Criar Novo Plano</span>
            `;
            addCard.addEventListener('click', () => {
                resetModalPlano(); // Limpa form
                modalPlano.classList.add('active');
            });
            plansContainer.appendChild(addCard);

        } catch (err) { console.error(err); }
    }
    
    carregarPlanos();

    // 2. FUNÇÃO AUXILIAR: Adicionar Linha de Característica no Form
    function addFeatureRow(texto = '', incluido = true) {
        if(!addFeaturesContainer) return;
        
        const div = document.createElement('div');
        div.className = 'feature-item';
        div.innerHTML = `
            <div class="form-group">
                <input type="text" name="features[]" placeholder="Ex: Acesso a piscina" value="${texto}" required>
            </div>
            <div class="form-group checkbox-group">
                <input type="checkbox" name="feature_included[]" ${incluido ? 'checked' : ''}>
                <label>Incluído</label>
            </div>
            <button type="button" class="remove-feature-btn"><i class="fas fa-times"></i></button>
        `;
        addFeaturesContainer.appendChild(div);
        
        div.querySelector('.remove-feature-btn').addEventListener('click', function() {
            this.parentElement.remove();
        });
    }

    // Botão "+" dentro do modal
    if(addFeatureBtn) {
        addFeatureBtn.addEventListener('click', () => addFeatureRow());
    }

    // 3. EVENTOS NOS CARDS (Editar / Excluir)
    if(plansContainer) {
        plansContainer.addEventListener('click', async (e) => {
            // EXCLUIR
            const btnDelete = e.target.closest('.delete-btn');
            if(btnDelete) {
                if(confirm('Deseja excluir este plano?')) {
                    const id = btnDelete.dataset.id;
                    const res = await fetch(`/api/planos/${id}`, { method: 'DELETE' });
                    const result = await res.json();
                    if(result.sucesso) {
                        showToast('sucess', 'Plano excluído!', 'O plano foi removido!')
                        carregarPlanos();
                    } else { showToast('error', 'Erro ao excluir o Plano!', 'Plano não excluído.'); }
                }
            }

            // EDITAR
            const btnEdit = e.target.closest('.edit-plan');
            if(btnEdit) {
                const id = btnEdit.dataset.id;
                try {
                    const res = await fetch(`/api/planos/${id}`);
                    const plano = await res.json();
                    
                    // Preenche modal
                    editingPlanId = id; // Marca que estamos editando
                    if(modalPlanoTitle) modalPlanoTitle.innerText = "Editar Plano";
                    if(btnSubmitPlano) btnSubmitPlano.innerText = "Salvar Alterações";
                    
                    document.getElementById('add-plano-nome').value = plano.Nome;
                    document.getElementById('add-plano-preco').value = plano.Preco;
                    document.getElementById('add-plano-destaque').checked = (plano.Destaque == 1);
                    
                    // Limpa e recria características
                    addFeaturesContainer.innerHTML = '';
                    if(plano.features && plano.features.length > 0) {
                        plano.features.forEach(f => {
                            addFeatureRow(f.Descricao, f.Incluido == 1);
                        });
                    } else {
                        addFeatureRow(); // Adiciona uma vazia se não tiver nada
                    }
                    
                    modalPlano.classList.add('active');
                } catch(err) { console.error(err); }
            }
        });
    }

    // 4. RESETAR MODAL (Para Criar Novo)
    function resetModalPlano() {
        editingPlanId = null; // Marca que é novo
        formAddPlano.reset();
        addFeaturesContainer.innerHTML = '';
        addFeatureRow(); // Adiciona uma linha vazia padrão
        if(modalPlanoTitle) modalPlanoTitle.innerText = "Adicionar Novo Plano";
        if(btnSubmitPlano) btnSubmitPlano.innerText = "Criar Plano";
    }

    // 5. ENVIAR FORMULÁRIO (Criar ou Editar)
    if(formAddPlano) {
        formAddPlano.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(formAddPlano);
            const data = new URLSearchParams(formData);
            
            // Corrige checkboxes não marcados (se precisar, o backend já trata como 0, mas garantimos aqui)
            
            let url = '/api/planos';
            let method = 'POST';

            if(editingPlanId) {
                url = `/api/planos/${editingPlanId}`;
                method = 'PUT';
            }
            
            try {
                const res = await fetch(url, {
                    method: method,
                    body: data // urlencoded para arrays
                });
                const result = await res.json();
                
                if(result.sucesso) {
                    showToast('sucess', 'Plano atualizado!', 'O plano foi atualizado!')
                    modalPlano.classList.remove('active');
                    carregarPlanos();
                } else {
                    showToast('error ', 'Erro ao Atualizar Plano!', result.mensagem);
                }
            } catch (err) { console.error(err); }
        });
        
        // Botão Cancelar do Modal
        const btnCancel = document.getElementById('cancel-add-plano');
        if(btnCancel) btnCancel.addEventListener('click', () => modalPlano.classList.remove('active'));
    }
    
    // Chamamos a função DEPOIS de ter clonado/substituído o formulário
    carregarPlanosSelect();
    carregarAlunos();

    // ==========================================
    // MÓDULO DE PERFIL (USUÁRIO)
    // ==========================================
    
    // Elementos da tela de visualização
    const headerUserName = document.getElementById('header-user-name');
    const profileName = document.getElementById('profile-name');
    const profileEmail = document.getElementById('profile-email');
    const viewNome = document.getElementById('view-nome');
    const viewEmail = document.getElementById('view-email');
    const viewTelefone = document.getElementById('view-telefone');
    
    // Botão de editar que abre o modal
    const btnEditProfile = document.getElementById('edit-profile-btn');
    const modalProfile = document.getElementById('edit-profile-modal');
    const formProfile = document.getElementById('edit-profile-form');

    // 1. CARREGAR DADOS DO PERFIL
    async function carregarPerfilUsuario() {
        try {
            const res = await fetch('/api/usuario/me');
            
            if (res.status === 401 || res.status === 403) {
            window.location.href = '/'; // Redireciona para login
            return;
        }
            
            const user = await res.json();
            
            // Preenche Header e Card
            if(headerUserName) headerUserName.textContent = `Olá, ${user.NomeCompleto.split(' ')[0]}!`;
            if(profileName) profileName.textContent = user.NomeCompleto;
            if(profileEmail) profileEmail.textContent = user.Email;
            
            // Preenche Inputs de Visualização
            if(viewNome) viewNome.value = user.NomeCompleto;
            if(viewEmail) viewEmail.value = user.Email;
            if(viewTelefone) viewTelefone.value = user.Telefone || '';

        } catch (err) {
            console.error('Erro ao carregar perfil:', err);
        }
    }
    
    // Carrega ao iniciar
    carregarPerfilUsuario();

    // 2. ABRIR MODAL DE EDIÇÃO (Preencher com dados atuais)
    if(btnEditProfile) {
        btnEditProfile.addEventListener('click', () => {
            // Pega os valores que já estão na tela (para não precisar buscar no banco de novo)
            if(viewNome) document.getElementById('edit-nome').value = viewNome.value;
            if(viewEmail) document.getElementById('edit-email').value = viewEmail.value;
            if(viewTelefone) document.getElementById('edit-telefone').value = viewTelefone.value;
            
            // Limpa campos de senha
            document.getElementById('edit-senha').value = '';
            document.getElementById('edit-confirmar-senha').value = '';
            
            modalProfile.classList.add('active');
        });
    }

    // 3. SALVAR ALTERAÇÕES
    if(formProfile) {
        formProfile.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(formProfile);
            const dados = Object.fromEntries(formData);
            
            // Validação simples de senha no front
            if(dados.senha && dados.senha !== dados.confirmar_senha) {
                showToast('warning', 'As senhas não coincidem!', 'Verifique a senha!'); // Use warning (amarelo) aqui
                return;
            }

            try {
                const res = await fetch('/api/usuario/me', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(dados)
                });
                
                const result = await res.json();
                
                if(result.sucesso) {
                    showToast('success', 'Plano atualizado!', 'O plano foi atualizado!');
                    modalProfile.classList.remove('active');
                    carregarPerfilUsuario(); // Recarrega os dados na tela
                } else {
                    showToast('error', 'Erro ao Atualizar Plano!', result.mensagem);
                }
            } catch (err) {
                console.error(err);
                showToast('error', 'Erro na conexão', 'Erro de conexão!')
            }
        });
        
        // Botão Cancelar
        const btnCancelProfile = document.getElementById('cancel-profile-edit');
        if(btnCancelProfile) {
            btnCancelProfile.addEventListener('click', () => modalProfile.classList.remove('active'));
        }
    }

    // ==========================================
    // MÓDULO DE RELATÓRIOS (DASHBOARD)
    // ==========================================

    async function carregarDashboard() {
        // Verifica se estamos na tela que tem os elementos de dashboard
        const elFaturamento = document.getElementById('dash-faturamento');
        if (!elFaturamento) return;

        try {
            const res = await fetch('/api/relatorios/dashboard');
            const dados = await res.json();

            // 1. Preencher Cards Principais
            elFaturamento.innerText = dados.receitaMensal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            
            document.getElementById('dash-ativos').innerText = dados.alunosAtivos;
            document.getElementById('dash-inativos').innerText = dados.status.inativos || 0;

            // 2. Preencher Lista de Distribuição por Planos
            const listaPlanos = document.getElementById('plan-distribution-list');
            if (listaPlanos) {
                if (dados.alunosPorPlano.length === 0) {
                    listaPlanos.innerHTML = '<p class="empty-message">Nenhum aluno ativo em planos.</p>';
                } else {
                    let html = '<ul style="list-style: none;">';
                    dados.alunosPorPlano.forEach(item => {
                        // Calcula porcentagem simples
                        const porcentagem = ((item.qtd / dados.alunosAtivos) * 100).toFixed(1);
                        
                        html += `
                            <li style="margin-bottom: 15px;">
                                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                                    <strong>${item.Nome}</strong>
                                    <span>${item.qtd} alunos (${porcentagem}%)</span>
                                </div>
                                <div style="background: #eee; height: 10px; border-radius: 5px; overflow: hidden;">
                                    <div style="background: var(--primary-color); width: ${porcentagem}%; height: 100%;"></div>
                                </div>
                            </li>
                        `;
                    });
                    html += '</ul>';
                    listaPlanos.innerHTML = html;
                }
            }

        } catch (err) {
            console.error('Erro ao carregar dashboard:', err);
        }
    }


// ==========================================
    // MÓDULO DE PAGAMENTO (BLINDADO)
    // ==========================================
    const modalPagamento = document.getElementById('pagamento-modal');
    const formPagamento = document.getElementById('pagamento-form');
    
    // Elementos (Verificamos se existem para evitar crash)
    const selectPlanoPagamento = document.getElementById('pagamento-plano-select');
    const inputValorPagamento = document.getElementById('pagamento-valor');
    const inputDataPagamento = document.getElementById('pagamento-data');

    const closePagamentoBtn = document.getElementById('close-pagamento-modal');
    const cancelPagamentoBtn = document.getElementById('cancel-pagamento');
    const fechaPagamento = () => modalPagamento && modalPagamento.classList.remove('active');
    
    if(closePagamentoBtn) closePagamentoBtn.addEventListener('click', fechaPagamento);
    if(cancelPagamentoBtn) cancelPagamentoBtn.addEventListener('click', fechaPagamento);

    // Atualiza valor ao trocar plano
    if (selectPlanoPagamento) {
        selectPlanoPagamento.addEventListener('change', function() {
            const option = this.options[this.selectedIndex];
            if (option && option.dataset.preco) {
                inputValorPagamento.value = parseFloat(option.dataset.preco).toFixed(2);
            }
        });
    }

    // Clique no botão $
    if (alunosTableBody) {
        alunosTableBody.addEventListener('click', async (e) => {
            const btnPay = e.target.closest('.pay');
            
            if (btnPay) {
                const id = btnPay.dataset.id;
                
                try {
                    // 1. Busca dados do aluno
                    const res = await fetch(`/api/alunos/${id}`);
                    if(!res.ok) throw new Error('Falha na API Alunos');
                    const aluno = await res.json();

                    // 2. Preenche dados fixos
                    document.getElementById('pagamento-aluno-id').value = aluno.ID;
                    document.getElementById('pagamento-aluno-nome').value = aluno.NomeCompleto;
                    
                    // 3. Data de Hoje
                    if(inputDataPagamento) {
                        const hoje = new Date();
                        inputDataPagamento.value = hoje.toISOString().split('T')[0];
                    }

                    // 4. Carrega Planos no Select (Se o elemento existir no HTML)
                    if (selectPlanoPagamento) {
                        // Se cache vazio, busca
                        if (listaPlanosCache.length === 0) {
                            const resPlanos = await fetch('/api/planos/select');
                            if(resPlanos.ok) listaPlanosCache = await resPlanos.json();
                        }

                        selectPlanoPagamento.innerHTML = '<option value="">Selecione...</option>';
                        
                        listaPlanosCache.forEach(plano => {
                            const option = document.createElement('option');
                            option.value = plano.ID;
                            option.textContent = plano.Nome;
                            option.dataset.preco = plano.Preco; // Guarda o preço
                            
                            // Seleciona o plano atual
                            if (plano.ID == aluno.PlanoID) {
                                option.selected = true;
                                if(inputValorPagamento) inputValorPagamento.value = parseFloat(plano.Preco).toFixed(2);
                            }
                            selectPlanoPagamento.appendChild(option);
                        });
                    }

                    // Abre modal
                    if(modalPagamento) modalPagamento.classList.add('active');

                } catch (err) {
                    console.error("Erro no pagamento:", err);
                    showToast('error', 'Erro', 'Não foi possível carregar os dados. Verifique o console.');
                }
            }
        });
    }

    // Enviar Pagamento
    if (formPagamento) {
        formPagamento.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const alunoId = document.getElementById('pagamento-aluno-id').value;
            const valor = inputValorPagamento ? inputValorPagamento.value : 0;
            const formaPagamento = formPagamento.querySelector('[name="forma_pagamento"]').value;
            const dataInput = inputDataPagamento ? inputDataPagamento.value : '';
            
            // NOVO: Pegar o ID do plano selecionado
            const planoId = selectPlanoPagamento.value; 

            // Texto da Referência
            let referenciaTexto = 'Pagamento Avulso';
            if (dataInput && selectPlanoPagamento) {
                const [ano, mes, dia] = dataInput.split('-');
                const nomePlano = selectPlanoPagamento.options[selectPlanoPagamento.selectedIndex].text;
                referenciaTexto = `${nomePlano} - Venc. ${dia}/${mes}/${ano}`;
            }

            try {
                const res = await fetch('/api/pagamentos/novo', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        alunoId, 
                        referencia: referenciaTexto, 
                        valor, 
                        forma_pagamento: formaPagamento,
                        planoId: planoId // <--- ENVIANDO O PLANO AGORA
                    })
                });
                const result = await res.json();
                
                if (result.sucesso) {
                    showToast('success', 'Sucesso!', 'Pagamento registrado e plano atualizado.');
                    fechaPagamento();
                    // Opcional: Recarregar a tabela para ver se o plano mudou visualmente na lista
                    carregarAlunos(); 
                } else {
                    showToast('error', 'Erro', result.mensagem);
                }
            } catch (err) {
                console.error(err);
                showToast('error', 'Erro', 'Falha na conexão.');
            }
        });
    }

    // Carregar os números ao abrir a aba de relatórios
    // Ou podemos carregar direto no inicio se você quiser mostrar na Home também.
    // Vamos colocar um listener no botão do menu para atualizar quando clicar
    const btnRelatorios = document.querySelector('.menu-item[data-content="relatorios"]');
    if (btnRelatorios) {
        btnRelatorios.addEventListener('click', carregarDashboard);
    }
    
    // Carrega uma vez se já começar nessa tela (ou para garantir)
    carregarDashboard();

    // Atualizar Relógio
    function updateTime() {
        const now = new Date();
        const timeElement = document.getElementById('current-time');
        if(timeElement) {
            timeElement.textContent = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        }
    }
    setInterval(updateTime, 1000);
    updateTime();
});