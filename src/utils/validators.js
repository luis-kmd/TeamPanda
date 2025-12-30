exports.validarCPF = (cpf) => {
    // 1. Remove tudo que não é número (pontos e traços)
    cpf = cpf.replace(/[^\d]+/g, '');

    // 2. Verifica se tem 11 dígitos ou se são todos iguais (ex: 111.111.111-11)
    if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;

    // 3. Validação do primeiro dígito verificador
    let soma = 0;
    let resto;
    for (let i = 1; i <= 9; i++) 
        soma = soma + parseInt(cpf.substring(i - 1, i)) * (11 - i);
    
    resto = (soma * 10) % 11;
    if ((resto === 10) || (resto === 11)) resto = 0;
    if (resto !== parseInt(cpf.substring(9, 10))) return false;

    // 4. Validação do segundo dígito verificador
    soma = 0;
    for (let i = 1; i <= 10; i++) 
        soma = soma + parseInt(cpf.substring(i - 1, i)) * (12 - i);
    
    resto = (soma * 10) % 11;
    if ((resto === 10) || (resto === 11)) resto = 0;
    if (resto !== parseInt(cpf.substring(10, 11))) return false;

    return true; // CPF Válido!
};