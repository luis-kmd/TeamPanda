const sign_in_btn = document.querySelector("#sign-in-btn");
const sign_up_btn = document.querySelector("#sign-up-btn");
const container = document.querySelector(".container");
const loginForm = document.querySelector(".sign-in-form");
const errorDiv = document.getElementById("mensagem-erro");

// Animação de troca de tela (Cadastro/Login)
sign_up_btn.addEventListener("click", () => {
  container.classList.add("sign-up-mode");
});

sign_in_btn.addEventListener("click", () => {
  container.classList.remove("sign-up-mode");
});

// Lógica de Login via AJAX (sem recarregar página)
loginForm.addEventListener("submit", async (e) => {
    e.preventDefault(); // Impede o envio tradicional do formulário

    // Pega os dados dos inputs
    const formData = new FormData(loginForm);
    const dados = Object.fromEntries(formData); // Converte para objeto {email: "...", senha: "..."}

    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dados)
        });

        const resultado = await response.json();

        if (resultado.sucesso) {
            // Sucesso! Redireciona para o dashboard correto
            window.location.href = resultado.destino;
        } else {
            // Erro (Senha errada ou email não existe)
            mostrarErro(resultado.mensagem);
        }
    } catch (err) {
        mostrarErro("Erro de conexão com o servidor.");
    }
});

function mostrarErro(msg) {
    errorDiv.style.display = "block";
    errorDiv.textContent = msg;
    errorDiv.style.backgroundColor = "#f8d7da";
    errorDiv.style.color = "#721c24";
    
    // Some após 5 segundos
    setTimeout(() => {
        errorDiv.style.display = "none";
    }, 5000);
}

// Adicione no final
const btnForgot = document.getElementById('btn-forgot');

if(btnForgot) {
    btnForgot.addEventListener('click', async () => {
        // Usando prompt simples para não criar modal agora
        const email = prompt("Digite seu e-mail para recuperação:");
        
        if(email) {
            try {
                const res = await fetch('/api/esqueci-senha', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ email })
                });
                const result = await res.json();
                alert(result.mensagem);
                
                if(result.sucesso) {
                    // Simulação da tela de reset
                    const token = prompt("Verifique seu e-mail (ou console do servidor) e cole o TOKEN aqui:");
                    const novaSenha = prompt("Digite a nova senha:");
                    
                    if(token && novaSenha) {
                        const resReset = await fetch('/api/resetar-senha', {
                            method: 'POST',
                            headers: {'Content-Type': 'application/json'},
                            body: JSON.stringify({ email, token, nova_senha: novaSenha })
                        });
                        const resultReset = await resReset.json();
                        alert(resultReset.mensagem);
                    }
                }
            } catch(err) {
                alert('Erro na requisição');
            }
        }
    });
}

// MÁSCARA DE CPF NO LOGIN
const inputLoginCPF = document.getElementById('login-cpf');
if (inputLoginCPF) {
    inputLoginCPF.maxLength = 14;
    inputLoginCPF.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, "");
        if (value.length > 11) value = value.slice(0, 11);
        value = value.replace(/(\d{3})(\d)/, "$1.$2");
        value = value.replace(/(\d{3})(\d)/, "$1.$2");
        value = value.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
        e.target.value = value;
    });
}