// Funções globais para manipulação de modais
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

// Função global para mostrar toast de notificação
function showToast(title, message, type = "info") {
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

// --- REPLACE: addFeatureToForm ---
function addFeatureToForm(descricao = "", incluido = true, caracId = null, planoId = null) {
  const featuresContainer = document.getElementById("features-container");
  if (!featuresContainer) return;

  const featureItem = document.createElement("div");
  featureItem.className = "feature-item";

  // guarda o id da característica da tabela (importantíssimo!)
  if (caracId != null) {
    featureItem.dataset.featureId = String(caracId);
  }
  // guarda o id do plano (pode vir tanto por closure quanto pelo dataset)
  if (planoId != null) {
    featureItem.dataset.planoId = String(planoId);
  }

  featureItem.innerHTML = `
    <div class="form-group">
      <input type="text" name="features[]" placeholder="Ex: Acesso a 5 turmas" value="${descricao}">
    </div>
    <div class="form-group checkbox-group">
      <input type="checkbox" name="feature_included[]" ${incluido ? "checked" : ""}>
      <label>Incluído</label>
    </div>
    <button type="button" class="remove-feature-btn"><i class="fas fa-times"></i></button>
  `;

  featuresContainer.appendChild(featureItem);

  // DEBUG: confirma que o item foi criado com IDs corretos
  console.log("addFeatureToForm: adicionada feature", { caracId, planoId, dataset: featureItem.dataset });

  // evento de exclusão
  featureItem.querySelector(".remove-feature-btn").addEventListener("click", async (ev) => {
    const btn = ev.currentTarget;
    const realCaracId = featureItem.dataset.featureId;
    // prioriza dataset; se não existir, usa o planoId passado por closure (permitido)
    const realPlanoId = featureItem.dataset.planoId || (planoId != null ? String(planoId) : undefined);

    console.log("Clique excluir feature:", { realPlanoId, realCaracId });

    // considera IDs válidos quando não são undefined / empty / "undefined"
    const hasCaracId = realCaracId !== undefined && realCaracId !== "" && realCaracId !== "undefined";
    const hasPlanoId = realPlanoId !== undefined && realPlanoId !== "" && realPlanoId !== "undefined";

    if (hasCaracId && hasPlanoId) {
      // confirma ação e faz chamada ao servidor
      if (!confirm("Deseja realmente excluir esta característica do plano?")) return;

      try {
        btn.disabled = true;
        btn.classList.add("loading");

        const res = await fetch(`/api/planos/${encodeURIComponent(realPlanoId)}/caracteristicas/${encodeURIComponent(realCaracId)}`, {
          method: "DELETE",
          credentials: "same-origin",
          headers: { "Accept": "application/json" },
        });

        // tenta parsear JSON de forma segura
        let data = null;
        const ct = res.headers.get("content-type") || "";
        if (ct.includes("application/json")) {
          data = await res.json();
        } else {
          const text = await res.text();
          // alguns backends retornam 204 No Content; trata como sucesso
          if (res.status === 204) {
            data = { success: true, message: "Característica excluída." };
          } else {
            throw new Error("Resposta inesperada do servidor: " + text);
          }
        }

        if (!res.ok) {
          throw new Error(data?.error || data?.message || "Erro ao excluir característica");
        }

        showToast("Sucesso", data.message || "Característica excluída com sucesso!", "success");
        featureItem.remove();
      } catch (err) {
        console.error("Erro ao excluir característica:", err);
        showToast("Erro", err.message || "Erro ao excluir característica. Tente novamente.", "error");
        btn.disabled = false;
        btn.classList.remove("loading");
      }
    } else {
      // item ainda não salvo no BD — apenas remove do DOM
      featureItem.remove();
      showToast("Info", "Característica removida do formulário.", "info");
    }
  });
}
// --- END REPLACE ---


function addFeatureToAddForm(descricao = "", incluido = true) {
  const featuresContainer = document.getElementById("add-features-container")
  if (!featuresContainer) return

  const featureItem = document.createElement("div")
  featureItem.className = "feature-item"

  featureItem.innerHTML = `
    <div class="form-group">
      <input type="text" name="add_features[]" placeholder="Ex: Acesso a 5 turmas" value="${descricao}">
    </div>
    <div class="form-group checkbox-group">
      <input type="checkbox" name="add_feature_included[]" ${incluido ? "checked" : ""}>
      <label>Incluído</label>
    </div>
    <button type="button" class="remove-feature-btn"><i class="fas fa-times"></i></button>
  `

  featuresContainer.appendChild(featureItem)

  // Use event delegation on the container so clicks on inner elements (like the <i>) still trigger removal
  if (!featuresContainer._removeListenerAttached) {
    featuresContainer.addEventListener("click", (e) => {
      const btn = e.target.closest && e.target.closest(".remove-feature-btn")
      if (btn) {
        const item = btn.closest(".feature-item")
        if (item && item.parentNode === featuresContainer) {
          featuresContainer.removeChild(item)
        }
      }
    })
    // mark to avoid attaching multiple identical listeners
    featuresContainer._removeListenerAttached = true
  }
}

function updatePagination(container, currentPage, totalPages, loadFunction) {
  container.innerHTML = `
    <button class="pagination-btn ${currentPage === 1 ? "disabled" : ""}" id="pagination-prev">
      <i class="fas fa-chevron-left"></i>
    </button>
    <span class="pagination-info">Página ${currentPage} de ${totalPages}</span>
    <button class="pagination-btn ${currentPage === totalPages ? "disabled" : ""}" id="pagination-next">
      <i class="fas fa-chevron-right"></i>
    </button>
  `;

  const prevBtn = container.querySelector("#pagination-prev");
  const nextBtn = container.querySelector("#pagination-next");

  if (prevBtn && currentPage > 1) {
    prevBtn.addEventListener("click", () => loadFunction("", currentPage - 1));
  }
  if (nextBtn && currentPage < totalPages) {
    nextBtn.addEventListener("click", () => loadFunction("", currentPage + 1));
  }
}

// Funções globais para carregar dados
// Em pages/professores/script.js

function loadAlunos(search = "", page = 1) {
    const tableBody = document.getElementById("alunos-table-body");
    const paginationContainer = document.getElementById("alunos-pagination");

    if (!tableBody) return;

    tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center;">Carregando...</td></tr>`;

    fetch(`/api/alunos?search=${encodeURIComponent(search)}&page=${page}&per_page=10`)
      .then((response) => response.json())
      .then((data) => {
        // <<< ADIÇÃO PARA DEBUG >>>
        console.log("Dados recebidos da API para /api/alunos:", data);

        if (data.error) {
            throw new Error(data.error);
        }

        if (data.alunos && data.alunos.length > 0) {
          let html = "";
          data.alunos.forEach((aluno) => {
            html += `
                <tr>
                    <td>#${aluno.id}</td>
                    <td>${aluno.nome}</td>
                    <td>${aluno.email}</td>
                    <td>${aluno.plano || 'N/A'}</td>
                    <td><span class="status ${aluno.status_value ? "active" : "inactive"}">${aluno.status}</span></td>
                    <td>
                        <button class="action-btn edit" onclick="editAluno(${aluno.id})"><i class="fas fa-edit"></i></button>
                        <button class="action-btn view" onclick="viewAluno(${aluno.id})"><i class="fas fa-eye"></i></button>
                        <button class="action-btn delete" onclick="deleteAluno(${aluno.id})"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `;
          });
          tableBody.innerHTML = html;

          // Lógica de paginação
          if (paginationContainer) {
              updatePagination(paginationContainer, data.page, data.total_pages, loadAlunos);
          }

        } else {
          tableBody.innerHTML = `
                <tr class="empty-row">
                    <td colspan="6" class="empty-message">Nenhum aluno encontrado. Utilize o botão "Novo Aluno" para adicionar.</td>
                </tr>
            `;
            if (paginationContainer) paginationContainer.innerHTML = "";
        }
      })
      .catch((error) => {
        console.error("Erro ao carregar alunos:", error);
        tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: red;">Erro ao carregar alunos. Tente novamente.</td></tr>`;
      });
}

/*function loadUserStats() {
  const statsContainer = document.getElementById("user-stats")
  if (statsContainer) {
    const mockStats = {
      alunos: 25,
      turmas: 8,
      horas_mes: 120,
    }

    statsContainer.innerHTML = `
      <div class="stat-item">
        <span class="stat-value">${mockStats.alunos}</span>
        <span class="stat-label">Alunos</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">${mockStats.turmas}</span>
        <span class="stat-label">Turmas</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">${mockStats.horas_mes}</span>
        <span class="stat-label">Horas/Mês</span>
      </div>
    `
  }
}
*/

async function loadPlanos() {
  const plansContainer = document.getElementById("plans-container")
  if (!plansContainer) return

  const addPlanButtonHTML = `
    <div class="plan-card add-plan" id="add-plan-btn">
      <div class="add-plan-content">
        <i class="fas fa-plus-circle"></i>
        <h3>Adicionar Novo Plano</h3>
      </div>
    </div>
  `

  try {
    const response = await fetch("/api/planos")
    if (!response.ok) throw new Error(`Erro na requisição: ${response.statusText}`)

    const result = await response.json()
    const planos = result.data || []

    let planosHTML = ""
    planos.forEach((plano) => {
      let caracteristicasHtml = ""
      if (plano.caracteristicas && plano.caracteristicas.length > 0) {
        plano.caracteristicas.forEach((carac) => {
          caracteristicasHtml += `
            <li>
              <i class="fas ${carac.incluido ? "fa-check" : "fa-times"}"></i>
              ${carac.descricao}
            </li>`
        })
      } else {
        caracteristicasHtml = '<li><i class="fas fa-info-circle"></i> Nenhum detalhe adicional.</li>'
      }

      planosHTML += `
        <div class="plan-card ${plano.destaque ? "featured" : ""}">
          ${plano.destaque ? '<div class="plan-badge">Popular</div>' : ""}
          <div class="plan-header">
            <h3>${plano.nome}</h3>
            <span class="plan-price">
              R$ ${Number.parseFloat(plano.preco).toFixed(2).replace(".", ",")}
              <span class="period">/mês</span>
            </span>
          </div>
          <div class="plan-features">
            <ul>
              ${caracteristicasHtml}
            </ul>
          </div>
          <div class="plan-actions">
            <button class="edit-plan" onclick="editPlano(${plano.id})">Editar</button>
            <button class="view-students" onclick="viewPlanStudents(${plano.id})">Ver Alunos</button>
          </div>
        </div>
      `
    })

    plansContainer.innerHTML = planosHTML + addPlanButtonHTML

    document.getElementById("add-plan-btn").addEventListener("click", () => {
      const modal = document.getElementById("add-plano-modal")
      const modalTitle = document.getElementById("add-plano-modal-title")
      const planoForm = document.getElementById("add-plano-form")

      if (modalTitle) modalTitle.textContent = "Adicionar Novo Plano"
      if (planoForm) planoForm.reset()

      const featuresContainer = document.getElementById("add-features-container")
      if (featuresContainer) {
        featuresContainer.innerHTML = ""
        addFeatureToAddForm()
      }

      openModal(modal)
    })
  } catch (error) {
    console.error("Erro ao carregar planos:", error)
    showToast("Erro", "Não foi possível carregar os planos.", "error")
    plansContainer.innerHTML = addPlanButtonHTML
  }
}


function deletePlano(planoId) {
  if (confirm("Tem certeza que deseja excluir este plano? Esta ação não pode ser desfeita.")) {
    fetch(`/api/planos/${planoId}`, {
      method: "DELETE",
    })
      .then((response) => {
        if (!response.ok) {
          return response.json().then((err) => {
            throw new Error(err.error || "Erro de servidor")
          })
        }
        return response.json()
      })
      .then((data) => {
        showToast("Sucesso", data.message || "Plano excluído com sucesso!", "success")
        loadPlanos()
      })
      .catch((error) => {
        console.error("Erro ao excluir plano:", error)
        showToast("Erro", error.message || "Não foi possível excluir o plano.", "error")
      })
  }
}

function loadRelatorios() {
  const reportsContainer = document.getElementById("reports-container")
  if (!reportsContainer) return

  const mockRelatorios = [
    {
      ID: 1,
      Titulo: "Relatório de Desempenho - Janeiro",
      Tipo: "desempenho",
      DataInicial: "2024-01-01",
      DataFinal: "2024-01-31",
      TurmaID: 1,
      Turma: { Nome: "Turma A" },
      ProfessorID: 1,
      DataGeracao: "2024-01-15",
    },
    {
      ID: 2,
      Titulo: "Relatório Financeiro - Janeiro",
      Tipo: "financeiro",
      DataInicial: "2024-01-01",
      DataFinal: "2024-01-31",
      TurmaID: null,
      Turma: null,
      ProfessorID: 1,
      DataGeracao: "2024-01-31",
    },
    {
      ID: 3,
      Titulo: "Relatório de Atividades - Janeiro",
      Tipo: "atividades",
      DataInicial: "2024-01-01",
      DataFinal: "2024-01-31",
      TurmaID: 2,
      Turma: { Nome: "Turma B" },
      ProfessorID: 1,
      DataGeracao: "2024-01-20",
    },
  ]

  let html = ""
  mockRelatorios.forEach((relatorio) => {
    let icon = "file-alt"
    let tipoNome = "Geral"

    if (relatorio.Tipo === "desempenho") {
      icon = "chart-line"
      tipoNome = "Desempenho"
    }
    if (relatorio.Tipo === "financeiro") {
      icon = "money-bill-wave"
      tipoNome = "Financeiro"
    }
    if (relatorio.Tipo === "atividades") {
      icon = "tasks"
      tipoNome = "Atividades"
    }
    if (relatorio.Tipo === "frequencia") {
      icon = "calendar-check"
      tipoNome = "Frequência"
    }

    const dataGeracao = new Date(relatorio.DataGeracao).toLocaleDateString("pt-BR")
    const turmaNome = relatorio.Turma ? relatorio.Turma.Nome : "Todas"

    html += `
      <div class="report-card">
        <div class="report-icon">
          <i class="fas fa-${icon}"></i>
        </div>
        <div class="report-info">
          <h4>${relatorio.Titulo}</h4>
          <p>Gerado em: ${dataGeracao}</p>
          <div class="report-tags">
            <span class="report-tag">${turmaNome}</span>
            <span class="report-tag">${tipoNome}</span>
          </div>
        </div>
        <div class="report-actions">
          <button class="view-report" onclick="viewReport(${relatorio.ID})"><i class="fas fa-eye"></i></button>
          <button class="download-report" onclick="downloadReport(${relatorio.ID})"><i class="fas fa-download"></i></button>
        </div>
      </div>
    `
  })

  reportsContainer.innerHTML = html
}

async function loadPlanosForSelect() {
    const planoSelect = document.getElementById("aluno-plano");

    if (!planoSelect) return Promise.resolve(); // Retorna uma promessa resolvida se o elemento não existir

    planoSelect.innerHTML = '<option value="">Carregando planos...</option>';

    try {
        const response = await fetch("/api/planos");
        if (!response.ok) throw new Error("Erro ao buscar planos");
        const result = await response.json();

        // Supondo que a resposta da API tem a estrutura { data: [...] }
        const planos = Array.isArray(result.data) ? result.data : result;

        planoSelect.innerHTML = '<option value="">Selecione um plano</option>';

        if (Array.isArray(planos)) {
            planos.forEach((plano) => {
                const option = document.createElement("option");
                option.value = plano.id || plano.ID; // Suporta id ou ID
                option.textContent = `${plano.nome || plano.Nome} - R$ ${parseFloat(plano.preco || plano.Preco).toFixed(2)}`;
                planoSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error("Erro ao carregar planos para o select:", error);
        planoSelect.innerHTML = '<option value="">Erro ao carregar planos</option>';
        return Promise.reject(error); // Rejeita a promessa em caso de erro
    }
}

function loadTurmas() {
  const turmaSelect = document.getElementById("turma-relatorio")
  if (!turmaSelect) return

  turmaSelect.innerHTML = '<option value="todas">Todas as Turmas</option>'

  const mockTurmas = [
    { ID: 1, Nome: "Turma A", Descricao: "Turma matutina", CargaHoraria: 40, ProfessorID: 1 },
    { ID: 2, Nome: "Turma B", Descricao: "Turma vespertina", CargaHoraria: 30, ProfessorID: 1 },
    { ID: 3, Nome: "Turma C", Descricao: "Turma noturna", CargaHoraria: 35, ProfessorID: 1 },
  ]

  mockTurmas.forEach((turma) => {
    const option = document.createElement("option")
    option.value = turma.ID
    option.textContent = turma.Nome
    turmaSelect.appendChild(option)
  })
}

// Funções globais para manipulação de alunos e planos
window.viewAluno = (alunoId) => {
  const detailsContainer = document.getElementById("student-details-container")
  const viewAlunoModal = document.getElementById("view-aluno-modal")

  if (!detailsContainer) return

  const mockAluno = {
    ID: alunoId,
    NomeCompleto: "João Silva",
    Email: "joao@email.com",
    CPF: "123.456.789-00",
    Telefone: "(11) 99999-9999",
    DataNascimento: "1990-05-15",
    PlanoID: 1,
    Plano: { Nome: "Premium", Preco: 99.9 },
    Rua: "Rua das Flores, 123",
    Bairro: "Centro",
    Observacoes: "Aluno dedicado e pontual",
    Status: true,
    ProfessorID: 1,
    DataCriacao: "2024-01-15",
  }

  const dataNascimento = new Date(mockAluno.DataNascimento).toLocaleDateString("pt-BR")
  const dataCriacao = new Date(mockAluno.DataCriacao).toLocaleDateString("pt-BR")

  detailsContainer.innerHTML = `
    <div class="student-header">
      <div class="student-avatar">
        <i class="fas fa-user-circle"></i>
      </div>
      <div class="student-info">
        <h3>${mockAluno.NomeCompleto}</h3>
        <p>${mockAluno.Email}</p>
      </div>
      <div class="student-status">
        <span class="status ${mockAluno.Status ? "active" : "inactive"}">${mockAluno.Status ? "Ativo" : "Inativo"}</span>
      </div>
    </div>
    
    <div class="details-section">
      <h4>Informações Pessoais</h4>
      <div class="details-grid">
        <div class="detail-item">
          <span class="detail-label">CPF</span>
          <span class="detail-value">${mockAluno.CPF}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Telefone</span>
          <span class="detail-value">${mockAluno.Telefone}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Data de Nascimento</span>
          <span class="detail-value">${dataNascimento}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Plano</span>
          <span class="detail-value">${mockAluno.Plano.Nome} - R$ ${mockAluno.Plano.Preco.toFixed(2)}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Endereço</span>
          <span class="detail-value">${mockAluno.Rua}, ${mockAluno.Bairro}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Data de Cadastro</span>
          <span class="detail-value">${dataCriacao}</span>
        </div>
      </div>
      ${
        mockAluno.Observacoes
          ? `
        <div class="detail-item full-width">
          <span class="detail-label">Observações</span>
          <span class="detail-value">${mockAluno.Observacoes}</span>
        </div>
      `
          : ""
      }
    </div>
    
    <div class="student-actions">
      <button class="secondary-btn" onclick="editAluno(${alunoId})"><i class="fas fa-edit"></i> Editar</button>
      <button class="danger-btn" onclick="deleteAluno(${alunoId})"><i class="fas fa-trash"></i> Excluir</button>
    </div>
  `

  openModal(viewAlunoModal)
}


/**
 * Abre o modal para EDITAR um aluno, buscando e preenchendo os dados do banco.
 * @param {number} alunoId - O ID do aluno a ser editado.
 */
window.editAluno = async (alunoId) => {
  const modal = document.getElementById("aluno-modal");
  const modalTitle = document.getElementById("aluno-modal-title");
  const form = document.getElementById("aluno-form");

  if (!modal || !form) {
    console.error("ERRO: Elementos do modal de aluno não foram encontrados no HTML!");
    return;
  }

  if (modalTitle) modalTitle.textContent = "A carregar dados...";
  openModal(modal);
  form.reset();

  try {
    const response = await fetch(`/api/alunos/${alunoId}`);
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || "Aluno não encontrado");
    }
    const responseObject = await response.json();
    console.log("Objeto de resposta completo recebido da API:", responseObject);

    const aluno = responseObject.data;
    if (!aluno) {
      throw new Error("A resposta da API não continha os dados do aluno.");
    }

    if (modalTitle) modalTitle.textContent = "Editar Aluno";

    form.querySelector("#aluno-id").value = aluno.id;
    form.querySelector("#aluno-nome").value = aluno.nome || "";
    form.querySelector("#aluno-email").value = aluno.email || "";
    form.querySelector("#aluno-cpf").value = aluno.cpf || "";
    form.querySelector("#aluno-telefone").value = aluno.telefone || "";
    form.querySelector("#aluno-nascimento").value = aluno.nascimento || "";
    form.querySelector("#aluno-rua").value = aluno.rua || "";
    form.querySelector("#aluno-bairro").value = aluno.bairro || "";
    form.querySelector("#aluno-observacoes").value = aluno.observacoes || "";

    // Status no checkbox
    const statusCheckbox = form.querySelector("#aluno-status");
    statusCheckbox.checked = aluno.status === 1 || aluno.status === true;

    await loadPlanosForSelect();
    const planoSelect = document.getElementById("aluno-plano");
    if (planoSelect && aluno.plano_id) {
      planoSelect.value = aluno.plano_id;
    }

    // --- Listener para salvar ---
    form.onsubmit = async (e) => {
      e.preventDefault();

      const data = {
        NomeCompleto: form.querySelector("#aluno-nome").value,
        Email: form.querySelector("#aluno-email").value,
        CPF: form.querySelector("#aluno-cpf").value,
        Telefone: form.querySelector("#aluno-telefone").value,
        DataNascimento: form.querySelector("#aluno-nascimento").value,
        Rua: form.querySelector("#aluno-rua").value,
        Bairro: form.querySelector("#aluno-bairro").value,
        Observacoes: form.querySelector("#aluno-observacoes").value,
        PlanoID: form.querySelector("#aluno-plano").value,
        Status: statusCheckbox.checked ? 1 : 0 // 👈 garante 0 ou 1
      };

      try {
        const resp = await fetch(`/api/alunos/${alunoId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data)
        });

        const result = await resp.json();
        if (resp.ok && result.success) {

          closeModal(modal);
          loadAlunos();
        } else {
          showToast("Erro", result.message || "Falha ao atualizar aluno.", "error");
        }
      } catch (err) {
        console.error("Erro ao salvar aluno:", err);
        showToast("Erro", "Erro de comunicação com o servidor.", "error");
      }
    };

  } catch (error) {
    console.error("Erro ao processar dados do aluno:", error);
    showToast("Erro", `Não foi possível carregar os dados: ${error.message}`, "error");
    closeModal(modal);
  }
};


window.editPlano = (planoId) => {
  const modalTitle = document.getElementById("plano-modal-title");
  const planoIdInput = document.getElementById("plano-id");
  const planoNome = document.getElementById("plano-nome");
  const planoPreco = document.getElementById("plano-preco");
  const planoDestaque = document.getElementById("plano-destaque");
  const planoModal = document.getElementById("plano-modal");
  const featuresContainer = document.getElementById("features-container");

  if (!planoIdInput || !planoNome || !planoPreco || !planoDestaque || !featuresContainer) return;

  if (modalTitle) modalTitle.textContent = "Carregando...";

  fetch(`/api/planos/${planoId}`)
    .then((response) => {
      if (!response.ok) throw new Error("Não foi possível carregar os dados do plano.");
      return response.json();
    })
    .then((result) => {
      const plano = result.data.plano; // backend retorna dentro de .plano

      if (modalTitle) modalTitle.textContent = "Editar Plano";

      // ID
      planoIdInput.value = plano.id ?? plano.ID ?? "";

      // Nome, Preço, Destaque
      planoNome.value = plano.nome ?? plano.Nome ?? "";
      planoPreco.value = plano.preco
        ? Number.parseFloat(plano.preco).toFixed(2)
        : plano.Preco
        ? Number.parseFloat(plano.Preco).toFixed(2)
        : "";
      planoDestaque.checked = plano.destaque ?? plano.Destaque ?? false;

      // Limpa container antes de inserir características
      featuresContainer.innerHTML = "";

      // Características
      const caracteristicas = plano.caracteristicas ?? plano.Caracteristicas ?? [];
      if (Array.isArray(caracteristicas) && caracteristicas.length > 0) {
        caracteristicas.forEach((carac) => {
          const descricao = carac.descricao ?? carac.Descricao ?? "";
          const incluido = carac.incluido ?? carac.Incluido ?? false;
          const caracId = carac.id ?? carac.ID ?? null;
          addFeatureToForm(descricao, Boolean(incluido), caracId, plano.id);
        });
      } else {
        addFeatureToForm();
      }

      openModal(planoModal);
    })
    .catch((error) => {
      console.error("Erro ao carregar plano:", error);
      showToast("Erro", error.message, "error");
      closeModal(planoModal);
    });
};



function deleteAluno(alunoId) {
  const viewAlunoModal = document.getElementById("view-aluno-modal");

  if (confirm("Tem certeza que deseja excluir este aluno? Esta ação não pode ser desfeita.")) {
    fetch(`/api/alunos/${alunoId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => {
        if (!response.ok) {
          return response.json().then((err) => {
            throw new Error(err.error || "Erro ao excluir aluno");
          });
        }
        return response.json();
      })
      .then((data) => {
        showToast("Sucesso", data.message || "Aluno excluído com sucesso!", "success");
        loadAlunos();

        if (viewAlunoModal && viewAlunoModal.classList.contains("active")) {
          closeModal(viewAlunoModal);
        }
      })
      .catch((error) => {
        console.error("Erro ao excluir aluno:", error);
        showToast("Erro", error.message || "Erro ao excluir aluno. Tente novamente.", "error");
      });
  }
}
window.deleteAluno = deleteAluno;

window.deletePlano = (planoId) => {
  if (confirm("Tem certeza que deseja excluir este plano? Esta ação não pode ser desfeita.")) {
    fetch(`/api/planos/${planoId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Erro ao excluir plano")
        }
        return response.json()
      })
      .then((data) => {
        showToast("Sucesso", "Plano excluído com sucesso!", "success")
        loadPlanos()
      })
      .catch((error) => {
        console.error("Erro ao excluir plano:", error)
        showToast("Erro", "Erro ao excluir plano. Verifique a conexão.", "error")
      })
  }
}

window.viewPlanStudents = (planoId) => {
  const menuAlunos = document.querySelector('.menu-item[data-content="alunos"]')
  if (menuAlunos) {
    menuAlunos.click()
    showToast("Info", "Funcionalidade de filtro por plano será implementada em breve.", "info")
  }
}

window.viewReport = (reportId) => {
  showToast("Info", "Funcionalidade de visualização de relatório será implementada em breve.", "info")
}

window.downloadReport = (reportId) => {
  showToast("Info", "Funcionalidade de download de relatório será implementada em breve.", "info")
}

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
  const addPlanoModal = document.getElementById("add-plano-modal")
  const viewAlunoModal = document.getElementById("view-aluno-modal")

  // Formulários
  const editProfileForm = document.getElementById("edit-profile-form")
  const alunoForm = document.getElementById("aluno-form")
  const planoForm = document.getElementById("plano-form")
  const addPlanoForm = document.getElementById("add-plano-form")

  

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
    const temperatures = [22, 23, 24, 25, 26, 27, 28]
    const randomTemp = temperatures[Math.floor(Math.random() * temperatures.length)]
    const tempElement = document.getElementById("temperature")
    if (tempElement) {
      tempElement.textContent = `${randomTemp}°C`
    }
  }

  // Atualizar hora e temperatura
  updateTime()
  getWeather()
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
      menuItems.forEach((i) => i.classList.remove("active"))
      this.classList.add("active")

      const contentId = this.getAttribute("data-content") + "-content"
      contentSections.forEach((section) => {
        section.classList.remove("active")
        if (section.id === contentId) {
          section.classList.add("active")
        }
      })

      if (contentId === "alunos-content") {
        loadAlunos()
      } else if (contentId === "planos-content") {
        loadPlanos()
      } else if (contentId === "relatorios-content") {
        loadRelatorios()
        loadTurmas()
      }

      if (window.innerWidth <= 768) {
        sidebar.classList.add("collapsed")
        sidebar.classList.remove("expanded")
        mainContent.classList.add("expanded")
      }
    })
  })

  // Responsividade
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

  if (window.innerWidth <= 768) {
    sidebar.classList.add("collapsed")
    mainContent.classList.add("expanded")
  }

  // Event listeners para botões de fechar modais
  const closeButtons = [
    { btn: "edit-profile-btn", modal: editProfileModal },
    { btn: "close-profile-modal", modal: editProfileModal },
    { btn: "cancel-profile-edit", modal: editProfileModal },
    { btn: "add-aluno-btn", modal: alunoModal, action: "add-aluno" },
    { btn: "close-aluno-modal", modal: alunoModal },
    { btn: "cancel-aluno", modal: alunoModal },
    { btn: "close-plano-modal", modal: planoModal },
    { btn: "cancel-plano", modal: planoModal },
    { btn: "close-add-plano-modal", modal: addPlanoModal },
    { btn: "cancel-add-plano", modal: addPlanoModal },
    { btn: "close-view-aluno", modal: viewAlunoModal },
  ]

  closeButtons.forEach(({ btn, modal, action }) => {
    const button = document.getElementById(btn)
    if (button && modal) {
      button.addEventListener("click", () => {
        if (action === "add-aluno") {
          const modalTitle = document.getElementById("aluno-modal-title")
          const alunoId = document.getElementById("aluno-id")

          if (modalTitle) modalTitle.textContent = "Adicionar Novo Aluno"
          if (alunoForm) alunoForm.reset()
          if (alunoId) alunoId.value = ""

          loadPlanosForSelect()
        }

        if (btn.includes("close") || btn.includes("cancel")) {
          closeModal(modal)
        } else {
          openModal(modal)
        }
      })
    }
  })

  // Event listeners para adicionar características
  const addFeatureBtn = document.getElementById("add-feature-btn")
  const addFeatureAddBtn = document.getElementById("add-feature-add-btn")

  if (addFeatureBtn) {
    addFeatureBtn.addEventListener("click", () => {
      addFeatureToForm()
    })
  }

  if (addFeatureAddBtn) {
    addFeatureAddBtn.addEventListener("click", () => {
      addFeatureToAddForm()
    })
  }

  // Event listeners para busca e relatórios
  const searchAlunoBtn = document.getElementById("search-aluno-btn")
  const generateReportBtn = document.getElementById("generate-report-btn")
  const newCustomReport = document.getElementById("new-custom-report")

  if (searchAlunoBtn) {
    searchAlunoBtn.addEventListener("click", () => {
      const searchTerm = document.getElementById("aluno-search")?.value.trim() || ""
      loadAlunos(searchTerm)
    })
  }

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

  if (generateReportBtn) {
    generateReportBtn.addEventListener("click", () => {
      const tipoRelatorio = document.getElementById("tipo-relatorio")?.value
      const dataInicial = document.getElementById("data-inicial")?.value
      const dataFinal = document.getElementById("data-final")?.value

      if (!tipoRelatorio) {
        showToast("Atenção", "Selecione um tipo de relatório.", "warning")
        return
      }

      if (!dataInicial || !dataFinal) {
        showToast("Atenção", "Selecione o período para o relatório.", "warning")
        return
      }

      showToast("Sucesso", "Relatório gerado com sucesso!", "success")
      loadRelatorios()
    })
  }

  if (newCustomReport) {
    newCustomReport.addEventListener("click", () => {
      const tipoRelatorio = document.getElementById("tipo-relatorio")
      const dataInicial = document.getElementById("data-inicial")
      const dataFinal = document.getElementById("data-final")
      const turmaRelatorio = document.getElementById("turma-relatorio")

      if (tipoRelatorio) tipoRelatorio.value = ""
      if (dataInicial) dataInicial.value = ""
      if (dataFinal) dataFinal.value = ""
      if (turmaRelatorio) turmaRelatorio.value = "todas"

      const filtersSection = document.querySelector(".reports-filters")
      if (filtersSection) {
        filtersSection.scrollIntoView({ behavior: "smooth" })
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

      const profileName = document.querySelector(".profile-info h3")
      const profileEmail = document.querySelector(".profile-info p")
      const profileTelefone = document.querySelector('input[type="tel"]')
      const userInfoName = document.querySelector(".user-info span")

      if (profileName) profileName.textContent = nome
      if (profileEmail) profileEmail.textContent = email
      if (profileTelefone) profileTelefone.value = telefone
      if (userInfoName) userInfoName.textContent = `Olá, ${nome}!`

      showToast("Sucesso", "Perfil atualizado com sucesso!", "success")
      closeModal(editProfileModal)
    })
  }

  if (alunoForm) {
    alunoForm.addEventListener("submit", async (e) => {
      e.preventDefault()

      const formData = new FormData(alunoForm)
      // Status: se o checkbox está marcado, ativo (1), se não, inativo (2)
      const statusChecked = formData.get("status") === "on"
      const alunoData = {
        NomeCompleto: formData.get("nome") || "",
        Email: formData.get("email") || "",
        CPF: formData.get("cpf") || "",
        Telefone: formData.get("telefone") || "",
        DataNascimento: formData.get("nascimento") || "",
        PlanoID: Number.parseInt(formData.get("plano")) || null,
        Rua: formData.get("rua") || "",
        Bairro: formData.get("bairro") || "",
        Observacoes: formData.get("observacoes") || "",
        Status: statusChecked ? 1 : 2,
      }

      if (!alunoData.NomeCompleto.trim()) {
        showToast("Erro", "Nome é obrigatório.", "error")
        return
      }

      if (!alunoData.Email.trim()) {
        showToast("Erro", "Email é obrigatório.", "error")
        return
      }

      if (!alunoData.CPF.trim()) {
        showToast("Erro", "CPF é obrigatório.", "error")
        return
      }

      if (!alunoData.Rua.trim()) {
        showToast("Erro", "Rua é obrigatória.", "error")
        return
      }

      if (!alunoData.Bairro.trim()) {
        showToast("Erro", "Bairro é obrigatório.", "error")
        return
      }

      if (!alunoData.DataNascimento) {
        showToast("Erro", "Data de nascimento é obrigatória.", "error")
        return
      }

      if (!alunoData.PlanoID) {
        showToast("Erro", "Plano é obrigatório.", "error")
        return
      }

      try {
        const alunoId = document.getElementById("aluno-id")?.value
        const isEdit = alunoId && alunoId.trim() !== ""

        const url = isEdit ? `/api/alunos/${alunoId}` : "/api/alunos"
        const method = isEdit ? "PUT" : "POST"

        const response = await fetch(url, {
          method: method,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(alunoData),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || "Erro ao salvar aluno")
        }

        showToast("Sucesso", isEdit ? "Aluno atualizado com sucesso!" : "Aluno cadastrado com sucesso!", "success")
        closeModal(alunoModal)
        loadAlunos()
      } catch (error) {
        console.error("Erro ao salvar aluno:", error)
        showToast("Erro", error.message || "Erro ao salvar aluno. Tente novamente.", "error")
      }
    })
  }

  if (planoForm) {
    planoForm.addEventListener("submit", async (e) => {
      e.preventDefault()

      const planoId = document.getElementById("plano-id").value
      const isEdit = !!planoId

      const formData = new FormData(planoForm)

      const features = []
      const featureInputs = planoForm.querySelectorAll('input[name="features[]"]')
      featureInputs.forEach((input, index) => {
        const text = input.value.trim()
        if (text) {
          const isIncluded = planoForm.querySelectorAll('input[name="feature_included[]"]')[index].checked
          features.push({ descricao: text, incluido: isIncluded })
        }
      })

      const planoData = {
        id: planoId,
        nome: formData.get("nome"),
        preco: formData.get("preco"),
        destaque: formData.get("destaque") === "on",
        caracteristicas: features,
      }

      if (!planoData.nome.trim() || !planoData.preco) {
        showToast("Erro", "Nome e preço do plano são obrigatórios.", "error")
        return
      }

      try {
        const url = isEdit ? `/api/planos/${planoId}` : "/api/planos"
        const method = isEdit ? "PUT" : "POST"

        const response = await fetch(url, {
          method: method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(planoData),
        })

        const result = await response.json()

        if (!response.ok || !result.success) {
          throw new Error(result.error || "Erro desconhecido ao salvar o plano.")
        }

        showToast("Sucesso", result.message || "Plano salvo com sucesso!", "success")
        closeModal(planoModal)
        loadPlanos()
      } catch (error) {
        console.error("Erro ao salvar o plano:", error)
        showToast("Erro", error.message, "error")
      }
    })
  }

  if (addPlanoForm) {
    addPlanoForm.addEventListener("submit", async (e) => {
      e.preventDefault()

      const formData = new FormData(addPlanoForm)

      const features = []
      const featureInputs = addPlanoForm.querySelectorAll('input[name="add_features[]"]')
      featureInputs.forEach((input, index) => {
        const text = input.value.trim()
        if (text) {
          const isIncluded = addPlanoForm.querySelectorAll('input[name="add_feature_included[]"]')[index].checked
          features.push({ descricao: text, incluido: isIncluded })
        }
      })

      const planoData = {
        nome: formData.get("nome"),
        preco: formData.get("preco"),
        destaque: formData.get("destaque") === "on",
        caracteristicas: features,
      }

      if (!planoData.nome.trim() || !planoData.preco) {
        showToast("Erro", "Nome e preço do plano são obrigatórios.", "error")
        return
      }

      try {
        const response = await fetch("/api/planos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(planoData),
        })

        const result = await response.json()

        if (!response.ok || !result.success) {
          throw new Error(result.error || "Erro desconhecido ao criar o plano.")
        }

        showToast("Sucesso", result.message || "Plano criado com sucesso!", "success")
        closeModal(addPlanoModal)
        loadPlanos()
      } catch (error) {
        console.error("Erro ao criar o plano:", error)
        showToast("Erro", error.message, "error")
      }
    })
  }

  // Inicializar carregamento de dados
  console.log("🎯 Dashboard carregado - versão estática")
  loadUserStats()
  loadAlunos()
})

window.deletePlano = (planoId) => {
  if (confirm("Tem certeza que deseja excluir este plano? Esta ação não pode ser desfeita.")) {
    fetch(`/api/planos/${planoId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Erro ao excluir plano")
        }
        return response.json()
      })
      .then((data) => {
        showToast("Sucesso", "Plano excluído com sucesso!", "success")
        loadPlanos()
      })
      .catch((error) => {
        console.error("Erro ao excluir plano:", error)
        showToast("Erro", "Erro ao excluir plano. Verifique a conexão.", "error")
      })
  }
}

document.addEventListener("DOMContentLoaded", () => {
    const excluirBtn = document.getElementById("excluir-plano-btn");

    if (excluirBtn) {
        excluirBtn.addEventListener("click", (e) => {
            e.preventDefault();

            const planoId = document.getElementById("plano-id").value;
            if (!planoId) {
                showToast("Erro", "ID do plano não encontrado", "error");
                return;
            }

            if (confirm("Tem certeza que deseja excluir este plano?")) {
                fetch(`/api/planos/${planoId}`, { method: "DELETE" })
                    .then(r => {
                        if (!r.ok) return r.json().then(err => { throw new Error(err.error || "Erro ao excluir") });
                        return r.json();
                    })
                    .then(data => {
                        showToast("Sucesso", data.message || "Plano excluído com sucesso!", "success");
                        closeModal(document.getElementById("plano-modal"));
                        loadPlanos();
                    })
                    .catch(err => {
                        console.error("Erro ao excluir plano:", err);
                        showToast("Erro", err.message, "error");
                    });
            }
        });
    } else {
        console.error("❌ Botão excluir não encontrado no DOM");
    }
});

