// ======== EmpressX Controle - main.js ========

// ---------- Variáveis globais ----------
let clientes = JSON.parse(localStorage.getItem("clientes")) || [];
let perfil = JSON.parse(localStorage.getItem("perfilProprietario")) || null;
let tema = localStorage.getItem("tema") || "dark";

// ---------- Funções utilitárias ----------
function salvarClientes() {
  localStorage.setItem("clientes", JSON.stringify(clientes));
}

function salvarPerfil() {
  localStorage.setItem("perfilProprietario", JSON.stringify(perfil));
}

function formatarData(data) {
  const d = new Date(data);
  return d.toLocaleDateString("pt-BR");
}

function diasRestantes(dataFinal) {
  const hoje = new Date();
  const final = new Date(dataFinal);
  const diff = Math.ceil((final - hoje) / (1000 * 60 * 60 * 24));
  return diff >= 0 ? diff : 0;
}

// ---------- Tema claro/escuro ----------
function aplicarTema() {
  document.body.classList.toggle("light-theme", tema === "light");
}
aplicarTema();

document.getElementById("toggleTema")?.addEventListener("click", () => {
  tema = tema === "dark" ? "light" : "dark";
  localStorage.setItem("tema", tema);
  aplicarTema();
});

// ---------- Perfil do proprietário ----------
function exibirPerfil() {
  const container = document.getElementById("perfilContainer");
  if (!container) return;

  if (!perfil) {
    container.innerHTML = `
      <h3>Configurar Perfil</h3>
      <input id="nomeProprietario" placeholder="Nome completo" />
      <input id="nascimento" type="date" />
      <input id="emailProprietario" type="email" placeholder="E-mail" />
      <input id="telefoneProprietario" type="tel" placeholder="+55..." />
      <input id="cpfProprietario" placeholder="CPF (chave PIX)" />
      <button id="salvarPerfilBtn">Salvar Perfil</button>
    `;
    document.getElementById("salvarPerfilBtn").addEventListener("click", () => {
      perfil = {
        nome: document.getElementById("nomeProprietario").value,
        nascimento: document.getElementById("nascimento").value,
        email: document.getElementById("emailProprietario").value,
        telefone: document.getElementById("telefoneProprietario").value,
        cpf: document.getElementById("cpfProprietario").value
      };
      salvarPerfil();
      exibirPerfil();
    });
  } else {
    container.innerHTML = `
      <div class="perfil-info">
        <h3>${perfil.nome}</h3>
        <p>📧 ${perfil.email}</p>
        <p>📱 ${perfil.telefone}</p>
        <p>💳 PIX (CPF): ${perfil.cpf}</p>
        <button id="editarPerfilBtn">Editar</button>
      </div>
    `;
    document.getElementById("editarPerfilBtn").addEventListener("click", () => {
      localStorage.removeItem("perfilProprietario");
      perfil = null;
      exibirPerfil();
    });
  }
}
exibirPerfil();

// ---------- Cadastro de cliente ----------
const form = document.getElementById("formEmprestimo");
if (form) {
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const nome = document.getElementById("nomeCliente").value;
    const valor = parseFloat(document.getElementById("valorEmprestimo").value);
    const dias = parseInt(document.getElementById("diasPagar").value);
    const juros = parseFloat(document.getElementById("jurosDiario").value);
    const cpf = document.getElementById("cpfCliente").value;
    const vencimento = new Date();
    vencimento.setDate(vencimento.getDate() + dias);

    const cliente = {
      id: Date.now(),
      nome,
      valor,
      dias,
      juros,
      cpf,
      vencimento: vencimento.toISOString(),
      status: "aberto",
      historico: []
    };

    clientes.push(cliente);
    salvarClientes();
    form.reset();
    renderClientes();
  });
}

// ---------- Renderizar clientes ----------
function renderClientes(lista = clientes) {
  const container = document.getElementById("clientesContainer");
  if (!container) return;

  container.innerHTML = "";
  lista.forEach((c) => {
    const total = c.valor + (c.valor * (c.juros / 100) * c.dias);
    const diasRest = diasRestantes(c.vencimento);
    const card = document.createElement("div");
    card.className = "cliente-card";
    card.innerHTML = `
      <h3>${c.nome}</h3>
      <p><strong>Valor:</strong> R$ ${c.valor.toFixed(2)}</p>
      <p><strong>Juros:</strong> ${c.juros}% ao dia</p>
      <p><strong>Total:</strong> R$ ${total.toFixed(2)}</p>
      <p><strong>Dias Restantes:</strong> ${diasRest}</p>
      <p><strong>Status:</strong> ${c.status}</p>
      <div class="acoes">
        <button onclick="editarCliente(${c.id})">✏️ Editar</button>
        <button onclick="renovarEmprestimo(${c.id})">🔁 Renovar</button>
        <button onclick="excluirCliente(${c.id})">🗑️ Excluir</button>
      </div>
      <button onclick="enviarWhatsApp(${c.id})">📲 Lembrar no WhatsApp</button>
    `;
    container.appendChild(card);
  });
}
renderClientes();

// ---------- Filtrar por nome ----------
document.getElementById("filtroNome")?.addEventListener("input", (e) => {
  const nomeBusca = e.target.value.toLowerCase();
  const filtrados = clientes.filter(c => c.nome.toLowerCase().includes(nomeBusca));
  renderClientes(filtrados);
});

// ---------- Editar cliente ----------
function editarCliente(id) {
  const cliente = clientes.find(c => c.id === id);
  if (!cliente) return;

  const novoValor = parseFloat(prompt("Novo valor do empréstimo:", cliente.valor)) || cliente.valor;
  const novoJuros = parseFloat(prompt("Novo juros (% ao dia):", cliente.juros)) || cliente.juros;
  cliente.valor = novoValor;
  cliente.juros = novoJuros;
  salvarClientes();
  renderClientes();
}

// ---------- Renovar empréstimo ----------
function renovarEmprestimo(id) {
  const cliente = clientes.find(c => c.id === id);
  if (!cliente) return;

  cliente.historico.push({
    data: new Date().toISOString(),
    valorAnterior: cliente.valor,
    jurosAnterior: cliente.juros
  });

  const novoValor = parseFloat(prompt("Novo valor (renovado):", cliente.valor));
  const novosDias = parseInt(prompt("Novos dias:", cliente.dias));
  const novoJuros = parseFloat(prompt("Novo juros (%):", cliente.juros));

  cliente.valor = novoValor;
  cliente.dias = novosDias;
  cliente.juros = novoJuros;
  cliente.vencimento = new Date(Date.now() + novosDias * 24 * 60 * 60 * 1000).toISOString();
  salvarClientes();
  renderClientes();
}

// ---------- Excluir cliente ----------
function excluirCliente(id) {
  if (confirm("Deseja realmente excluir este cliente?")) {
    clientes = clientes.filter(c => c.id !== id);
    salvarClientes();
    renderClientes();
  }
}

// ---------- WhatsApp ----------
function enviarWhatsApp(id) {
  const c = clientes.find(x => x.id === id);
  if (!c || !perfil) {
    alert("Configure o perfil antes de enviar mensagens!");
    return;
  }
  const total = c.valor + (c.valor * (c.juros / 100) * c.dias);
  const msg = `Olá ${c.nome}, lembrando que seu empréstimo de R$${total.toFixed(2)} vence hoje. Envie via PIX para ${perfil.cpf}. — EmpressX Controle 💼`;
  const url = `https://wa.me/${perfil.telefone.replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`;
  window.open(url, "_blank");
}
