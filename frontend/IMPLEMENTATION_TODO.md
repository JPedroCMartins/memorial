# Plano de Implementação Flutter (Web) - Todo List

## Visão Geral
Este documento contém a lista de tarefas (todo list) para implementar o frontend Flutter (web) do projeto Memorial Digital, consumindo a API Flask existente (`app/`).

---

## ✅ Fase 1: Configuração do Projeto

### Setup Inicial
- [ ] **Criar projeto Flutter** para web: `flutter create .` (dentro de `frontend/`)
- [ ] **Verificar Flutter web** habilitado: `flutter config --enable-web`
- [ ] **Configurar `web/` directory** (index.html, manifest.json, favicon)
- [ ] **Adicionar dependências no `pubspec.yaml`:**
  ```yaml
  dependencies:
    flutter:
      sdk: flutter
    http: ^1.1.0
    shared_preferences: ^2.2.0
    provider: ^6.1.1
    go_router: ^12.1.0
  ```
- [ ] **Adicionar fontes Google Fonts** no `web/index.html`:
  ```html
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Playfair+Display:wght@400;500;600&display=swap" rel="stylesheet">
  ```
- [ ] **Definir `BASE_URL`** via `dart-define` ou constante:
  ```dart
  const String BASE_URL = String.fromEnvironment('BASE_URL', defaultValue: 'http://localhost:5001');
  ```
- [ ] **Rodar `flutter pub get`**

### Configuração do web/index.html
- [ ] Importar fontes `Inter` e `Playfair Display`
- [ ] Definir `<meta name="viewport" content="width=device-width, initial-scale=1">`
- [ ] Adicionar `favicon` (usar `images/logo_martins.png` do Flask)
- [ ] Configurar `theme-color` para `--bg` (#0f0f10)

---

## 🎨 Fase 2: Design System (Tokens de Design)

### Criar arquivo `lib/theme/app_colors.dart`
```dart
class AppColors {
  static const bg = Color(0xFF0F0F10);
  static const bgSoft = Color(0xFF17181A);
  static const card = Color(0xFF1E1F22);
  static const cardHover = Color(0xFF24262A);
  static const border = Color(0xFF2A2B2F);
  static const text = Color(0xFFEAE7E2);
  static const textMuted = Color(0xFF9A958C);
  static const gold = Color(0xFFC2A878);
  static const goldDark = Color(0xFFA88D5C);
  static const goldSoft = Color(0x1EC2A878); // rgba(194,168,120,0.12)
  static const danger = Color(0xFFD9534F);
  static const success = Color(0xFF4CAF72);
}
```

### Criar arquivo `lib/theme/app_text_styles.dart`
```dart
class AppTextStyles {
  static const serif = TextStyle(fontFamily: 'PlayfairDisplay');
  static const sans = TextStyle(fontFamily: 'Inter');
  // pesos: 300, 400, 500, 600
}
```

### Criar arquivo `lib/theme/app_theme.dart`
- [ ] ThemeData com `AppColors`, `AppTextStyles`
- [ ] `InputDecorationTheme` (inputs estilo Flask)
- [ ] `ElevatedButtonTheme` (btn-user gradient)
- [ ] `OutlinedButtonTheme` (btn-outline)
- [ ] `TextButtonTheme` (btn-ghost)
- [ ] `AppBarTheme` (topbar background)
- [ ] `CardTheme` (cards com sombra)

---

## 🔐 Fase 3: Autenticação e Estado

### Modelos
- [ ] `lib/models/user.dart` - User com id, username, email, plano, planoStatus
- [ ] `lib/models/memorial.dart` - Memorial com id, nome, data, biografia, etc.
- [ ] `lib/models/auth_response.dart` - Response de login/register

### Providers
- [ ] `lib/providers/auth_provider.dart`
  - [ ] `login(String email, String password)` → POST /login
  - [ ] `register(...)` → POST /registrar
  - [ ] `logout()` → POST /logout
  - [ ] `loadPersistedSession()` → SharedPreferences
  - [ ] `isAuthenticated` getter
- [ ] `lib/providers/user_provider.dart` - dados do usuário corrente
- [ ] `lib/providers/memorial_provider.dart` - lista de memorialis

### Services
- [ ] `lib/services/api_client.dart` - HttpClient com interceptors
  - [ ] Headers padrão
  - [ ] Tratamento 401/403/404
  - [ ] Auto-refresh token (se necessário)

---

## 🔑 Fase 4: Tela de Login

### `lib/screens/auth/login_screen.dart`
- [ ] Layout: Container centralizado, `container-user` max-width
- [ ] Campos: Email (TextFormField), Senha (TextFormField obscureText)
- [ ] Botão "Entrar": `ElevatedButton` com gradient `AppColors.gold` → `AppColors.goldDark`
- [ ] Link "Registrar": `TextButton` → navega para `/register`
- [ ] Validação: email obrigatório, senha mínima 6 chars
- [ ] Loading state no botão
- [ ] SnackBar para erros 401/400
- [ ] Auto-focus no email
- [ ] Enter submete formulário

### Styling conforme Flask:
- [ ] Background: `AppColors.bg`
- [ ] Inputs: border `AppColors.border`, focus `AppColors.gold`
- [ ] Label: `AppColors.textMuted`
- [ ] Botão primary: gradient `LinearGradient(colors: [AppColors.gold, AppColors.goldDark])`, text `#141414`

---

## 📝 Fase 5: Tela de Registro

### `lib/screens/auth/register_screen.dart`
- [ ] Campos: Nome, Email, Senha, Plano (Dropdown: mensal/bianual/quinquenal)
- [ ] Botão "Criar Conta": estilo `btn-user`
- [ ] Auto-login após sucesso (redireciona para `/home`)
- [ ] Link "Já tenho conta" → navega para `/login`
- [ ] Validações: nome não vazio, email válido, senha >= 6, plano selecionado
- [ ] Loading state e tratamento de erros

---

## 🏠 Fase 6: Tela Inicial (Home)

### `lib/screens/home/home_screen.dart`
- [ ] `TopBar` widget reutilizável:
  - [ ] Logo + "Memorial" (brand)
  - [ ] Botão admin (shield) - só aparece se `isAdmin`
  - [ ] Botão logout (sign-out-alt) - estilo `btn-ghost`
- [ ] `PlanoBanner` widget:
  - [ ] Exibe se `planoValido == false`
  - [ ] Link para `/perfil` (ou tela de plano)
- [ ] Lista de memorialis:
  - [ ] `FutureBuilder` / `Consumer<MemorialProvider>`
  - [ ] `MemorialCard` widget:
    - [ ] Imagem (logo/banner) ou placeholder
    - [ ] Nome, datas, frase efeito
    - [ ] Botão "Ver" → navega `/memorial/:id`
- [ ] Botão FAB "Novo Memorial" (se tiver permissão)

---

## 👑 Fase 7: Painel Administrativo

### `lib/screens/admin/admin_screen.dart`
- [ ] Proteção: só acessível se `user.isAdmin == true` (verificar email em ADMIN_EMAILS)
- [ ] Lista de usuários (`ListView.builder`)
- [ ] Cada item: nome, email, status do plano, botões:
  - [ ] "Permitir" / "Bloquear" (btn-user / btn-danger)
  - [ ] "Excluir" (btn-danger)
- [ ] Estatísticas: total usuários, memorialis ativos, planos ativos
- [ ] Tratamento 403 → redirect para `/home` com SnackBar

---

## 📄 Fase 8: Tela de Memorial (Detalhes)

### `lib/screens/memorial/memorial_screen.dart`
- [ ] Parâmetro `id` da rota
- [ ] Header: nome, datas, frase efeito (serif `PlayfairDisplay`)
- [ ] Galeria de imagens:
  - [ ] Parse `gallery_images` (string separada por vírgula)
  - [ ] `GridView` ou `PageView` para navegação
  - [ ] Fallback se vazio
- [ ] Botões (se dono): Editar, Excluir
- [ ] Botão voltar (AppBar)

---

## 👤 Fase 9: Tela de Perfil

### `lib/screens/profile/profile_screen.dart`
- [ ] Dados: username, email
- [ ] Status do plano: badge colorido (success/gold/danger)
- [ ] Histórico de memorialis (lista resumida)
- [ ] Botão "Editar Senha" → dialog/form
- [ ] Botão "Sair" (btn-danger) → `AuthProvider.logout()`

---

## 🛣️ Fase 10: Navegação e Rotas

### `lib/router/app_router.dart` (go_router)
```dart
final router = GoRouter(
  initialLocation: '/',
  redirect: (context, state) {
    final auth = context.read<AuthProvider>();
    final loggedIn = auth.isAuthenticated;
    final goingToLogin = state.matchedLocation == '/' || state.matchedLocation == '/register';
    if (!loggedIn && !goingToLogin) return '/';
    if (loggedIn && goingToLogin) return '/home';
    return null;
  },
  routes: [
    GoRoute(path: '/', builder: (_, _) => const LoginScreen()),
    GoRoute(path: '/register', builder: (_, _) => const RegisterScreen()),
    GoRoute(path: '/home', builder: (_, _) => const HomeScreen()),
    GoRoute(path: '/admin', builder: (_, _) => const AdminScreen()),
    GoRoute(path: '/memorial/:id', builder: (_, state) => MemorialScreen(id: int.parse(state.pathParameters['id']!))),
    GoRoute(path: '/perfil', builder: (_, _) => const ProfileScreen()),
  ],
);
```

---

## 📤 Fase 11: Upload de Imagens

### `lib/widgets/image_upload.dart`
- [ ] `ImagePicker` (gallery/camera)
- [ ] Preview antes do upload
- [ ] Upload via `MultipartRequest` para `/memorial/:id/upload`
- [ ] Progress indicator
- [ ] Gallery preview (parse string CSV)

---

## 💳 Fase 12: Pagamento/Planos (Opcional)

### `lib/screens/plans/plans_screen.dart`
- [ ] Exibir 3 cards: Mensal, Bienal, Quinquenal
- [ ] Preço, duração, botão "Selecionar"
- [ ] Integração webhook/status (se necessário)

---

## 🧪 Fase 13: Testes e Deploy

### Testes
- [ ] `flutter test` - unit tests providers
- [ ] `flutter drive` - integration tests (opcional)
- [ ] Testar fluxo completo: login → home → memorial → perfil → logout
- [ ] Testar 401/403/404

### Responsividade
- [ ] Mobile (375px): stack vertical, FAB bottom
- [ ] Tablet (768px): grid 2 colunas
- [ ] Desktop (1080px+): layout completo

### Deploy
- [ ] `flutter build web --release`
- [ ] Deploy para Firebase Hosting / Vercel / Netlify
- [ ] Configurar variável `BASE_URL` de produção

---

## 📋 Ordem de Execução Sugerida

| Semana | Fases | Entregável |
|--------|-------|------------|
| 1 | 1, 2 | Projeto rodando, Design System pronto |
| 2 | 3, 4, 5 | Login + Register funcionando |
| 3 | 6, 10 | Home + Navegação + TopBar |
| 4 | 7, 8 | Admin + Memorial Detail |
| 5 | 9, 11 | Perfil + Upload Imagens |
| 6 | 12, 13 | Planos + Testes + Deploy |

---

## 🔗 Endpoints Flask Referência

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/login` | Login (email, password) |
| POST | `/registrar` | Registro (name, email, password, plano) |
| GET | `/m` | Home (memorialis do usuário) |
| GET | `/admin` | Admin (lista usuários) |
| GET | `/m/<id>` | Memorial detalhes |
| POST | `/logout` | Logout |
| POST | `/memorial/<id>/upload` | Upload imagens |

---

## ⚠️ Notas Importantes

1. **Sessão**: Flask usa cookies de sessão (HttpOnly). Flutter web precisa lidar com cookies ou usar token-based se backend suportar.
2. **CORS**: Flask deve permitir origem do Flutter web (localhost:porta durante dev).
3. **Imagens**: Flask serve em `/uploads/<memorial_id>/<filename>`.
4. **Admin**: Verificação no backend via `ADMIN_EMAILS` env var.
5. **Planos**: Status: `pendente`, `ativo`, `expirado`, `cancelado`.

---

## 🚀 Para Iniciar

```bash
cd /mnt/Omega/projetos/memorial/frontend
flutter create . --org com.memorial --project-name memorial_web
flutter pub get
flutter run -d chrome --web-port 8080
```