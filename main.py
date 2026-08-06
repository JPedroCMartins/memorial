import os

from app import create_app, db

app = create_app()

if __name__ == '__main__':
     # Cria o banco se não existir
    app.run(debug=True, host='0.0.0.0', port=int(os.environ.get('PORT', 5001)))
