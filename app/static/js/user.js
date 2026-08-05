/* ============================================================
   Memorial — Utilidades do frontend do usuário
   ============================================================ */

function showToast(mensagem, tipo = 'sucesso') {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'toast ' + (tipo === 'erro' ? 'error' : 'success');
    toast.innerHTML = `
        <span>${mensagem}</span>
        <button type="button" aria-label="Fechar aviso">&times;</button>
    `;

    const close = () => {
        toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-16px)';
        setTimeout(() => toast.remove(), 300);
    };

    toast.querySelector('button').addEventListener('click', close);
    container.appendChild(toast);
    setTimeout(close, 4000);
}

/* --- Modal utilities --- */
function openModal(el) {
    const modal = el.closest('.modal-user-overlay');
    if (modal) modal.classList.add('open');
}

function closeModal(el) {
    const modal = el.closest('.modal-user-overlay');
    if (modal) modal.classList.remove('open');
}

/* Fecha modais com a tecla Esc */
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal-user-overlay.open').forEach((m) => m.classList.remove('open'));
    }
});

/* Fecha ao clicar no fundo */
document.querySelectorAll('.modal-user-overlay').forEach((overlay) => {
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.classList.remove('open');
    });
});

/* ============================================================
   Diálogo de confirmação reutilizável
   ============================================================ */
function confirmDialog(opts) {
    const { titulo, mensagem, onConfirm } = opts;

    const overlay = document.createElement('div');
    overlay.className = 'modal-user-overlay';
    overlay.innerHTML = `
        <div class="modal-user" style="max-width:420px;">
            <div class="modal-user-body">
                <div class="confirm-box">
                    <div class="confirm-icon"><i class="fas fa-trash-alt"></i></div>
                    <h3>${titulo}</h3>
                    <p>${mensagem}</p>
                </div>
            </div>
            <div class="modal-user-foot">
                <button type="button" class="btn-user btn-ghost btn-cancel">Cancelar</button>
                <button type="button" class="btn-user btn-danger btn-confirm">Confirmar</button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('open'));

    const close = () => {
        overlay.classList.remove('open');
        setTimeout(() => overlay.remove(), 300);
    };

    overlay.querySelector('.btn-cancel').addEventListener('click', close);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    overlay.querySelector('.btn-confirm').addEventListener('click', () => {
        close();
        if (onConfirm) onConfirm();
    });

    return overlay;
}