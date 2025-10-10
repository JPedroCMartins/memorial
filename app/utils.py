# em app/utils.py
from datetime import datetime

def formatar_data(valor_string):
    """Converte uma string 'YYYY-MM-DD' para 'DD/MM/YYYY'."""
    if not valor_string:
        return ""
    try:
        # Converte a string para um objeto de data
        objeto_data = datetime.strptime(valor_string, '%Y-%m-%d')
        # Formata o objeto de data para o formato brasileiro
        return objeto_data.strftime('%d/%m/%Y')
    except (ValueError, TypeError):
        # Retorna o valor original se não conseguir converter
        return valor_string