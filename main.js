document.addEventListener("DOMContentLoaded", () => {
  // --- Variáveis e elementos ---
  const btnMenu = document.getElementById("btnMenu");
  const sidebar = document.querySelector(".sidebar");
  const linksAba = document.querySelectorAll(".link-aba");
  const abas = document.querySelectorAll(".aba");
  const btnTema = document.getElementById("btnTema");

  const listaClientesHome = document.getElementById("listaClientesHome");
  const filtroClientesHome = document.getElementById("filtroClientesHome");

  const formCliente = document.getElementById("formCliente");
  const msgCliente = document.getElementById("msgCliente");

  const containerHistorico = document.getElementById("containerHistorico");
  const exportarExcelBtn = document.getElementById("exportarExcel");
  const exportarPDFBtn = document.getElementById("exportarPDF");

  const buscaEmprestimos = document.getElementById("buscaEmprestimos");
  const listaDevedores = document.getElementById("listaDevedores");

  const totalClientesSpan = document.getElementById("totalClientes");
  const totalEmprestadoSpan = document.getElementById("totalEmprestado");
  const totalRecebidoSpan = document.getElementById("totalRecebido");
  const totalReceberSpan = document.getElementById("totalReceber");

  // --- Dados no localStorage ---
  let clientes = JSON.parse(localStorage.getItem("clientes")) || [];
  let emprestimos = JSON.parse(localStorage.getItem("emprestimos")) || [];

  // --- Função para salvar ---
  function salvarDados() {
    localStorage.setItem("clientes", JSON.stringify(clientes));
    localStorage.setItem("emprestimos", JSON.stringify(emprestimos));
  }

  // --- Troca de abas ---
  function trocarAba(nomeAba) {
    abas.forEach(aba => {
      aba.classList.toggle("ativa", aba.id === nomeAba);
    });
    linksAba.forEach(link => {
      link.classList.toggle("ativo", link.dataset.aba === nomeAba);
    });
  }

  linksAba.forEach(link => {
    link.addEventListener("click", e => {
      e.preventDefault();
      trocarAba(link.dataset.aba);
    });
  });

  // --- Menu responsivo ---
  btnMenu.addEventListener("click", () => {
    sidebar.classList.toggle("aberto");
  });

  // --- Tema Claro/Escuro ---
  function aplicarTema(tema) {
    if (tema === "escuro") {
      document.documentElement.setAttribute("data-tema", "escuro");
      btnTema.textContent = "☀️ Tema Claro";
    } else {
      document.documentElement.setAttribute("data-tema", "claro");
      btnTema.textContent = "🌙 Tema Escuro";
    }
  }

  // Carrega tema salvo
  const temaSalvo = localStorage.getItem("tema") || "claro";
  aplicarTema(temaSalvo);

  btnTema.addEventListener("click", () => {
    const atual = document.documentElement.getAttribute("data-tema");
    const novoTema = atual === "claro" ? "escuro" : "claro";
    aplicarTema(novoTema);
    localStorage.setItem("tema", novoTema);
  });

  // --- Função ler arquivo para base64 ---
  function lerArquivoBase64(inputFile, callback) {
    if (inputFile.files.length === 0) {
      callback(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      callback(reader.result);
    };
    reader.readAsDataURL(inputFile.files[0]);
  }

  // --- Limpar formulário ---
  function limparFormCliente() {
    formCliente.reset();
    msgCliente.textContent = "";
    delete formCliente.dataset.editandoId;
  }

  // --- Listar clientes na Home com editar, excluir e pendentes ---
  function carregarClientesHome(filtro = "") {
    listaClientesHome.innerHTML = "";

    const filtroLower = filtro.toLowerCase();

    const clientesFiltrados = clientes.filter(c => c.nome.toLowerCase().includes(filtroLower));

    if (clientesFiltrados.length === 0) {
      listaClientesHome.innerHTML = `<p>Nenhum cliente encontrado.</p>`;
      return;
    }

    clientesFiltrados.forEach(cliente => {
      const emprestimosCliente = emprestimos.filter(emp => emp.clienteId === cliente.id);
      const totalEmprestado = emprestimosCliente.reduce((acc, emp) => acc + emp.valorTotal, 0);
      const totalRecebido = emprestimosCliente.filter(emp => emp.pago).reduce((acc, emp) => acc + emp.valorTotal, 0);
      const totalAReceber = totalEmprestado - totalRecebido;

      const pendenteTexto = totalAReceber > 0
        ? `<p class="pendente">Valor pendente: R$ ${totalAReceber.toFixed(2)}</p>`
        : `<p class="pago">Sem pendências</p>`;

      const card = document.createElement("article");
      card.className = "card-cliente";

      card.innerHTML = `
        <img class="foto-perfil" src="${cliente.fotoPerfil || "https://via.placeholder.com/80"}" alt="Foto de perfil de ${cliente.nome}" />
        <div class="info-basica">
          <h3>${cliente.nome}</h3>
          <p><strong>CPF:</strong> ${cliente.cpf}</p>
          <p><strong>PIX:</strong> ${cliente.pix || "-"}</p>
          <p><strong>Total Emprestado:</strong> R$ ${totalEmprestado.toFixed(2)}</p>
          <p><strong>Total Recebido:</strong> R$ ${totalRecebido.toFixed(2)}</p>
          ${pendenteTexto}
          <div class="acoes-cliente">
            <button class="btn-editar" data-id="${cliente.id}">Editar</button>
            <button class="btn-excluir" data-id="${cliente.id}">Excluir</button>
          </div>
        </div>
      `;
      listaClientesHome.appendChild(card);
    });

    // Eventos dos botões editar
    document.querySelectorAll(".btn-editar").forEach(btn => {
      btn.addEventListener("click", e => {
        const id = Number(e.target.dataset.id);
        editarCliente(id);
      });
    });

    // Eventos dos botões excluir
    document.querySelectorAll(".btn-excluir").forEach(btn => {
      btn.addEventListener("click", e => {
        const id = Number(e.target.dataset.id);
        if (confirm("Tem certeza que deseja excluir esse cliente e todos os seus empréstimos?")) {
          excluirCliente(id);
        }
      });
    });
  }

  // --- Função para editar cliente ---
  function editarCliente(id) {
    const cliente = clientes.find(c => c.id === id);
    if (!cliente) return alert("Cliente não encontrado.");

    trocarAba("cadastro");

    document.getElementById("nomeCliente").value = cliente.nome;
    document.getElementById("cpfCliente").value = cliente.cpf;
    document.getElementById("pixCliente").value = cliente.pix || "";

    document.getElementById("fotoPerfilCliente").value = "";
    document.getElementById("fotoComprovanteResidencia").value = "";

    formCliente.dataset.editandoId = id;

    msgCliente.textContent = "Editando cliente. Faça as alterações e envie o formulário.";
    msgCliente.style.color = "blue";
  }

  // --- Função para excluir cliente ---
  function excluirCliente(id) {
    clientes = clientes.filter(c => c.id !== id);
    emprestimos = emprestimos.filter(emp => emp.clienteId !== id);
    salvarDados();
    carregarClientesHome();
    carregarHistorico();
    carregarDevedores();
    carregarDashboard();
  }

  // --- Cadastro ou atualização de cliente ---
  formCliente.addEventListener("submit", e => {
    e.preventDefault();

    const nome = document.getElementById("nomeCliente").value.trim();
    const cpf = document.getElementById("cpfCliente").value.trim();
    const pix = document.getElementById("pixCliente").value.trim();
    const fotoPerfilInput = document.getElementById("fotoPerfilCliente");
    const fotoComprovanteInput = document.getElementById("fotoComprovanteResidencia");
    const valorEmprestimo = parseFloat(document.getElementById("valorEmprestimo").value);
    const jurosEmprestimo = parseFloat(document.getElementById("jurosEmprestimo").value) || 0;
    const diasPrazo = parseInt(document.getElementById("diasPrazo").value);

    if (!nome || !cpf || isNaN(valorEmprestimo) || isNaN(diasPrazo)) {
      msgCliente.textContent = "Preencha todos os campos obrigatórios corretamente.";
      msgCliente.style.color = "red";
      return;
    }

    if (!/^\d{3}\.\d{3}\.\d{3}\-\d{2}$/.test(cpf)) {
      msgCliente.textContent = "CPF inválido! Use o formato 000.000.000-00.";
      msgCliente.style.color = "red";
      return;
    }

    lerArquivoBase64(fotoPerfilInput, fotoPerfil => {
      lerArquivoBase64(fotoComprovanteInput, fotoComprovante => {
        if (formCliente.dataset.editandoId) {
          // Atualiza cliente existente
          const idEdit = Number(formCliente.dataset.editandoId);
          const clienteIndex = clientes.findIndex(c => c.id === idEdit);
          if (clienteIndex === -1) {
            msgCliente.textContent = "Cliente para editar não encontrado.";
            msgCliente.style.color = "red";
            return;
          }
          clientes[clienteIndex].nome = nome;
          clientes[clienteIndex].cpf = cpf;
          clientes[clienteIndex].pix = pix;
          if (fotoPerfil) clientes[clienteIndex].fotoPerfil = fotoPerfil;
          if (fotoComprovante) clientes[clienteIndex].fotoComprovante = fotoComprovante;

          salvarDados();
          limparFormCliente();
          carregarClientesHome();
          carregarHistorico();
          carregarDevedores();
          carregarDashboard();

          msgCliente.textContent = "Cliente atualizado com sucesso!";
          msgCliente.style.color = "green";

          delete formCliente.dataset.editandoId;
        } else {
          // Novo cliente
          const clienteId = Date.now();
          const cliente = {
            id: clienteId,
            nome,
            cpf,
            pix,
            fotoPerfil,
            fotoComprovante,
          };
          clientes.push(cliente);

          // Calcula valor total com juros simples
          const valorTotal = valorEmprestimo + (valorEmprestimo * jurosEmprestimo / 100);

          const dataEmprestimo = new Date();
          const vencimento = new Date(dataEmprestimo.getTime() + diasPrazo * 24 * 60 * 60 * 1000);

          emprestimos.push({
            id: Date.now(),
            clienteId,
            valor: valorEmprestimo,
            juros: jurosEmprestimo,
            valorTotal,
            diasPrazo,
            dataEmprestimo: dataEmprestimo.toISOString(),
            vencimento: vencimento.toISOString(),
            pago: false,
            dataPagamento: null,
          });

          salvarDados();
          limparFormCliente();
          carregarClientesHome();
          carregarHistorico();
          carregarDevedores();
          carregarDashboard();

          msgCliente.textContent = "Cliente e empréstimo cadastrados com sucesso!";
          msgCliente.style.color = "green";
        }
      });
    });
  });

  // --- Filtrar clientes Home ---
  filtroClientesHome.addEventListener("input", e => {
    carregarClientesHome(e.target.value);
  });

  // --- Listar histórico de empréstimos ---
  function carregarHistorico() {
    containerHistorico.innerHTML = "";

    if (emprestimos.length === 0) {
      containerHistorico.innerHTML = "<p>Nenhum empréstimo registrado.</p>";
      return;
    }

    emprestimos.forEach(emp => {
      const cliente = clientes.find(c => c.id === emp.clienteId);
      if (!cliente) return;

      const card = document.createElement("article");
      card.className = "card-emprestimo";

      const dataEmprestimo = new Date(emp.dataEmprestimo).toLocaleDateString();
      const dataVenc = new Date(emp.vencimento).toLocaleDateString();
      const pagoTexto = emp.pago ? `<span class="pago">Pago em ${emp.dataPagamento ? new Date(emp.dataPagamento).toLocaleDateString() : "-"}</span>` : `<span class="pendente">Em aberto</span>`;

      card.innerHTML = `
        <h3>${cliente.nome}</h3>
        <p><strong>Valor:</strong> R$ ${emp.valor.toFixed(2)}</p>
        <p><strong>Juros:</strong> ${emp.juros.toFixed(2)}%</p>
        <p><strong>Total:</strong> R$ ${emp.valorTotal.toFixed(2)}</p>
        <p><strong>Data Empréstimo:</strong> ${dataEmprestimo}</p>
        <p><strong>Vencimento:</strong> ${dataVenc}</p>
        <p><strong>Status:</strong> ${pagoTexto}</p>
      `;

      containerHistorico.appendChild(card);
    });
  }

  // --- Listar devedores ---
  function carregarDevedores(filtro = "") {
    listaDevedores.innerHTML = "";

    const filtroLower = filtro.toLowerCase();

    const devedores = emprestimos.filter(emp => !emp.pago)
      .filter(emp => {
        const cliente = clientes.find(c => c.id === emp.clienteId);
        return cliente && cliente.nome.toLowerCase().includes(filtroLower);
      });

    if (devedores.length === 0) {
      listaDevedores.innerHTML = "<p>Nenhum devedor encontrado.</p>";
      return;
    }

    devedores.forEach(emp => {
      const cliente = clientes.find(c => c.id === emp.clienteId);
      if (!cliente) return;

      const card = document.createElement("article");
      card.className = "card-emprestimo";

      const dataEmprestimo = new Date(emp.dataEmprestimo).toLocaleDateString();
      const dataVenc = new Date(emp.vencimento).toLocaleDateString();

      card.innerHTML = `
        <h3>${cliente.nome}</h3>
        <p><strong>Valor:</strong> R$ ${emp.valor.toFixed(2)}</p>
        <p><strong>Juros:</strong> ${emp.juros.toFixed(2)}%</p>
        <p><strong>Total:</strong> R$ ${emp.valorTotal.toFixed(2)}</p>
        <p><strong>Data Empréstimo:</strong> ${dataEmprestimo}</p>
        <p><strong>Vencimento:</strong> ${dataVenc}</p>
        <p class="pendente"><strong>Em aberto</strong></p>
      `;

      listaDevedores.appendChild(card);
    });
  }

  buscaEmprestimos.addEventListener("input", e => {
    carregarDevedores(e.target.value);
  });

  // --- Dashboard ---
  function carregarDashboard() {
    totalClientesSpan.textContent = clientes.length;

    const totalEmprestado = emprestimos.reduce((acc, emp) => acc + emp.valorTotal, 0);
    totalEmprestadoSpan.textContent = totalEmprestado.toFixed(2);

    const totalRecebido = emprestimos.filter(emp => emp.pago).reduce((acc, emp) => acc + emp.valorTotal, 0);
    totalRecebidoSpan.textContent = totalRecebido.toFixed(2);

    const totalAReceber = totalEmprestado - totalRecebido;
    totalReceberSpan.textContent = totalAReceber.toFixed(2);
  }

  // --- Exportar Excel ---
  exportarExcelBtn.addEventListener("click", () => {
    const wb = XLSX.utils.book_new();

    // Planilha clientes
    const dadosClientes = clientes.map(c => ({
      ID: c.id,
      Nome: c.nome,
      CPF: c.cpf,
      PIX: c.pix || "",
    }));
    const wsClientes = XLSX.utils.json_to_sheet(dadosClientes);
    XLSX.utils.book_append_sheet(wb, wsClientes, "Clientes");

    // Planilha empréstimos
    const dadosEmprestimos = emprestimos.map(emp => {
      const cliente = clientes.find(c => c.id === emp.clienteId);
      return {
        ID: emp.id,
        Cliente: cliente ? cliente.nome : "Desconhecido",
        Valor: emp.valor.toFixed(2),
        Juros: emp.juros.toFixed(2),
        Total: emp.valorTotal.toFixed(2),
        DataEmprestimo: new Date(emp.dataEmprestimo).toLocaleDateString(),
        Vencimento: new Date(emp.vencimento).toLocaleDateString(),
        Pago: emp.pago ? "Sim" : "Não",
        DataPagamento: emp.dataPagamento ? new Date(emp.dataPagamento).toLocaleDateString() : "-",
      };
    });
    const wsEmprestimos = XLSX.utils.json_to_sheet(dadosEmprestimos);
    XLSX.utils.book_append_sheet(wb, wsEmprestimos, "Empréstimos");

    XLSX.writeFile(wb, "EmpressX_Controle_Export.xlsx");
  });

  // --- Exportar PDF ---
  exportarPDFBtn.addEventListener("click", () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.text("EmpressX Controle - Histórico de Empréstimos", 14, 15);

    const rows = emprestimos.map(emp => {
      const cliente = clientes.find(c => c.id === emp.clienteId);
      return [
        cliente ? cliente.nome : "Desconhecido",
        emp.valor.toFixed(2),
        emp.juros.toFixed(2),
        emp.valorTotal.toFixed(2),
        new Date(emp.dataEmprestimo).toLocaleDateString(),
        new Date(emp.vencimento).toLocaleDateString(),
        emp.pago ? "Sim" : "Não",
        emp.dataPagamento ? new Date(emp.dataPagamento).toLocaleDateString() : "-"
      ];
    });

    doc.autoTable({
      head: [["Cliente", "Valor", "Juros (%)", "Total", "Data Empréstimo", "Vencimento", "Pago", "Data Pagamento"]],
      body: rows,
      startY: 20,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] },
    });

    doc.save("EmpressX_Controle_Historico.pdf");
  });

  // --- Envio WhatsApp automático no dia do vencimento ---
  // Verifica a cada minuto (para demo pode deixar a cada 1 minuto, na produção pode ser outra forma)
  function verificarVencimentos() {
    const hoje = new Date().toISOString().slice(0, 10);

    emprestimos.forEach(emp => {
      const venc = emp.vencimento.slice(0, 10);
      if (venc === hoje && !emp.pago && !emp.notificado) {
        const cliente = clientes.find(c => c.id === emp.clienteId);
        if (!cliente || !cliente.pix) return;

        const msg = encodeURIComponent(`Olá ${cliente.nome}, seu empréstimo no valor de R$${emp.valorTotal.toFixed(2)} vence hoje. Por favor, realize o pagamento.`);
        const linkWhats = `https://wa.me/${cliente.pix.replace(/\D/g, "")}?text=${msg}`;

        window.open(linkWhats, "_blank");

        emp.notificado = true;
        salvarDados();
      }
    });
  }

  // Chama a verificação a cada 1 minuto (60000 ms)
  setInterval(verificarVencimentos, 60000);

  // --- Inicialização ---
  carregarClientesHome();
  carregarHistorico();
  carregarDevedores();
  carregarDashboard();
});
