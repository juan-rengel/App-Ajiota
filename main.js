// main.js - EmpressX Controle

document.addEventListener("DOMContentLoaded", () => {
  const abas = document.querySelectorAll(".link-aba");
  const secoes = document.querySelectorAll(".aba");
  const btnTema = document.getElementById("btnTema");
  const btnMenu = document.getElementById("btnMenu");
  const sidebar = document.querySelector(".sidebar");

  const formCliente = document.getElementById("formCliente");
  const msgCliente = document.getElementById("msgCliente");
  const listaClientesHome = document.getElementById("listaClientesHome");
  const filtroClientesHome = document.getElementById("filtroClientesHome");
  const containerHistorico = document.getElementById("containerHistorico");
  const listaDevedores = document.getElementById("listaDevedores");

  let clientes = JSON.parse(localStorage.getItem("clientes")) || [];
  let proprietario = JSON.parse(localStorage.getItem("proprietario")) || null;

  // ====== PERFIL DO PROPRIETÁRIO ======
  if (!proprietario) {
    const nome = prompt("Digite seu nome completo:");
    const email = prompt("Digite seu Gmail:");
    const telefone = prompt("Digite seu telefone no formato internacional (+55...)");
    const cpf = prompt("Digite seu CPF (usado como chave PIX):");

    proprietario = { nome, email, telefone, cpf, criadoEm: new Date().toISOString() };
    localStorage.setItem("proprietario", JSON.stringify(proprietario));
    alert(`Bem-vindo(a), ${nome}! Seu perfil foi criado.`);
  }

  // ====== NAVEGAÇÃO ENTRE ABAS ======
  abas.forEach(link => {
    link.addEventListener("click", e => {
      e.preventDefault();
      abas.forEach(l => l.classList.remove("ativo"));
      secoes.forEach(s => s.classList.remove("ativa"));
      link.classList.add("ativo");
      document.getElementById(link.dataset.aba).classList.add("ativa");
      sidebar.classList.remove("aberta");
    });
  });

  btnMenu.addEventListener("click", () => sidebar.classList.toggle("aberta"));

  // ====== TEMA CLARO/ESCURO ======
  btnTema.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    localStorage.setItem("tema", document.body.classList.contains("dark") ? "dark" : "light");
  });

  if (localStorage.getItem("tema") === "dark") document.body.classList.add("dark");

  // ====== CADASTRO DE CLIENTE ======
  formCliente.addEventListener("submit", e => {
    e.preventDefault();
    const nome = document.getElementById("nomeCliente").value.trim();
    const cpf = document.getElementById("cpfCliente").value.trim();
    const pix = document.getElementById("pixCliente").value.trim();
    const valor = parseFloat(document.getElementById("valorEmprestimo").value);
    const juros = parseFloat(document.getElementById("jurosEmprestimo").value);
    const dias = parseInt(document.getElementById("diasPrazo").value);

    const dataEmprestimo = new Date();
    const dataVencimento = new Date(dataEmprestimo);
    dataVencimento.setDate(dataEmprestimo.getDate() + dias);

    const jurosTotais = ((valor * juros) / 100) * dias;
    const totalPagar = valor + jurosTotais;

    const cliente = {
      id: Date.now(),
      nome,
      cpf,
      pix,
      valor,
      juros,
      dias,
      jurosTotais,
      totalPagar,
      dataEmprestimo: dataEmprestimo.toLocaleDateString(),
      dataVencimento: dataVencimento.toLocaleDateString(),
      pago: false,
      renovacoes: [],
    };

    clientes.push(cliente);
    localStorage.setItem("clientes", JSON.stringify(clientes));
    formCliente.reset();
    msgCliente.textContent = "Cliente cadastrado com sucesso!";
    atualizarHome();
    atualizarHistorico();
    atualizarDashboard();
    atualizarDevedores();
  });

  // ====== ATUALIZAR HOME ======
  function atualizarHome(filtro = "") {
    listaClientesHome.innerHTML = "";
    clientes
      .filter(c => c.nome.toLowerCase().includes(filtro.toLowerCase()))
      .forEach(cliente => {
        const card = document.createElement("div");
        card.className = "card-cliente";
        card.innerHTML = `
          <h3>${cliente.nome}</h3>
          <p><strong>CPF:</strong> ${cliente.cpf}</p>
          <p><strong>Valor:</strong> R$ ${cliente.valor.toFixed(2)}</p>
          <p><strong>Vencimento:</strong> ${cliente.dataVencimento}</p>
          <p><strong>Status:</strong> ${cliente.pago ? "Pago" : "Pendente"}</p>
          <button onclick="editarCliente(${cliente.id})">Editar</button>
          <button onclick="excluirCliente(${cliente.id})">Excluir</button>
          <button onclick="renovarEmprestimo(${cliente.id})">Reajustar/Renovar</button>
        `;
        listaClientesHome.appendChild(card);
      });
  }

  filtroClientesHome.addEventListener("input", e => atualizarHome(e.target.value));

  // ====== HISTÓRICO ======
  function atualizarHistorico() {
    containerHistorico.innerHTML = "";
    clientes.forEach(c => {
      const div = document.createElement("div");
      div.className = "card-historico";
      div.innerHTML = `
        <h3>${c.nome}</h3>
        <p>Valor: R$ ${c.valor.toFixed(2)}</p>
        <p>Juros total: R$ ${c.jurosTotais.toFixed(2)}</p>
        <p>Total a pagar: R$ ${c.totalPagar.toFixed(2)}</p>
        <p>Data: ${c.dataEmprestimo} → ${c.dataVencimento}</p>
        <p>Status: ${c.pago ? "Pago" : "Pendente"}</p>
      `;
      containerHistorico.appendChild(div);
    });
  }

  // ====== DEVEDORES ======
  function atualizarDevedores(filtro = "") {
    listaDevedores.innerHTML = "";
    const hoje = new Date();
    clientes
      .filter(c => !c.pago && c.nome.toLowerCase().includes(filtro.toLowerCase()))
      .forEach(c => {
        const dataVenc = new Date(c.dataVencimento.split("/").reverse().join("-"));
        const diasRestantes = Math.ceil((dataVenc - hoje) / (1000 * 60 * 60 * 24));
        const card = document.createElement("div");
        card.className = "card-cliente";
        card.innerHTML = `
          <h3>${c.nome}</h3>
          <p><strong>Valor:</strong> R$ ${c.totalPagar.toFixed(2)}</p>
          <p><strong>Vencimento:</strong> ${c.dataVencimento} (${diasRestantes} dias restantes)</p>
          <a href="https://wa.me/${c.pix.replace(/\D/g, '')}?text=Olá%20${c.nome},%20seu%20empréstimo%20vence%20em%20${c.dataVencimento}.%20Por%20favor%20entre%20em%20contato%20para%20quitar.%20-%20${proprietario.nome}"
            target="_blank" class="btn-whatsapp">Enviar WhatsApp</a>
        `;
        listaDevedores.appendChild(card);
      });
  }

  document.getElementById("buscaEmprestimos").addEventListener("input", e => atualizarDevedores(e.target.value));

  // ====== DASHBOARD ======
  function atualizarDashboard() {
    document.getElementById("totalClientes").textContent = clientes.length;
    const totalEmprestado = clientes.reduce((s, c) => s + c.valor, 0);
    const totalReceber = clientes.reduce((s, c) => s + (c.pago ? 0 : c.totalPagar), 0);
    const totalRecebido = clientes.reduce((s, c) => s + (c.pago ? c.totalPagar : 0), 0);
    document.getElementById("totalEmprestado").textContent = totalEmprestado.toFixed(2);
    document.getElementById("totalReceber").textContent = totalReceber.toFixed(2);
    document.getElementById("totalRecebido").textContent = totalRecebido.toFixed(2);
  }

  // ====== FUNÇÕES GLOBAIS ======
  window.editarCliente = id => {
    const c = clientes.find(cli => cli.id === id);
    if (!c) return;
    const novoValor = parseFloat(prompt("Novo valor do empréstimo:", c.valor));
    const novoJuros = parseFloat(prompt("Novo juros diário (%):", c.juros));
    const novosDias = parseInt(prompt("Novo prazo (dias):", c.dias));

    c.valor = novoValor;
    c.juros = novoJuros;
    c.dias = novosDias;
    const jurosTotais = ((novoValor * novoJuros) / 100) * novosDias;
    c.jurosTotais = jurosTotais;
    c.totalPagar = novoValor + jurosTotais;
    c.dataVencimento = new Date(Date.now() + novosDias * 86400000).toLocaleDateString();

    localStorage.setItem("clientes", JSON.stringify(clientes));
    atualizarHome();
    atualizarHistorico();
    atualizarDashboard();
    atualizarDevedores();
  };

  window.excluirCliente = id => {
    if (confirm("Deseja realmente excluir este cliente?")) {
      clientes = clientes.filter(c => c.id !== id);
      localStorage.setItem("clientes", JSON.stringify(clientes));
      atualizarHome();
      atualizarHistorico();
      atualizarDashboard();
      atualizarDevedores();
    }
  };

  window.renovarEmprestimo = id => {
    const c = clientes.find(cli => cli.id === id);
    if (!c) return;
    c.renovacoes.push({
      data: new Date().toLocaleDateString(),
      valorAntigo: c.valor,
      novoValor: parseFloat(prompt("Novo valor do empréstimo:", c.valor)),
    });
    c.valor = c.renovacoes[c.renovacoes.length - 1].novoValor;
    c.dataEmprestimo = new Date().toLocaleDateString();
    c.dataVencimento = new Date(Date.now() + c.dias * 86400000).toLocaleDateString();
    localStorage.setItem("clientes", JSON.stringify(clientes));
    atualizarHome();
    atualizarHistorico();
  };

  // ====== EXPORTAR EXCEL ======
  document.getElementById("exportarExcel").addEventListener("click", () => {
    const ws = XLSX.utils.json_to_sheet(clientes);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Empréstimos");
    XLSX.writeFile(wb, "historico_emprestimos.xlsx");
  });

  // ====== EXPORTAR PDF ======
  document.getElementById("exportarPDF").addEventListener("click", () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.text("Histórico de Empréstimos - EmpressX", 14, 10);
    doc.autoTable({
      head: [["Nome", "CPF", "Valor", "Total", "Vencimento", "Status"]],
      body: clientes.map(c => [c.nome, c.cpf, `R$ ${c.valor.toFixed(2)}`, `R$ ${c.totalPagar.toFixed(2)}`, c.dataVencimento, c.pago ? "Pago" : "Pendente"]),
    });
    doc.save("historico_emprestimos.pdf");
  });

  // ====== INICIALIZAÇÃO ======
  atualizarHome();
  atualizarHistorico();
  atualizarDevedores();
  atualizarDashboard();
});
