function delete_file(memorial_id, filename, filetype) {
    if (confirm('Tem certeza que deseja remover esta imagem?')) {
        fetch(`/m/${memorial_id}/delete_file/${filename}/${filetype}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    location.reload();
                } else {
                    alert('Erro ao remover a imagem.');
                }
            })
            .catch(error => {
                console.error('Erro:', error);
                alert('Erro ao remover a imagem.');
            });
    }
}