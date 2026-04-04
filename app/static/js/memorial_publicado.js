document.addEventListener('DOMContentLoaded', function () {
    // Procura por todos os botões "Mostrar mais"
    document.querySelectorAll('.btn-show-more').forEach(button => {

        // Adiciona um evento de clique a cada um
        button.addEventListener('click', function () {

            // Pega o ID do alvo (ex: "#bioWrapper")
            const targetSelector = this.dataset.target;
            const contentWrapper = document.querySelector(targetSelector);

            if (contentWrapper) {
                // Alterna (adiciona/remove) a classe "is-expanded"
                contentWrapper.classList.toggle('is-expanded');
                this.classList.toggle('is-expanded');

                // Muda o texto do botão
                if (contentWrapper.classList.contains('is-expanded')) {
                    this.innerHTML = 'Mostrar menos <i class="fas fa-chevron-up ms-1"></i>';
                } else {
                    this.innerHTML = 'Mostrar mais <i class="fas fa-chevron-down ms-1"></i>';
                }
            }
        });

    });

    function checkButtonVisibility() {
        document.querySelectorAll('.btn-show-more').forEach(button => {
            const targetSelector = button.dataset.target;
            const contentWrapper = document.querySelector(targetSelector);
            
            if (contentWrapper && contentWrapper.offsetParent !== null) { // Apenas elementos visíveis
                // Verifica se não está expandido para medir o overflow
                if (!contentWrapper.classList.contains('is-expanded')) {
                    if (contentWrapper.scrollHeight <= contentWrapper.clientHeight) {
                        button.style.display = 'none';
                        contentWrapper.style.maskImage = 'none';
                        contentWrapper.style.webkitMaskImage = 'none';
                    } else {
                        button.style.display = 'block';
                        contentWrapper.style.maskImage = '';
                        contentWrapper.style.webkitMaskImage = '';
                    }
                }
            }
        });
    }

    // Executa a verificação inicial (com um pequeno timeout para garantir o carregamento das imagens)
    setTimeout(checkButtonVisibility, 500);

    // Reavalia a visibilidade caso a janela mude de tamanho
    window.addEventListener('resize', checkButtonVisibility);

    // Atualiza a visibilidade dos botões ao trocar de aba (fotos, vídeos, áudios)
    const tabEls = document.querySelectorAll('button[data-bs-toggle="tab"]');
    tabEls.forEach(tab => {
        tab.addEventListener('shown.bs.tab', checkButtonVisibility);
    });
});
