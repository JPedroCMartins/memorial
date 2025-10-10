# 1. Imagem base
FROM python:3.10-slim

# 2. Define o diretório de trabalho dentro do container
WORKDIR /app

# 3. Copia o arquivo de dependências e instala
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 4. Copia todo o código do projeto para o diretório /app
COPY . .

# 5. Expõe a porta que o Gunicorn vai usar
EXPOSE 5001

# 6. Comando para iniciar a aplicação
#    Atenção: Ajuste "app:app" se necessário
CMD ["gunicorn", "--workers", "3", "--bind", "0.0.0.0:5001", "main:app"]