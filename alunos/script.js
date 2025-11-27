document.addEventListener('DOMContentLoaded', function() {
    // Elementos do DOM
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.querySelector('.main-content');
    const toggleMenu = document.getElementById('toggle-menu');
    const menuItems = document.querySelectorAll('.menu-item');
    const contentSections = document.querySelectorAll('.content-section');
    
    // Atualizar hora e temperatura
    updateTime();
    getWeather();
    
    // Atualizar hora a cada minuto
    setInterval(updateTime, 60000);
    
    // Toggle do menu lateral
    toggleMenu.addEventListener('click', function() {
        sidebar.classList.toggle('expanded');
        
        // Em dispositivos móveis, adicionar overlay quando o menu estiver aberto
        if (window.innerWidth <= 576) {
            if (sidebar.classList.contains('expanded')) {
                const overlay = document.createElement('div');
                overlay.className = 'sidebar-overlay';
                overlay.addEventListener('click', function() {
                    sidebar.classList.remove('expanded');
                    this.remove();
                });
                document.body.appendChild(overlay);
            } else {
                const overlay = document.querySelector('.sidebar-overlay');
                if (overlay) overlay.remove();
            }
        }
    });
    
    // Navegação entre seções
    menuItems.forEach(item => {
        item.addEventListener('click', function() {
            // Atualizar item ativo no menu
            menuItems.forEach(i => i.classList.remove('active'));
            this.classList.add('active');
            
            // Mostrar seção correspondente
            const contentId = this.getAttribute('data-content') + '-content';
            contentSections.forEach(section => {
                section.classList.remove('active');
                if (section.id === contentId) {
                    section.classList.add('active');
                }
            });
            
            // Em dispositivos móveis, fechar o menu após a seleção
            if (window.innerWidth <= 576) {
                sidebar.classList.remove('expanded');
                const overlay = document.querySelector('.sidebar-overlay');
                if (overlay) overlay.remove();
            }
        });
    });
    
    // Responsividade para dispositivos móveis
    window.addEventListener('resize', function() {
        if (window.innerWidth <= 576) {
            sidebar.classList.remove('expanded');
            const overlay = document.querySelector('.sidebar-overlay');
            if (overlay) overlay.remove();
        }
    });
    
    // Função para atualizar a hora
    function updateTime() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        document.getElementById('current-time').textContent = `${hours}:${minutes}`;
    }
    
    // Função para obter a temperatura (simulada)
    function getWeather() {
        // Em uma aplicação real, você usaria uma API de clima
        // Aqui estamos apenas simulando
        const temperatures = [22, 23, 24, 25, 26, 27, 28];
        const randomTemp = temperatures[Math.floor(Math.random() * temperatures.length)];
        document.getElementById('temperature').textContent = `${randomTemp}°C`;
    }
    
    // Adicionar CSS dinâmico para o overlay do menu em dispositivos móveis
    const style = document.createElement('style');
    style.textContent = `
        .sidebar-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0, 0, 0, 0.5);
            z-index: 90;
        }
    `;
    document.head.appendChild(style);
    
    // Funcionalidades da seção de perfil
    const editAvatarBtn = document.querySelector('.edit-avatar');
    if (editAvatarBtn) {
        editAvatarBtn.addEventListener('click', function() {
            alert('Funcionalidade para alterar foto de perfil será implementada aqui.');
        });
    }
    
    const changePasswordBtn = document.querySelector('.primary-btn');
    if (changePasswordBtn) {
        changePasswordBtn.addEventListener('click', function() {
            alert('Funcionalidade para alterar senha será implementada aqui.');
        });
    }
    
    // Funcionalidades da seção social
    const postBtn = document.querySelector('.post-btn');
    if (postBtn) {
        postBtn.addEventListener('click', function() {
            const postInput = document.querySelector('.post-input');
            if (postInput.value.trim() !== '') {
                alert('Sua publicação foi enviada com sucesso!');
                postInput.value = '';
            } else {
                alert('Por favor, escreva algo antes de publicar.');
            }
        });
    }
    
    const sendCommentBtns = document.querySelectorAll('.send-comment');
    sendCommentBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const commentInput = this.previousElementSibling;
            if (commentInput.value.trim() !== '') {
                alert('Seu comentário foi enviado com sucesso!');
                commentInput.value = '';
            } else {
                alert('Por favor, escreva algo antes de comentar.');
            }
        });
    });
    
    const postActions = document.querySelectorAll('.post-action');
    postActions.forEach(action => {
        action.addEventListener('click', function() {
            const actionType = this.querySelector('i').className;
            if (actionType.includes('thumbs-up')) {
                alert('Você curtiu esta publicação!');
            } else if (actionType.includes('comment')) {
                const commentInput = this.closest('.post-card').querySelector('.comment-input');
                if (commentInput) commentInput.focus();
            } else if (actionType.includes('share')) {
                alert('Opções de compartilhamento serão implementadas aqui.');
            }
        });
    });
    
    // Funcionalidades da seção de pagamento
    const paymentSwitches = document.querySelectorAll('.switch input');
    paymentSwitches.forEach(switchInput => {
        switchInput.addEventListener('change', function() {
            if (this.checked) {
                alert('Pagamento automático ativado para este cartão.');
            } else {
                alert('Pagamento automático desativado para este cartão.');
            }
        });
    });
    
    const editCardBtns = document.querySelectorAll('.edit-card-btn');
    editCardBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            alert('Funcionalidade para editar cartão será implementada aqui.');
        });
    });
    
    const removeCardBtns = document.querySelectorAll('.remove-card-btn');
    removeCardBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            if (confirm('Tem certeza que deseja remover este cartão?')) {
                alert('Cartão removido com sucesso!');
            }
        });
    });
    
    const makeDefaultBtn = document.querySelector('.make-default-btn');
    if (makeDefaultBtn) {
        makeDefaultBtn.addEventListener('click', function() {
            alert('Este cartão foi definido como principal.');
        });
    }
    
    const addPaymentBtn = document.querySelector('.add-payment-method');
    if (addPaymentBtn) {
        addPaymentBtn.addEventListener('click', function() {
            alert('Formulário para adicionar nova forma de pagamento será implementado aqui.');
        });
    }
    
    // Funcionalidades da seção de planos
    const changePlanBtns = document.querySelectorAll('.change-plan-btn');
    changePlanBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const planName = this.closest('.plan-card').querySelector('h3').textContent;
            if (confirm(`Tem certeza que deseja mudar para o ${planName}?`)) {
                alert(`Seu plano foi alterado para ${planName} com sucesso!`);
            }
        });
    });
    
    // Funcionalidade de notificações
    const notificationIcon = document.querySelector('.notification-icon');
    if (notificationIcon) {
        notificationIcon.addEventListener('click', function() {
            alert('Suas notificações serão exibidas aqui.');
        });
    }
});