// ========= VARIÁVEIS =========
let loansData = JSON.parse(localStorage.getItem('loansData')) || [];
let loanHistory = JSON.parse(localStorage.getItem('loanHistory')) || [];

// ========= ELEMENTOS =========
const loanForm = document.getElementById('loanForm');
const loanList = document.getElementById('loanList');
const searchInput = document.getElementById('searchInput');
const toast = document.getElementById('toast');
const sumPrincipal = document.getElementById('sumPrincipal');
const sumWithInterest = document.getElementById('sumWithInterest');
const countPending = document.getElementById('countPending');

// ========= FUNÇÕES =========

// Notificação visual (toast)
function showToast(message, type = 'success') {
  toast.textContent = message;
  toast.className = `toast show ${type}`;
  setTimeout(() => {
    toast.className = toast.className.replace('show', '');
  }, 3000);
}

// Atualiza totais do topo
function updateSummary() {
  const totalPrincipal = loansData.reduce((acc, l) => acc + l.amount, 0);
  const totalWithInterest = loansData.reduce(
    (acc, l) => acc + l.amount * (1 + (l.interest / 100) * l.days),
    0
  );

  sumPrincipal.textContent = `R$ ${totalPrincipal.toFixed(2)}`;
  sumWithInterest.textContent = `R$ ${totalWithInterest.toFixed(2)}`;
  countPending.textContent = loansData.length;
}

// Salvar no localStorage
function saveData() {
  localStorage.setItem('loansData', JSON.stringify(loansData));
  localStorage.setItem('loanHistory', JSON.stringify(loanHistory));
  updateSummary();
}

// Renderizar lista
function renderLoans(filter = '') {
  loanList.innerHTML = '';
  const filtered = loansData.filter(l =>
    l.name.toLowerCase().includes(filter.toLowerCase())
  );

  if (filtered.length === 0) {
    loanList.innerHTML = '<p class="empty">Nenhum empréstimo encontrado.</p>';
    return;
  }

  filtered.forEach((loan, index) => {
    const totalWithInterest = loan.amount * (1 + (loan.interest / 100) * loan.days);
    const dueDate = new Date(loan.date);
    dueDate.setDate(dueDate.getDate() + loan.days);
    const daysLeft = Math.ceil((dueDate - new Date()) / (1000 * 60 * 60 * 24));

    const card = document.createElement('div');
    card.className = 'loan-card';
    card.innerHTML = `
      <div class="card-header">
        <h3>${loan.name}</h3>
        <p>📞 ${loan.phone || 'Sem telefone'}</p>
      </div>
      <div class="card-body">
        <p><strong>Valor:</strong> R$ ${loan.amount.toFixed(2)}</p>
        <p><strong>Juros:</strong> ${loan.interest}% ao dia</p>
        <p><strong>Dias:</strong> ${loan.days}</p>
        <p><strong>Total:</strong> R$ ${totalWithInterest.toFixed(2)}</p>
        <p><strong>Restam:</strong> ${daysLeft} dias</p>
        <p><strong>Data:</strong> ${loan.date}</p>
      </div>
      <div class="card-actions">
        <button class="pay-btn" onclick="markAsPaid(${index})">✅ Pago</button>
        <button class="delete-btn" onclick="deleteLoan(${index})">🗑️ Excluir</button>
      </div>
    `;
    loanList.appendChild(card);
  });
  updateSummary();
}

// Marcar como pago
function markAsPaid(index) {
  const loan = loansData[index];
  if (!confirm(`Confirmar pagamento de ${loan.name}?`)) return;

  const paidLoan = {
    ...loan,
    paidDate: new Date().toLocaleDateString('pt-BR'),
    status: 'Pago'
  };

  loanHistory.push(paidLoan);
  loansData.splice(index, 1);
  saveData();
  renderLoans();
  showToast(`💸 Empréstimo de ${loan.name} foi pago com sucesso!`);
}

// Excluir empréstimo
function deleteLoan(index) {
  if (!confirm('Deseja excluir este empréstimo?')) return;
  loansData.splice(index, 1);
  saveData();
  renderLoans();
  showToast('🗑️ Empréstimo removido');
}

// Enviar formulário
loanForm.addEventListener('submit', e => {
  e.preventDefault();

  const name = document.getElementById('personName').value;
  const amount = parseFloat(document.getElementById('loanAmount').value);
  const days = parseInt(document.getElementById('daysToPay').value);
  const interest = parseFloat(document.getElementById('interestRate').value);
  const date = document.getElementById('loanDate').value;
  const phone = document.getElementById('phoneNumber').value;

  const loan = { name, amount, days, interest, date, phone };
  loansData.push(loan);
  saveData();
  renderLoans();
  loanForm.reset();
  showToast('✅ Empréstimo adicionado!');
});

// Busca dinâmica
searchInput.addEventListener('input', e => {
  renderLoans(e.target.value);
});

// ========= MODO ESCURO =========
const toggleThemeBtn = document.getElementById('toggleThemeBtn');
const body = document.body;
const currentTheme = localStorage.getItem('theme') || 'dark';
body.classList.toggle('dark', currentTheme === 'dark');

toggleThemeBtn.textContent = currentTheme === 'dark' ? '☀️' : '🌙';

toggleThemeBtn.addEventListener('click', () => {
  body.classList.toggle('dark');
  const theme = body.classList.contains('dark') ? 'dark' : 'light';
  localStorage.setItem('theme', theme);
  toggleThemeBtn.textContent = theme === 'dark' ? '☀️' : '🌙';
});

// ========= MENU LATERAL =========
const sidebar = document.getElementById('sidebar');
document.getElementById('openMenu').addEventListener('click', () => {
  sidebar.classList.add('open');
});
document.getElementById('closeMenu').addEventListener('click', () => {
  sidebar.classList.remove('open');
});

// ========= INICIALIZAÇÃO =========
renderLoans();
updateSummary();



