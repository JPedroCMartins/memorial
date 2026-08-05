import os
import sys
import sqlite3

import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


class TestMigrations:
    """Valida que as migrações Alembic são aplicáveis e reversíveis."""

    def _paths(self, tmp_path):
        ini = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'alembic.ini')
        scripts = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'migrations')
        db_path = str(tmp_path / 'migra_test.db')
        return ini, scripts, db_path

    def _run(self, cwd, *args, env_extra):
        import subprocess
        import json
        env = dict(os.environ)
        env.update(env_extra)
        return subprocess.run(
            [sys.executable, '-m', 'alembic', *args],
            cwd=cwd, env=env, capture_output=True, text=True,
        )

    def test_upgrade_e_downgrade(self, tmp_path):
        cwd = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        db_path = str(tmp_path / 'migra_test.db')

        env_extra = {
            'SQLALCHEMY_DATABASE_URI': f'sqlite:///{db_path}',
            'ALEMBIC': '1',
        }

        # upgrade até o head
        r = self._run(cwd, 'upgrade', 'head', env_extra=env_extra)
        assert r.returncode == 0, r.stderr
        assert os.path.exists(db_path)

        conn = sqlite3.connect(db_path)
        tabelas = {r_[0] for r_ in conn.execute("SELECT name FROM sqlite_master WHERE type='table'")}
        conn.close()
        assert {'user', 'memorial', 'comentario', 'alembic_version'} <= tabelas

        # downgrade até a base (dropa as tabelas)
        r = self._run(cwd, 'downgrade', 'base', env_extra=env_extra)
        assert r.returncode == 0, r.stdout

        conn = sqlite3.connect(db_path)
        restantes = {r_[0] for r_ in conn.execute("SELECT name FROM sqlite_master WHERE type='table'")}
        conn.close()
        assert 'user' not in restantes
        assert 'memorial' not in restantes