document.addEventListener("DOMContentLoaded", () => {
  // Elementos do DOM
  const sidebar = document.getElementById("sidebar")
  const mainContent = document.querySelector(".main-content")
  const toggleMenu = document.getElementById("toggle-menu")
  const menuItems = document.querySelectorAll(".menu-item")
  const contentSections = document.querySelectorAll(".content-section")

  // Modais
  const editProfileModal = document.getElementById("edit-profile-modal")
  const alunoModal = document.getElementById("aluno-modal")
  const planoModal = document.getElementById("plano-modal")
  const viewAlunoModal = document.getElementById("view-aluno-modal")

  // Botões
  const editProfileBtn = document.getElementById("edit-profile-btn")
  const closeProfileModal = document.getElementById("close-profile-modal")
  const cancelProfileEdit = document.getElementById("cancel-profile-edit")
  const addAlunoBtn = document.getElementById("add-aluno-btn")
  const closeAlunoModal = document.getElementById("close-aluno-modal")
  const cancelAluno = document.getElementById("cancel-aluno")
  const addPlanBtn = document.getElementById("add-plan-btn")
  const closePlanoModal = document.getElementById("close-plano-modal")
  const cancelPlano = document.getElementById("cancel-plano")
  const closeViewAluno = document.getElementById("close-view-aluno")
  const addFeatureBtn = document.getElementById("add-feature-btn")
  const searchAlunoBtn = document.getElementById("search-aluno-btn")
  const generateReportBtn = document.getElementById("generate-report-btn")
  const newCustomReport = document.getElementById("new-custom-report")

  // Formulários
  const editProfileForm = document.getElementById("edit-profile-form")
  const alunoForm = document.getElementById("aluno-form")
  const planoForm = document.getElementById("plano-form")

  // Atualizar hora e temperatura
  updateTime()
  getWeather()

  // Atualizar hora a cada minuto
  setInterval(updateTime, 60000)

  // Toggle do menu lateral
  if (toggleMenu) {
    toggleMenu.addEventListener("click", () => {
      sidebar.classList.toggle("collapsed")
      sidebar.classList.toggle("expanded")
      mainContent.classList.toggle("expanded")
    })
  }

  // Navegação entre seções
  menuItems.forEach((item) => {
    item.addEventListener("click", function () {
      // Atualizar item ativo no menu
      menuItems.forEach((i) => i.classList.remove("active"))
      this.classList.add("active")

      // Mostrar seção correspondente
      const contentId = this.getAttribute("data-content") + "-content"
      contentSections.forEach((section) => {
        section.classList.remove("active")
        if (section.id === contentId) {
          section.classList.add("active")
        }
      })

      // Carregar dados específicos da seção
      if (contentId === "alunos-content") {
        loadAlunos()
      } else if (contentId === "planos-content") {
        loadPlanos()
      } else if (contentId === "relatorios-content") {
        loadRelatorios()
        loadTurmas()
      }

      // Em dispositivos móveis, fechar o menu após a seleção
      if (window.innerWidth <= 768) {
        sidebar.classList.add("collapsed")
        sidebar.classList.remove("expanded")
        mainContent.classList.add("expanded")
      }
    })
  })

  // Responsividade para dispositivos móveis
  window.addEventListener("resize", () => {
    if (window.innerWidth <= 768) {
      sidebar.classList.add("collapsed")
      sidebar.classList.remove("expanded")
      mainContent.classList.add("expanded")
    } else {
      sidebar.classList.remove("collapsed")
      sidebar.classList.remove("expanded")
      mainContent.classList.remove("expanded")
    }
  })

  // Inicializar em modo móvel se necessário
  if (window.innerWidth <= 768) {
    sidebar.classList.add("collapsed")
    mainContent.classList.add("expanded")
  }

  // Função para atualizar a hora
  function updateTime() {
    const now = new Date()
    const hours = String(now.getHours()).padStart(2, "0")
    const minutes = String(now.getMinutes()).padStart(2, "0")
    const timeElement = document.getElementById("current-time")
    if (timeElement) {
      timeElement.textContent = `${hours}:${minutes}`
    }
  }

  // Função para obter a temperatura (simulada)
  function getWeather() {
    // Em uma aplicação real, você usaria uma API de clima
    const temperatures = [22, 23, 24, 25, 26, 27, 28]
    const randomTemp = temperatures[Math.floor(Math.random() * temperatures.length)]
    const tempElement = document.getElementById("temperature")
    if (tempElement) {
      tempElement.textContent = `${randomTemp}°C`
    }
  }

  // Funções para manipulação de modais
  function openModal(modal) {
    if (modal) {
      modal.classList.add("active")
    }
  }

  function closeModal(modal) {
    if (modal) {
      modal.classList.remove("active")
    }
  }

  // Eventos para o modal de edição de perfil
  if (editProfileBtn) {
    editProfileBtn.addEventListener("click", () => {
      // Preencher o formulário com os dados atuais
      const nome = document.querySelector(".profile-info h3")?.textContent || ""
      const email = document.querySelector(".profile-info p")?.textContent || ""
      const telefone = document.querySelector('input[type="tel"]')?.value || ""

      const nomeInput = document.getElementById("edit-nome")
      const emailInput = document.getElementById("edit-email")
      const telefoneInput = document.getElementById("edit-telefone")
      const senhaInput = document.getElementById("edit-senha")
      const confirmarSenhaInput = document.getElementById("edit-confirmar-senha")

      if (nomeInput) nomeInput.value = nome
      if (emailInput) emailInput.value = email
      if (telefoneInput) telefoneInput.value = telefone
      if (senhaInput) senhaInput.value = ""
      if (confirmarSenhaInput) confirmarSenhaInput.value = ""

      openModal(editProfileModal)
    })
  }

  if (closeProfileModal) {
    closeProfileModal.addEventListener("click", () => {
      closeModal(editProfileModal)
    })
  }

  if (cancelProfileEdit) {
    cancelProfileEdit.addEventListener("click", () => {
      closeModal(editProfileModal)
    })
  }

  // Eventos para o modal de aluno
  if (addAlunoBtn) {
    addAlunoBtn.addEventListener("click", () => {
      const modalTitle = document.getElementById("aluno-modal-title")
      const alunoForm = document.getElementById("aluno-form")
      const alunoId = document.getElementById("aluno-id")

      if (modalTitle) modalTitle.textContent = "Adicionar Novo Aluno"
      if (alunoForm) alunoForm.reset()
      if (alunoId) alunoId.value = ""

      // Carregar planos para o select
      loadPlanosForSelect()

      openModal(alunoModal)
    })
  }

  if (closeAlunoModal) {
    closeAlunoModal.addEventListener("click", () => {
      closeModal(alunoModal)
    })
  }

  if (cancelAluno) {
    cancelAluno.addEventListener("click", () => {
      closeModal(alunoModal)
    })
  }

  // Eventos para o modal de plano
  if (addPlanBtn) {
    addPlanBtn.addEventListener("click", () => {
      const modalTitle = document.getElementById("plano-modal-title")
      const planoForm = document.getElementById("plano-form")
      const planoId = document.getElementById("plano-id")

      if (modalTitle) modalTitle.textContent = "Adicionar Novo Plano"
      if (planoForm) planoForm.reset()
      if (planoId) planoId.value = ""

      // Limpar características exceto a primeira
      const featuresContainer = document.getElementById("features-container")
      if (featuresContainer) {
        const featureItems = featuresContainer.querySelectorAll(".feature-item")

        for (let i = 1; i < featureItems.length; i++) {
          featuresContainer.removeChild(featureItems[i])
        }

        // Resetar a primeira característica
        const firstFeature = featuresContainer.querySelector(".feature-item")
        if (firstFeature) {
          const input = firstFeature.querySelector('input[type="text"]')
          const checkbox = firstFeature.querySelector('input[type="checkbox"]')

          if (input) input.value = ""
          if (checkbox) checkbox.checked = true
        }
      }

      openModal(planoModal)
    })
  }

  if (closePlanoModal) {
    closePlanoModal.addEventListener("click", () => {
      closeModal(planoModal)
    })
  }

  if (cancelPlano) {
    cancelPlano.addEventListener("click", () => {
      closeModal(planoModal)
    })
  }

  if (closeViewAluno) {
    closeViewAluno.addEventListener("click", () => {
      closeModal(viewAlunoModal)
    })
  }

  // Adicionar nova característica ao plano
  if (addFeatureBtn) {
    addFeatureBtn.addEventListener("click", () => {
      const featuresContainer = document.getElementById("features-container")
      if (!featuresContainer) return

      const featureItem = document.createElement("div")
      featureItem.className = "feature-item"

      featureItem.innerHTML = `
                <div class="form-group">
                    <input type="text" name="features[]" placeholder="Ex: Acesso a 5 turmas">
                </div>
                <div class="form-group checkbox-group">
                    <input type="checkbox" name="feature_included[]" checked>
                    <label>Incluído</label>
                </div>
                <button type="button" class="remove-feature-btn"><i class="fas fa-times"></i></button>
            `

      featuresContainer.appendChild(featureItem)

      // Adicionar evento para remover característica
      const removeBtn = featureItem.querySelector(".remove-feature-btn")
      if (removeBtn) {
        removeBtn.addEventListener("click", () => {
          featuresContainer.removeChild(featureItem)
        })
      }
    })
  }

  // Adicionar eventos para remover características existentes
  document.querySelectorAll(".remove-feature-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      const featureItem = this.closest(".feature-item")
      const featuresContainer = document.getElementById("features-container")

      if (featuresContainer && featureItem) {
        if (featuresContainer.querySelectorAll(".feature-item").length > 1) {
          featuresContainer.removeChild(featureItem)
        } else {
          // Se for o último, apenas limpar os campos
          const input = featureItem.querySelector('input[type="text"]')
          if (input) input.value = ""
        }
      }
    })
  })

  // Buscar alunos
  if (searchAlunoBtn) {
    searchAlunoBtn.addEventListener("click", () => {
      const searchTerm = document.getElementById("aluno-search")?.value.trim() || ""
      loadAlunos(searchTerm)
    })
  }

  // Tecla Enter no campo de busca
  const alunoSearchInput = document.getElementById("aluno-search")
  if (alunoSearchInput) {
    alunoSearchInput.addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        e.preventDefault()
        const searchTerm = this.value.trim()
        loadAlunos(searchTerm)
      }
    })
  }

  // Gerar relatório
  if (generateReportBtn) {
    generateReportBtn.addEventListener("click", () => {
      const tipoRelatorio = document.getElementById("tipo-relatorio")?.value
      const dataInicial = document.getElementById("data-inicial")?.value
      const dataFinal = document.getElementById("data-final")?.value
      const turmaId = document.getElementById("turma-relatorio")?.value

      if (!tipoRelatorio) {
        showToast("Atenção", "Selecione um tipo de relatório.", "warning")
        return
      }

      if (!dataInicial || !dataFinal) {
        showToast("Atenção", "Selecione o período para o relatório.", "warning")
        return
      }

      // Enviar requisição para gerar relatório
      fetch("/api/relatorios", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tipo: tipoRelatorio,
          data_inicial: dataInicial,
          data_final: dataFinal,
          turma_id: turmaId !== "todas" ? turmaId : null,
        }),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            showToast("Sucesso", data.message, "success")
            loadRelatorios()
          } else {
            showToast("Erro", data.error, "error")
          }
        })
        .catch((error) => {
          console.error("Erro:", error)
          showToast("Erro", "Ocorreu um erro ao gerar o relatório.", "error")
        })
    })
  }

  // Criar relatório personalizado
  if (newCustomReport) {
    newCustomReport.addEventListener("click", () => {
      // Limpar os campos do formulário
      const tipoRelatorio = document.getElementById("tipo-relatorio")
      const dataInicial = document.getElementById("data-inicial")
      const dataFinal = document.getElementById("data-final")
      const turmaRelatorio = document.getElementById("turma-relatorio")

      if (tipoRelatorio) tipoRelatorio.value = ""
      if (dataInicial) dataInicial.value = ""
      if (dataFinal) dataFinal.value = ""
      if (turmaRelatorio) turmaRelatorio.value = "todas"

      // Rolar para o formulário
      const filtersSection = document.querySelector(".reports-filters")
      if (filtersSection) {
        filtersSection.scrollIntoView({ behavior: "smooth" })

        // Destacar o formulário
        filtersSection.style.boxShadow = "0 0 10px rgba(0, 0, 0, 0.3)"

        setTimeout(() => {
          filtersSection.style.boxShadow = ""
        }, 2000)
      }
    })
  }

  // Submissão dos formulários
  if (editProfileForm) {
    editProfileForm.addEventListener("submit", (e) => {
      e.preventDefault()

      const nome = document.getElementById("edit-nome")?.value || ""
      const email = document.getElementById("edit-email")?.value || ""
      const telefone = document.getElementById("edit-telefone")?.value || ""
      const senha = document.getElementById("edit-senha")?.value || ""
      const confirmarSenha = document.getElementById("edit-confirmar-senha")?.value || ""

      if (senha && senha !== confirmarSenha) {
        showToast("Erro", "As senhas não coincidem.", "error")
        return
      }

      // Enviar requisição para atualizar perfil
      fetch("/api/user/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome: nome,
          email: email,
          telefone: telefone,
          senha: senha,
        }),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            // Atualizar os dados na página
            const profileName = document.querySelector(".profile-info h3")
            const profileEmail = document.querySelector(".profile-info p")
            const profileTelefone = document.querySelector('input[type="tel"]')
            const userInfoName = document.querySelector(".user-info span")

            if (profileName) profileName.textContent = nome
            if (profileEmail) profileEmail.textContent = email
            if (profileTelefone) profileTelefone.value = telefone
            if (userInfoName) userInfoName.textContent = `Olá, ${nome}!`

            showToast("Sucesso", data.message, "success")
            closeModal(editProfileModal)
          } else {
            showToast("Erro", data.error, "error")
          }
        })
        .catch((error) => {
          console.error("Erro:", error)
          showToast("Erro", "Ocorreu um erro ao atualizar o perfil.", "error")
        })
    })
  }

  if (alunoForm) {
    alunoForm.addEventListener("submit", (e) => {
      e.preventDefault()

      const id = document.getElementById("aluno-id")?.value || ""
      const nome = document.getElementById("aluno-nome")?.value || ""
      const email = document.getElementById("aluno-email")?.value || ""
      const telefone = document.getElementById("aluno-telefone")?.value || ""
      const nascimento = document.getElementById("aluno-nascimento")?.value || ""
      const planoId = document.getElementById("aluno-plano")?.value || ""
      const rua = document.getElementById("aluno-rua")?.value || ""
      const bairro = document.getElementById("aluno-bairro")?.value || ""
      const observacoes = document.getElementById("aluno-observacoes")?.value || ""
      const status = document.getElementById("aluno-status")?.checked || false

      // Enviar requisição para salvar aluno
      fetch("/api/alunos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: id || null,
          nome: nome,
          email: email,
          telefone: telefone,
          nascimento: nascimento,
          plano_id: planoId || null,
          rua: rua,
          bairro: bairro,
          observacoes: observacoes,
          status: status,
        }),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            showToast("Sucesso", data.message, "success")
            closeModal(alunoModal)
            loadAlunos()
          } else {
            showToast("Erro", data.error, "error")
          }
        })
        .catch((error) => {
          console.error("Erro:", error)
          showToast("Erro", "Ocorreu um erro ao salvar o aluno.", "error")
        })
    })
  }

  // Event listener para o formulário de plano
  if (planoForm) {
    planoForm.addEventListener("submit", (e) => {
      e.preventDefault()

      const id = document.getElementById("plano-id")?.value || ""
      const nome = document.getElementById("plano-nome")?.value || ""
      const preco = document.getElementById("plano-preco")?.value || ""
      const destaque = document.getElementById("plano-destaque")?.checked || false

      // Validar campos obrigatórios
      if (!nome.trim()) {
        showToast("Erro", "O nome do plano é obrigatório", "error")
        return
      }

      if (!preco.trim()) {
        showToast("Erro", "O preço do plano é obrigatório", "error")
        return
      }

      // Coletar características (agora opcional)
      const caracteristicas = []
      const featureItems = document.querySelectorAll(".feature-item")

      featureItems.forEach((item) => {
        const descricao = item.querySelector('input[type="text"]')?.value || ""
        const incluido = item.querySelector('input[type="checkbox"]')?.checked || false

        // Adicionar mesmo que esteja vazio
        if (descricao.trim()) {
          caracteristicas.push({
            descricao: descricao,
            incluido: incluido,
          })
        }
      })

      console.log("Características coletadas:", caracteristicas)

      // Verificar se o botão de excluir foi clicado
      const isDeleteAction = e.submitter && e.submitter.classList.contains("delete-btn")

      if (isDeleteAction && id) {
        // Confirmar exclusão
        if (confirm("Tem certeza que deseja excluir este plano? Esta ação não pode ser desfeita.")) {
          deletePlano(id)
        }
        return
      }

      // Determinar se é uma atualização ou inserção
      const isUpdate = id && id.trim() !== ""
      const method = isUpdate ? "PUT" : "POST"
      const url = isUpdate ? `/api/planos/${id}` : "/api/planos"

      console.log("Operação:", isUpdate ? "Atualizar" : "Inserir", "ID:", id)

      // Enviar requisição para salvar plano
      const dadosPlano = {
        id: isUpdate ? id : null,
        nome: nome,
        preco: preco,
        destaque: destaque,
        caracteristicas: caracteristicas,
      }

      console.log("Enviando dados do plano:", dadosPlano)

      fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dadosPlano),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            showToast("Sucesso", isUpdate ? "Plano atualizado com sucesso!" : "Plano criado com sucesso!", "success")
            closeModal(planoModal)
            loadPlanos()
          } else {
            showToast("Erro", data.error, "error")
          }
        })
        .catch((error) => {
          console.error("Erro:", error)
          showToast("Erro", "Ocorreu um erro ao salvar o plano.", "error")
        })
    })
  }

  // Função para mostrar toast de notificação
  window.showToast = (title, message, type = "info") => {
    const toastContainer = document.getElementById("toast-container")
    if (!toastContainer) return

    const toast = document.createElement("div")
    toast.className = `toast toast-${type}`

    let icon = "info-circle"
    if (type === "success") icon = "check-circle"
    if (type === "error") icon = "times-circle"
    if (type === "warning") icon = "exclamation-triangle"

    toast.innerHTML = `
            <div class="toast-icon">
                <i class="fas fa-${icon}"></i>
            </div>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close"><i class="fas fa-times"></i></button>
        `

    toastContainer.appendChild(toast)

    // Adicionar evento para fechar o toast
    const closeBtn = toast.querySelector(".toast-close")
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        toast.classList.add("hiding")
        setTimeout(() => {
          if (toastContainer.contains(toast)) {
            toastContainer.removeChild(toast)
          }
        }, 300)
      })
    }

    // Fechar automaticamente após 5 segundos
    setTimeout(() => {
      if (toastContainer.contains(toast)) {
        toast.classList.add("hiding")
        setTimeout(() => {
          if (toastContainer.contains(toast)) {
            toastContainer.removeChild(toast)
          }
        }, 300)
      }
    }, 5000)
  }

  // Funções para carregar dados do banco de dados
  function loadUserStats() {
    fetch("/api/user/stats")
      .then((response) => response.json())
      .then((data) => {
        const statsContainer = document.getElementById("user-stats")
        if (statsContainer) {
          statsContainer.innerHTML = `
                        <div class="stat-item">
                            <span class="stat-value">${data.alunos}</span>
                            <span class="stat-label">Alunos</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-value">${data.turmas}</span>
                            <span class="stat-label">Turmas</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-value">${data.horas_mes}</span>
                            <span class="stat-label">Horas/Mês</span>
                        </div>
                    `
        }
      })
      .catch((error) => {
        console.error("Erro ao carregar estatísticas:", error)
      })
  }

  function loadAlunos(search = "", page = 1) {
    const tableBody = document.getElementById("alunos-table-body")
    const paginationContainer = document.getElementById("alunos-pagination")

    if (!tableBody) return

    // Mostrar indicador de carregamento
    tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center">Carregando...</td>
            </tr>
        `

    // Fazer requisição para a API
    fetch(`/api/alunos?search=${search}&page=${page}&per_page=10`)
      .then((response) => response.json())
      .then((data) => {
        if (data.alunos && data.alunos.length > 0) {
          let html = ""

          data.alunos.forEach((aluno) => {
            html += `
                            <tr>
                                <td>#${aluno.id}</td>
                                <td>${aluno.nome}</td>
                                <td>${aluno.email}</td>
                                <td>${aluno.plano}</td>
                                <td><span class="status ${aluno.status_value ? "active" : "inactive"}">${aluno.status}</span></td>
                                <td>
                                    <button class="action-btn edit" onclick="editAluno(${aluno.id})"><i class="fas fa-edit"></i></button>
                                    <button class="action-btn view" onclick="viewAluno(${aluno.id})"><i class="fas fa-eye"></i></button>
                                    <button class="action-btn delete" onclick="deleteAluno(${aluno.id})"><i class="fas fa-trash"></i></button>
                                </td>
                            </tr>
                        `
          })

          tableBody.innerHTML = html

          // Atualizar paginação
          if (paginationContainer) {
            const paginationHtml = `
                            <button class="pagination-btn" ${page <= 1 ? "disabled" : ""} onclick="loadAlunos('${search}', ${page - 1})">
                                <i class="fas fa-chevron-left"></i>
                            </button>
                            <span class="pagination-info">Página ${page} de ${data.total_pages}</span>
                            <button class="pagination-btn" ${page >= data.total_pages ? "disabled" : ""} onclick="loadAlunos('${search}', ${page + 1})">
                                <i class="fas fa-chevron-right"></i>
                            </button>
                        `

            paginationContainer.innerHTML = paginationHtml
          }
        } else {
          tableBody.innerHTML = `
                        <tr class="empty-row">
                            <td colspan="6" class="empty-message">Nenhum aluno encontrado. Utilize o botão "Novo Aluno" para adicionar.</td>
                        </tr>
                    `

          if (paginationContainer) {
            paginationContainer.innerHTML = ""
          }
        }
      })
      .catch((error) => {
        console.error("Erro ao carregar alunos:", error)
        tableBody.innerHTML = `
                    <tr>
                        <td colspan="6" class="text-center text-danger">Erro ao carregar alunos. Tente novamente.</td>
                    </tr>
                `
      })
  }

  function loadPlanosForSelect() {
    const planoSelect = document.getElementById("aluno-plano")

    if (!planoSelect) return

    // Limpar opções existentes
    planoSelect.innerHTML = '<option value="">Selecione um plano</option>'

    // Fazer requisição para a API
    fetch("/api/planos")
      .then((response) => response.json())
      .then((planos) => {
        planos.forEach((plano) => {
          const option = document.createElement("option")
          option.value = plano.id
          option.textContent = `${plano.nome} - R$ ${plano.preco.toFixed(2)}`
          planoSelect.appendChild(option)
        })
      })
      .catch((error) => {
        console.error("Erro ao carregar planos:", error)
      })
  }

  function loadPlanos() {
    const plansContainer = document.getElementById("plans-container")

    if (!plansContainer) return

    // Mostrar indicador de carregamento
    plansContainer.innerHTML = '<div class="loading">Carregando planos...</div>'

    // Fazer requisição para a API
    fetch("/api/planos")
      .then((response) => response.json())
      .then((planos) => {
        // Limpar container
        plansContainer.innerHTML = ""

        if (planos.length > 0) {
          planos.forEach((plano) => {
            const planCard = document.createElement("div")
            planCard.className = `plan-card ${plano.destaque ? "featured" : ""}`

            let caracteristicasHtml = ""
            if (plano.caracteristicas && plano.caracteristicas.length > 0) {
              plano.caracteristicas.forEach((c) => {
                caracteristicasHtml += `
                                    <li><i class="fas fa-${c.incluido ? "check" : "times"}"></i> ${c.descricao}</li>
                                `
              })
            }

            planCard.innerHTML = `
                            ${plano.destaque ? '<div class="plan-badge">Popular</div>' : ""}
                            <div class="plan-header">
                                <h3>${plano.nome}</h3>
                                <span class="plan-price">R$ ${plano.preco.toFixed(2)}<span class="period">/mês</span></span>
                            </div>
                            <div class="plan-features">
                                <ul>
                                    ${caracteristicasHtml}
                                </ul>
                            </div>
                            <div class="plan-actions">
                                <button class="edit-plan" onclick="editPlano(${plano.id})">Editar</button>
                                <button class="view-students" onclick="viewPlanStudents(${plano.id})">Ver Alunos (${plano.alunos_count || 0})</button>
                            </div>
                        `

            plansContainer.appendChild(planCard)
          })
        }

        // Adicionar o botão de adicionar plano
        const addPlanCard = document.createElement("div")
        addPlanCard.className = "plan-card add-plan"
        addPlanCard.id = "add-plan-btn"
        addPlanCard.innerHTML = `
                    <div class="add-plan-content">
                        <i class="fas fa-plus-circle"></i>
                        <h3>Adicionar Novo Plano</h3>
                    </div>
                `

        plansContainer.appendChild(addPlanCard)

        // Adicionar evento de clique
        const addPlanBtn = document.getElementById("add-plan-btn")
        if (addPlanBtn) {
          addPlanBtn.addEventListener("click", () => {
            const modalTitle = document.getElementById("plano-modal-title")
            const planoForm = document.getElementById("plano-form")
            const planoId = document.getElementById("plano-id")

            if (modalTitle) modalTitle.textContent = "Adicionar Novo Plano"
            if (planoForm) planoForm.reset()
            if (planoId) planoId.value = ""

            // Limpar características exceto a primeira
            const featuresContainer = document.getElementById("features-container")
            if (featuresContainer) {
              const featureItems = featuresContainer.querySelectorAll(".feature-item")

              for (let i = 1; i < featureItems.length; i++) {
                featuresContainer.removeChild(featureItems[i])
              }

              // Resetar a primeira característica
              const firstFeature = featuresContainer.querySelector(".feature-item")
              if (firstFeature) {
                const input = firstFeature.querySelector('input[type="text"]')
                const checkbox = firstFeature.querySelector('input[type="checkbox"]')

                if (input) input.value = ""
                if (checkbox) checkbox.checked = true
              }
            }

            openModal(planoModal)
          })
        }
      })
      .catch((error) => {
        console.error("Erro ao carregar planos:", error)
        plansContainer.innerHTML = '<div class="error-message">Erro ao carregar planos. Tente novamente.</div>'
      })
  }

  function loadRelatorios() {
    const reportsContainer = document.getElementById("reports-list-container")

    if (!reportsContainer) return

    // Mostrar indicador de carregamento
    reportsContainer.innerHTML = '<div class="loading">Carregando relatórios...</div>'

    // Fazer requisição para a API
    fetch("/api/relatorios")
      .then((response) => response.json())
      .then((relatorios) => {
        if (relatorios.length > 0) {
          let html = ""

          relatorios.forEach((relatorio) => {
            // Definir ícone com base no tipo
            let icon = "file-alt"
            if (relatorio.tipo === "desempenho") icon = "chart-line"
            if (relatorio.tipo === "financeiro") icon = "money-bill-wave"
            if (relatorio.tipo === "atividades") icon = "tasks"

            html += `
                            <div class="report-card">
                                <div class="report-icon">
                                    <i class="fas fa-${icon}"></i>
                                </div>
                                <div class="report-info">
                                    <h4>${relatorio.titulo}</h4>
                                    <p>Gerado em: ${relatorio.data_geracao}</p>
                                    <div class="report-tags">
                                        <span class="report-tag">${relatorio.turma_nome}</span>
                                        <span class="report-tag">${relatorio.tipo_nome}</span>
                                    </div>
                                </div>
                                <div class="report-actions">
                                    <button class="view-report" onclick="viewReport(${relatorio.id})"><i class="fas fa-eye"></i></button>
                                    <button class="download-report" onclick="downloadReport(${relatorio.id})"><i class="fas fa-download"></i></button>
                                </div>
                            </div>
                        `
          })

          reportsContainer.innerHTML = html
        } else {
          reportsContainer.innerHTML = `
                        <div class="empty-state" id="empty-reports">
                            <i class="fas fa-file-alt"></i>
                            <h3>Nenhum relatório encontrado</h3>
                            <p>Use os filtros ao lado para gerar um novo relatório</p>
                        </div>
                    `
        }
      })
      .catch((error) => {
        console.error("Erro ao carregar relatórios:", error)
        reportsContainer.innerHTML = '<div class="error-message">Erro ao carregar relatórios. Tente novamente.</div>'
      })
  }

  function loadTurmas() {
    const turmaSelect = document.getElementById("turma-relatorio")

    if (!turmaSelect) return

    // Limpar opções existentes
    turmaSelect.innerHTML = '<option value="todas">Todas as Turmas</option>'

    // Fazer requisição para a API
    fetch("/api/turmas")
      .then((response) => response.json())
      .then((turmas) => {
        turmas.forEach((turma) => {
          const option = document.createElement("option")
          option.value = turma.id
          option.textContent = turma.nome
          turmaSelect.appendChild(option)
        })
      })
      .catch((error) => {
        console.error("Erro ao carregar turmas:", error)
      })
  }

  // Funções globais para manipulação de alunos e planos
  window.editAluno = (alunoId) => {
    fetch(`/api/alunos/${alunoId}`)
      .then((response) => response.json())
      .then((aluno) => {
        const modalTitle = document.getElementById("aluno-modal-title")
        const alunoIdInput = document.getElementById("aluno-id")
        const alunoNome = document.getElementById("aluno-nome")
        const alunoEmail = document.getElementById("aluno-email")
        const alunoTelefone = document.getElementById("aluno-telefone")
        const alunoNascimento = document.getElementById("aluno-nascimento")
        const alunoRua = document.getElementById("aluno-rua")
        const alunoBairro = document.getElementById("aluno-bairro")
        const alunoObservacoes = document.getElementById("aluno-observacoes")
        const alunoStatus = document.getElementById("aluno-status")

        if (modalTitle) modalTitle.textContent = "Editar Aluno"
        if (alunoIdInput) alunoIdInput.value = aluno.id
        if (alunoNome) alunoNome.value = aluno.nome
        if (alunoEmail) alunoEmail.value = aluno.email
        if (alunoTelefone) alunoTelefone.value = aluno.telefone || ""
        if (alunoNascimento) alunoNascimento.value = aluno.nascimento || ""
        if (alunoRua) alunoRua.value = aluno.rua || ""
        if (alunoBairro) alunoBairro.value = aluno.bairro || ""
        if (alunoObservacoes) alunoObservacoes.value = aluno.observacoes || ""
        if (alunoStatus) alunoStatus.checked = aluno.status

        // Carregar planos e selecionar o atual
        loadPlanosForSelect()
        setTimeout(() => {
          const alunoPlano = document.getElementById("aluno-plano")
          if (alunoPlano && aluno.plano_id) {
            alunoPlano.value = aluno.plano_id
          }
        }, 500)

        openModal(alunoModal)
      })
      .catch((error) => {
        console.error("Erro ao carregar aluno:", error)
        showToast("Erro", "Ocorreu um erro ao carregar os dados do aluno.", "error")
      })
  }

  window.viewAluno = (alunoId) => {
    const detailsContainer = document.getElementById("student-details-container")

    if (!detailsContainer) return

    // Mostrar indicador de carregamento
    detailsContainer.innerHTML = '<div class="loading">Carregando dados do aluno...</div>'

    fetch(`/api/alunos/${alunoId}`)
      .then((response) => response.json())
      .then((aluno) => {
        let turmasHtml = ""
        if (aluno.turmas && aluno.turmas.length > 0) {
          aluno.turmas.forEach((turma) => {
            turmasHtml += `<span class="detail-value">${turma.nome}</span><br>`
          })
        } else {
          turmasHtml = '<span class="detail-value">Nenhuma turma</span>'
        }

        detailsContainer.innerHTML = `
                    <div class="student-header">
                        <div class="student-avatar">
                            <i class="fas fa-user-circle"></i>
                        </div>
                        <div class="student-info">
                            <h3>${aluno.nome}</h3>
                            <p>${aluno.email}</p>
                        </div>
                        <div class="student-status">
                            <span class="status ${aluno.status ? "active" : "inactive"}">${aluno.status ? "Ativo" : "Inativo"}</span>
                        </div>
                    </div>
                    
                    <div class="details-section">
                        <h4>Informações Pessoais</h4>
                        <div class="details-grid">
                            <div class="detail-item">
                                <span class="detail-label">Telefone</span>
                                <span class="detail-value">${aluno.telefone || "Não informado"}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Data de Nascimento</span>
                                <span class="detail-value">${aluno.nascimento ? new Date(aluno.nascimento).toLocaleDateString("pt-BR") : "Não informada"}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Endereço</span>
                                <span class="detail-value">${aluno.rua ? `${aluno.rua}, ${aluno.bairro}` : "Não informado"}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Data de Cadastro</span>
                                <span class="detail-value">${aluno.criacao || "Não informada"}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="details-section">
                        <h4>Informações Acadêmicas</h4>
                        <div class="details-grid">
                            <div class="detail-item">
                                <span class="detail-label">Plano</span>
                                <span class="detail-value">${aluno.plano || "Sem plano"}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Turmas</span>
                                ${turmasHtml}
                            </div>
                        </div>
                    </div>
                    
                    ${
                      aluno.observacoes
                        ? `
                    <div class="details-section">
                        <h4>Observações</h4>
                        <div class="student-notes">
                            ${aluno.observacoes}
                        </div>
                    </div>
                    `
                        : ""
                    }
                    
                    <div class="student-actions">
                        <button class="secondary-btn" onclick="editAluno(${aluno.id})"><i class="fas fa-edit"></i> Editar</button>
                        <button class="danger-btn" onclick="deleteAluno(${aluno.id})"><i class="fas fa-trash"></i> Excluir</button>
                    </div>
                `

        openModal(viewAlunoModal)
      })
      .catch((error) => {
        console.error("Erro ao carregar aluno:", error)
        detailsContainer.innerHTML =
          '<div class="error-message">Erro ao carregar dados do aluno. Tente novamente.</div>'
      })
  }

  window.deleteAluno = (alunoId) => {
    if (confirm("Tem certeza que deseja excluir este aluno? Esta ação não pode ser desfeita.")) {
      fetch(`/api/alunos/${alunoId}`, {
        method: "DELETE",
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            showToast("Sucesso", data.message, "success")
            loadAlunos()

            // Fechar modal de visualização se estiver aberto
            if (viewAlunoModal && viewAlunoModal.classList.contains("active")) {
              closeModal(viewAlunoModal)
            }
          } else {
            showToast("Erro", data.error, "error")
          }
        })
        .catch((error) => {
          console.error("Erro:", error)
          showToast("Erro", "Ocorreu um erro ao excluir o aluno.", "error")
        })
    }
  }

  window.editPlano = (planoId) => {
    console.log("Editando plano ID:", planoId)

    fetch(`/api/planos/${planoId}`)
      .then((response) => response.json())
      .then((data) => {
        const plano = data.plano || data // Compatibilidade com diferentes formatos de resposta
        console.log("Dados do plano recebidos:", plano)

        const modalTitle = document.getElementById("plano-modal-title")
        const planoIdInput = document.getElementById("plano-id")
        const planoNome = document.getElementById("plano-nome")
        const planoPreco = document.getElementById("plano-preco")
        const planoDestaque = document.getElementById("plano-destaque")

        if (modalTitle) modalTitle.textContent = "Editar Plano"
        if (planoIdInput) {
          planoIdInput.value = plano.id || plano.ID || planoId
          console.log("ID definido no input:", planoIdInput.value)
        }
        if (planoNome) planoNome.value = plano.nome || plano.Nome || ""
        if (planoPreco) planoPreco.value = plano.preco || plano.Preco || ""
        if (planoDestaque) planoDestaque.checked = plano.destaque || plano.Destaque == 1

        // Limpar características existentes
        const featuresContainer = document.getElementById("features-container")
        if (featuresContainer) {
          featuresContainer.innerHTML = ""

          // Adicionar características do plano
          const caracteristicas = plano.caracteristicas || []
          if (caracteristicas.length > 0) {
            caracteristicas.forEach((c, index) => {
              const featureItem = document.createElement("div")
              featureItem.className = "feature-item"

              featureItem.innerHTML = `
                <div class="form-group">
                    <input type="text" name="features[]" value="${c.descricao}" placeholder="Ex: Acesso a 5 turmas">
                </div>
                <div class="form-group checkbox-group">
                    <input type="checkbox" name="feature_included[]" ${c.incluido ? "checked" : ""}>
                    <label>Incluído</label>
                </div>
                <button type="button" class="remove-feature-btn"><i class="fas fa-times"></i></button>
              `

              featuresContainer.appendChild(featureItem)

              // Adicionar evento para remover característica
              const removeBtn = featureItem.querySelector(".remove-feature-btn")
              if (removeBtn) {
                removeBtn.addEventListener("click", () => {
                  if (featuresContainer.querySelectorAll(".feature-item").length > 1) {
                    featuresContainer.removeChild(featureItem)
                  } else {
                    // Se for o último, apenas limpar os campos
                    const input = featureItem.querySelector('input[type="text"]')
                    if (input) input.value = ""
                  }
                })
              }
            })
          } else {
            // Se não houver características, adicionar uma vazia
            const featureItem = document.createElement("div")
            featureItem.className = "feature-item"

            featureItem.innerHTML = `
              <div class="form-group">
                  <input type="text" name="features[]" placeholder="Ex: Acesso a 5 turmas">
              </div>
              <div class="form-group checkbox-group">
                  <input type="checkbox" name="feature_included[]" checked>
                  <label>Incluído</label>
              </div>
              <button type="button" class="remove-feature-btn"><i class="fas fa-times"></i></button>
            `

            featuresContainer.appendChild(featureItem)

            // Adicionar evento para remover característica
            const removeBtn = featureItem.querySelector(".remove-feature-btn")
            if (removeBtn) {
              removeBtn.addEventListener("click", () => {
                const input = featureItem.querySelector('input[type="text"]')
                if (input) input.value = ""
              })
            }
          }
        }

        // Garantir que os botões corretos estejam visíveis
        const submitBtn = document.querySelector("#plano-form .submit-btn")
        const deleteBtn = document.querySelector("#plano-form .delete-btn")

        if (submitBtn) {
          submitBtn.textContent = "Atualizar Plano"
        }

        if (deleteBtn) {
          deleteBtn.style.display = "inline-block"
        }

        console.log("Modal de edição preparado para o plano ID:", planoId)

        openModal(planoModal)
      })
      .catch((error) => {
        console.error("Erro ao carregar plano:", error)
        showToast("Erro", "Ocorreu um erro ao carregar os dados do plano.", "error")
      })
  }

  function deletePlano(planoId) {
    fetch(`/api/planos/${planoId}`, {
      method: "DELETE",
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          showToast("Sucesso", "Plano excluído com sucesso!", "success")
          closeModal(planoModal)
          loadPlanos()
        } else {
          showToast("Erro", data.error || "Erro ao excluir plano.", "error")
        }
      })
      .catch((error) => {
        console.error("Erro:", error)
        showToast("Erro", "Ocorreu um erro ao excluir o plano.", "error")
      })
  }

  window.viewPlanStudents = (planoId) => {
    // Redirecionar para a seção de alunos e filtrar por plano
    const menuAlunos = document.querySelector('.menu-item[data-content="alunos"]')
    if (menuAlunos) {
      menuAlunos.click()

      // Implementar filtro por plano (a ser desenvolvido)
      showToast("Info", "Funcionalidade de filtro por plano será implementada em breve.", "info")
    }
  }

  window.viewReport = (reportId) => {
    showToast("Info", "Funcionalidade de visualização de relatório será implementada em breve.", "info")
  }

  window.downloadReport = (reportId) => {
    showToast("Info", "Funcionalidade de download de relatório será implementada em breve.", "info")
  }

  // Inicializar carregamento de dados
  loadUserStats()
  loadAlunos()
})

// Função para verificar a sessão
function checkSession() {
  fetch("/api/test/session")
    .then((response) => response.json())
    .then((data) => {
      console.log("Dados da sessão:", data)
      if (!data.user_id) {
        console.warn("⚠️ Usuário não está logado!")
        alert("Você não está logado! Redirecionando para a página de login...")
        window.location.href = "/login"
      } else {
        console.log("✅ Usuário logado:", data.user_nome)
      }
    })
    .catch((error) => {
      console.error("❌ Erro ao verificar sessão:", error)
    })
}

// Função para testar salvar plano
function testSavePlano() {
  const planoData = {
    nome: "Plano Teste " + new Date().toLocaleTimeString(),
    preco: 99.9,
    destaque: true,
    caracteristicas: [
      { descricao: "Característica 1", incluido: true },
      { descricao: "Característica 2", incluido: false },
    ],
  }

  fetch("/api/planos", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(planoData),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        alert("Plano salvo com sucesso!")
        // Recarregar planos
        loadPlanos()
      } else {
        alert("Erro ao salvar plano: " + (data.error || "Erro desconhecido"))
      }
    })
    .catch((error) => {
      console.error("Erro na requisição:", error)
      alert("Erro na requisição: " + error)
    })
}

// Função para testar salvar plano (versão simples)
function testSavePlanoSimple() {
  const planoData = {
    nome: "Plano Simples " + new Date().toLocaleTimeString(),
    preco: 49.9,
    destaque: false,
  }

  fetch("/api/planos/simple", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(planoData),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        alert("Plano simples salvo com sucesso!")
        // Recarregar planos
        loadPlanos()
      } else {
        alert("Erro ao salvar plano simples: " + (data.error || "Erro desconhecido"))
      }
    })
    .catch((error) => {
      console.error("Erro na requisição:", error)
      alert("Erro na requisição: " + error)
    })
}

// Função para testar rotas
function testRoutes() {
  fetch("/api/test/routes")
    .then((response) => response.json())
    .then((data) => {
      console.log("Rotas disponíveis:", data)
      alert("Rotas funcionando: " + data.message)
    })
    .catch((error) => {
      console.error("Erro ao testar rotas:", error)
      alert("Erro ao testar rotas: " + error)
    })
}

// Adicionar botões de teste na página
function addTestButtons() {
  const container = document.querySelector(".container") || document.body

  const testDiv = document.createElement("div")
  testDiv.className = "test-buttons"
  testDiv.style.position = "fixed"
  testDiv.style.bottom = "20px"
  testDiv.style.right = "20px"
  testDiv.style.zIndex = "1000"
  testDiv.style.background = "#f0f0f0"
  testDiv.style.padding = "10px"
  testDiv.style.borderRadius = "5px"
  testDiv.style.boxShadow = "0 0 10px rgba(0,0,0,0.2)"

  const sessionBtn = document.createElement("button")
  sessionBtn.textContent = "Verificar Sessão"
  sessionBtn.onclick = checkSession
  sessionBtn.style.marginRight = "10px"

  const saveBtn = document.createElement("button")
  saveBtn.textContent = "Testar Salvar Plano"
  saveBtn.onclick = testSavePlano
  saveBtn.style.marginRight = "10px"

  const saveSimpleBtn = document.createElement("button")
  saveSimpleBtn.textContent = "Testar Salvar Plano (Simples)"
  saveSimpleBtn.onclick = testSavePlanoSimple
  saveSimpleBtn.style.marginRight = "10px"

  const testRoutesBtn = document.createElement("button")
  testRoutesBtn.textContent = "Testar Rotas"
  testRoutesBtn.onclick = testRoutes

  testDiv.appendChild(sessionBtn)
  testDiv.appendChild(saveBtn)
  testDiv.appendChild(saveSimpleBtn)
  testDiv.appendChild(testRoutesBtn)

  container.appendChild(testDiv)
}

// Executar quando o DOM estiver carregado
document.addEventListener("DOMContentLoaded", () => {
  console.log("🔍 Página carregada, adicionando botões de teste...")
  addTestButtons()

  // Verificar sessão automaticamente
  checkSession()
})

// Função global para carregar planos
function loadPlanos() {
  const plansContainer = document.getElementById("plans-container")

  if (!plansContainer) return

  // Mostrar indicador de carregamento
  plansContainer.innerHTML = '<div class="loading">Carregando planos...</div>'

  // Fazer requisição para a API
  fetch("/api/planos")
    .then((response) => response.json())
    .then((planos) => {
      // Limpar container
      plansContainer.innerHTML = ""

      if (planos.length > 0) {
        planos.forEach((plano) => {
          const planCard = document.createElement("div")
          planCard.className = `plan-card ${plano.destaque ? "featured" : ""}`

          let caracteristicasHtml = ""
          if (plano.caracteristicas && plano.caracteristicas.length > 0) {
            plano.caracteristicas.forEach((c) => {
              caracteristicasHtml += `
                                <li><i class="fas fa-${c.incluido ? "check" : "times"}"></i> ${c.descricao}</li>
                            `
            })
          }

          planCard.innerHTML = `
                        ${plano.destaque ? '<div class="plan-badge">Popular</div>' : ""}
                        <div class="plan-header">
                            <h3>${plano.nome}</h3>
                        <span class="plan-price">R$ ${Number.parseFloat(plano.preco).toFixed(2)}<span class="period">/mês</span></span>
                        </div>
                        <div class="plan-features">
                            <ul>
                                ${caracteristicasHtml}
                            </ul>
                        </div>
                        <div class="plan-actions">
                            <button class="edit-plan" onclick="editPlano(${plano.id})">Editar</button>
                            <button class="view-students" onclick="viewPlanStudents(${plano.id})">Ver Alunos (${plano.alunos_count || 0})</button>
                        </div>
                    `

          plansContainer.appendChild(planCard)
        })
      }

      // Adicionar o botão de adicionar plano
      const addPlanCard = document.createElement("div")
      addPlanCard.className = "plan-card add-plan"
      addPlanCard.id = "add-plan-btn"
      addPlanCard.innerHTML = `
                <div class="add-plan-content">
                    <i class="fas fa-plus-circle"></i>
                    <h3>Adicionar Novo Plano</h3>
                </div>
            `

      plansContainer.appendChild(addPlanCard)

      // Adicionar evento de clique
      const addPlanBtn = document.getElementById("add-plan-btn")
      if (addPlanBtn) {
        addPlanBtn.addEventListener("click", () => {
          const modalTitle = document.getElementById("plano-modal-title")
          const planoForm = document.getElementById("plano-form")
          const planoId = document.getElementById("plano-id")

          if (modalTitle) modalTitle.textContent = "Adicionar Novo Plano"
          if (planoForm) planoForm.reset()
          if (planoId) planoId.value = ""

          // Limpar características exceto a primeira
          const featuresContainer = document.getElementById("features-container")
          if (featuresContainer) {
            const featureItems = featuresContainer.querySelectorAll(".feature-item")

            for (let i = 1; i < featureItems.length; i++) {
              featuresContainer.removeChild(featureItems[i])
            }

            // Resetar a primeira característica
            const firstFeature = featuresContainer.querySelector(".feature-item")
            if (firstFeature) {
              const input = firstFeature.querySelector('input[type="text"]')
              const checkbox = firstFeature.querySelector('input[type="checkbox"]')

              if (input) input.value = ""
              if (checkbox) checkbox.checked = true
            }
          }

          openModal(planoModal)
        })
      }
    })
    .catch((error) => {
      console.error("Erro ao carregar planos:", error)
      plansContainer.innerHTML = '<div class="error-message">Erro ao carregar planos. Tente novamente.</div>'
    })
}

// Função para depurar o formulário de plano
function debugPlanoForm() {
  const planoForm = document.getElementById("plano-form")
  const planoId = document.getElementById("plano-id")

  if (planoForm && planoId) {
    console.log("Estado atual do ID do plano:", planoId.value)
    console.log("Formulário está em modo de edição:", planoId.value && planoId.value.trim() !== "")

    // Adicionar evento para monitorar mudanças no ID
    planoId.addEventListener("change", () => {
      console.log("ID do plano alterado para:", planoId.value)
    })

    // Monitorar submissão do formulário
    planoForm.addEventListener(
      "submit",
      (e) => {
        console.log("Formulário submetido com ID:", planoId.value)
        console.log("Modo:", planoId.value && planoId.value.trim() !== "" ? "Atualização" : "Inserção")
      },
      true,
    ) // Use capturing para executar antes do handler principal
  }
}

// Adicionar ao carregamento da página
document.addEventListener("DOMContentLoaded", () => {
  debugPlanoForm()
})
