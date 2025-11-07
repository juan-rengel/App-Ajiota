/* ===========================
   EmpressX - Controle de Empréstimos
   Desenvolvido em 2025
=========================== */

document.addEventListener("DOMContentLoaded", () => {
  const btnTema = document.getElementById("btnTema");
  const btnMenu = document.getElementById("btnMenu");
  const sidebar = document.querySelector(".sidebar");
  const conteudo = document.querySelector(".conteudo");

  const formCliente = document.getElementById("formCliente");
  const listaClientes = document.getElementById("listaClientes");
  const formPerfil = document.getElementById("formPerfil");
  const perfilPreview = document.getElementById("perfilPreview");

  // ===========================
  // VARIÁVEIS GLOBAIS
  // ===========================
  let clientes = JSON.parse(localStorage.getItem("clientes")) || [];
  let perfil = JSON.parse(localStorage.getItem("perfil")) || {};
  let temaAtual = localStorage.getItem("tema") || "escuro";

  // ===========================
  // FUNÇÃO: ALTERAR TEMA
  // ===========================
  function aplicarTema() {
    document.documentElement.setAttribute("data-tema", temaAtual);
    btnTema.textContent = temaAtual === "escuro" ? "☀️ Claro" : "🌙 Escuro";
  }
  aplicarTema();

  btnTema.addEventListener("click", () => {
    temaAtual = temaAtual === "escuro" ? "claro" : "escuro";
    localStorage.setItem("tema", temaAtual);
    aplicarTema();
  });

  // ===========================
  // MENU RESPONSIVO
  // ===========================
  btnMenu.addEventListener("click", () => {
    sidebar.classList.toggle("ativo");
  });

  document.querySelectorAll(".sidebar nav ul li a").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const secaoId = e.target.getAttribute("href").substring(1);
      document.querySelectorAll(".secao").forEach(sec => sec.style.display = "none");
      document.getElementById(secaoId).style.display = "block";
      sidebar.classList.remove("ativo");
    });
  });

  // ===========================
  // FUNÇÃO: SALVAR CLIENTES
  // ===========================
  function salvarClientes() {
    localStorage.setItem("clientes", JSON.stringify(clientes));
  }

  // ===========================
  // FUNÇÃO: LISTAR CLIENTES
  // ===========================
  function listarClientes() {
    listaClientes.innerHTML = "";

    if (clientes.length === 0) {
      listaClientes.innerHTML = `<p style="text-align:center;">Nenhum cliente cadastrado.</p>`;
      return;
    }

    clientes.forEach((c, i) => {
      const card = document.createElement("div");
      card.classList.add("card-cliente");
      const diasRestantes = calcularDiasRestantes(c.vencimento);

      card.innerHTML = `
        <img src="${c.foto || 'https://via.placeholder.com/70'}" alt="foto do cliente">
        <h3>${c.nome}</h3>
        <p><strong>Valor:</strong> R$ ${c.valor}</p>
        <p><strong>Vencimento:</strong> ${c.vencimento} (${diasRestantes} dias restantes)</p>
        <p><strong>Status:</strong> ${c.status}</p>
        <div class="card-acoes">
          <button onclick="editarCliente(${i})">✏️ Editar</button>
          <button onclick="excluirCliente(${i})">🗑️ Excluir</button>
          <button onclick="enviarWhatsapp(${i})">📱 WhatsApp</button>
          <button onclick="renovarEmprestimo(${i})">🔄 Renovar</button>
        </div>
      `;
      listaClientes.appendChild(card);
    });
  }

  // ===========================
  // FUNÇÃO: CADASTRAR / EDITAR CLIENTE
  // ===========================
  formCliente.addEventListener("submit", (e) => {
    e.preventDefault();

    const nome = document.getElementById("nome").value.trim();
    const valor = parseFloat(document.getElementById("valor").value);
    const vencimento = document.getElementById("vencimento").value;
    const foto = document.getElementById("foto").value;

    if (!nome || isNaN(valor) || !vencimento) {
      alert("Preencha todos os campos corretamente!");
      return;
    }

    const clienteExistente = clientes.findIndex(c => c.nome.toLowerCase() === nome.toLowerCase());

    if (clienteExistente >= 0) {
      clientes[clienteExistente] = { ...clientes[clienteExistente], nome, valor, vencimento, foto };
      alert("Cliente atualizado com sucesso!");
    } else {
      clientes.push({ nome, valor, vencimento, foto, status: "Aberto", historico: [] });
      alert("Cliente cadastrado!");
    }

    salvarClientes();
    listarClientes();
    formCliente.reset();
  });

  // ===========================
  // FUNÇÃO: EDITAR CLIENTE
  // ===========================
  window.editarCliente = (index) => {
    const c = clientes[index];
    document.getElementById("nome").value = c.nome;
    document.getElementById("valor").value = c.valor;
    document.getElementById("vencimento").value = c.vencimento;
    document.getElementById("foto").value = c.foto;
    document.querySelector('a[href="#home"]').click();
  };

  // ===========================
  // FUNÇÃO: EXCLUIR CLIENTE
  // ===========================
  window.excluirCliente = (index) => {
    if (confirm("Deseja realmente excluir este cliente?")) {
      clientes.splice(index, 1);
      salvarClientes();
      listarClientes();
    }
  };

  // ===========================
  // FUNÇÃO: RENOVAR EMPRÉSTIMO
  // ===========================
  window.renovarEmprestimo = (index) => {
    const c = clientes[index];
    const novoValor = parseFloat(prompt(`Novo valor para ${c.nome}:`, c.valor));
    const novaData = prompt(`Nova data de vencimento (AAAA-MM-DD):`, c.vencimento);

    if (isNaN(novoValor) || !novaData) {
      alert("Informações inválidas.");
      return;
    }

    // Salva histórico
    c.historico.push({
      dataAntiga: c.vencimento,
      valorAntigo: c.valor,
      renovadoEm: new Date().toISOString().split("T")[0],
    });

    // Atualiza com nova info
    c.valor = novoValor;
    c.vencimento = novaData;
    c.status = "Renovado";

    salvarClientes();
    listarClientes();
    alert(`Empréstimo de ${c.nome} renovado com sucesso!`);
  };

  // ===========================
  // FUNÇÃO: ENVIAR WHATSAPP
  // ===========================
  window.enviarWhatsapp = (index) => {
    const c = clientes[index];
    const mensagem = `Olá ${c.nome}! 👋%0ASeu empréstimo de R$${c.valor} vence em ${c.vencimento}.%0AFavor confirmar o pagamento.%0A%0A— EmpressX`;
    const numero = prompt("Digite o número do cliente com DDD (ex: 55999887766):");

    if (numero) {
      window.open(`https://wa.me/55${numero}?text=${mensagem}`, "_blank");
    }
  };

  // ===========================
  // FUNÇÃO: PERFIL DO PROPRIETÁRIO
  // ===========================
  if (perfil.nome) {
    document.getElementById("nomeProprietario").value = perfil.nome;
    document.getElementById("emailProprietario").value = perfil.email;
    document.getElementById("fotoProprietario").value = perfil.foto;
    atualizarPreviewPerfil();
  }

  formPerfil.addEventListener("submit", (e) => {
    e.preventDefault();
    perfil = {
      nome: document.getElementById("nomeProprietario").value,
      email: document.getElementById("emailProprietario").value,
      foto: document.getElementById("fotoProprietario").value,
    };
    localStorage.setItem("perfil", JSON.stringify(perfil));
    atualizarPreviewPerfil();
    alert("Perfil salvo com sucesso!");
  });

  function atualizarPreviewPerfil() {
    perfilPreview.innerHTML = `
      <img src="${perfil.foto || 'https://via.placeholder.com/100'}" alt="foto do proprietário">
      <p><strong>${perfil.nome || ''}</strong></p>
      <p>${perfil.email || ''}</p>
    `;
  }

  // ===========================
  // UTILITÁRIOS
  // ===========================
  function calcularDiasRestantes(data) {
    const hoje = new Date();
    const venc = new Date(data);
    const diff = venc - hoje;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  // Inicializa
  listarClientes();
});
