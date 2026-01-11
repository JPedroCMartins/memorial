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

        // Verifica se o conteúdo é realmente maior que o wrapper
        // Se não for, esconde o botão
        // Usamos um pequeno timeout para garantir que o conteúdo (imagens) tenha tempo de carregar
        setTimeout(() => {
            const targetSelector = button.dataset.target;
            const contentWrapper = document.querySelector(targetSelector);
            if (contentWrapper && contentWrapper.scrollHeight <= 200) { // 200 é a altura recolhida
                button.style.display = 'none';
            }
        }, 500);

    });
});