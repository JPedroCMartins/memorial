# 🚀 Memorial

![Python](https://img.shields.io/badge/Python-3.11-blue?logo=python&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED?logo=docker&logoColor=white)
![uv](https://img.shields.io/badge/uv-Fastest_Manager-purple)
![License](https://img.shields.io/badge/License-MIT-green)

Aplicação web desenvolvida em **Flask** para servir como memorial. O projeto utiliza práticas modernas de desenvolvimento Python, incluindo gerenciamento de dependências com `uv` e containerização com Docker.

## 🛠️ Tecnologias Utilizadas

- **Backend:** Python 3.11, Flask.
- **Servidor:** Gunicorn (WSGI) com workers assíncronos.
- **Gerenciamento de Pacotes:** [uv](https://github.com/astral-sh/uv) (substituto moderno para pip/poetry).
- **Infraestrutura:** Docker e Docker Compose.

## 🚀 Como Rodar

Você pode rodar a aplicação de duas formas: usando Docker (recomendado para produção/testes limpos) ou localmente com `uv` (para desenvolvimento rápido).

### Opção 1: Docker (Recomendado)

Certifique-se de ter o Docker e Docker Compose instalados.

```bash
# 1. Construir e subir o container
docker compose up --build -d

# 2. Acessar a aplicação
# Abra http://localhost:8001