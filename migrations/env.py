import os
import sys
from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool

from alembic import context

# Permite importar o app do diretório raiz
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Sinaliza para create_app() pular create_all (o Alembic controla as tabelas)
os.environ['ALEMBIC'] = '1'

from app import create_app, db

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Carrega a URL do banco a partir da configuração do app Flask
# (permite sobrescrever via variável de ambiente, útil para testes/deploy)
app = create_app()
db_url = os.environ.get('SQLALCHEMY_DATABASE_URI') or app.config['SQLALCHEMY_DATABASE_URI']
config.set_main_option('sqlalchemy.url', db_url.replace('%', '%%'))

# Metadata dos modelos para suporte a autogenerate
target_metadata = db.metadata


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine
    and associate a connection with the context.

    """
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()