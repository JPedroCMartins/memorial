# Plano de Desenvolvimento Flutter (Web)

## Visão Geral
Este documento descreve o plano para desenvolvimento do frontend em Flutter (versão web) do projeto Memorial Digital. O frontend consumirá a API REST já existente em Flask (`app/`).

## 1. Arquitetura

### 1.1 Stack Tecnológica
- **Flutter 3.22+** com suporte a Web
- **Dart 3.0+**
- **HTTP** para consumo da API REST
- **Provider** para gerenciamento de estado (recomendado pela simplicidade)
- **SharedPreferences** para armazenamento local simples
- **path_provider** para acesso ao sistema de arquivos

### 1.2 Padrão de Comunicação
- API Base URL: `http://localhost:5001` (ou variável de ambiente `BASE_URL`)
- Todos os endpoints da API Flask devem ser consumidos
- Respostas em JSON
- Headers comuns: `Content-Type: application/json`

## 2. Identidade Visual (Design System)

### 2.1 Cores Oficiais (do `static/css/user.css`)
Definidas via CSS `:root` variáveis. Todas as cores devem ser referenciadas dessas variáveis ou seus valores hexadecimais diretos:

| Variável | Hex | Descrição |
|----------|-----|-----------|
| `--bg` | `#0f0f10` | Fundo principal (muito escuro) |
| `--bg-soft` | `#17181a` | Fundo suave/overlay |
| `--card` | `#1e1f22` | Cartões e cards-hover |
| `--card-hover` | `#24262a` | Hover em cards |
| `--border` | `#2a2b2f` | Bordas e scrollbar |
| `--text` | `#eae7e2` | Texto principal (cinza claro) |
| `--text-muted` | `#9a958c` | Texto secundário/desabilitado |
| `--gold` | `#c2a878` | Acento principal (dourado) |
| `--gold-dark` | `#a88d5c` | Dourado mais escuro (interações) |
| `--gold-soft` | `rgba(194, 168, 120, 0.12)` | Fundo dourado translúcido |
| `--danger` | `#d9534f` | Vermelho/erros |
| `--success` | `#4caf72` | Verde/sucessos |
| `--radius` | `16px` | Raio de borda padrão |
| `--radius-sm` | `10px` | Raio de borda pequeno |
| `--shadow` | `0 8px 30px rgba(0, 0, 0, 0.35)` | Sombra de caixa |

### 2.2 Tipografia
- **Fonte Serif:** `Playfair Display`, serif (títulos, destaque)
- **Fonte Sans:** `Inter`, sans-serif (corpo, botões, labels)
- Peso(s) recomendadas: 300, 400, 500, 600
- Import via Google Fonts: `https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Playfair+Display:wght@400;500;600&display=swap`

### 2.3 Layout e Espaçamento
- **Container máximo:** 1080px (`max-width: 1080px`)
- **Padding horizontal:** 1.25rem (`1rem` = 16px)
- **Margem de corpo:** 0 (body margin reset)
- **Line-height:** 1.5 (padrão do body)
- **Text-size-adjust:** `100%` (prevenir reflow em mobile)

### 2.4 Componentes Específicos de Estilo

#### 2.4.1 Botões (`btn-user`, `btn-outline`, `btn-ghost`)
Estes são os 3 tipos de botão usados no frontend Flask:

**`btn-user`** (primário/ação principal):
- `display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem`
- `border: none; cursor: pointer`
- `font-family: Inter; font-weight: 600; font-size: 0.95rem`
- `padding: 0.8rem 1.5rem; border-radius: 999px` (pill shape)
- `transition: transform 0.2s, background 0.2s, box-shadow 0.2s`
- **Background:** `linear-gradient(135deg, #d4b87e, var(--gold-dark))` → Flutter: `LinearGradient` ou `#d4b87e` para cor sólida
- **Cor do texto:** `#141414` (quando background definido)
- **Estado ativo:** `transform: scale(0.97)`

**`btn-outline`** (secundário/texto):
- `border: none; padding: 0.8rem 1.5rem; border-radius: 999px`
- `font-family: Inter; font-weight: 600; font-size: 0.95rem`
- `transition: background 0.2s, box-shadow 0.2s`
- **Sem background** (transparente): `background: transparent`
- **Cor do texto:** `var(--text)` (branco)
- **Hover:** `background: var(--card)` ( `#1e1f22` )
- **Estado texto-muted:** `color: var(--text-muted)` ( `#9a958c` )

**`btn-ghost`** (ícone/terciário):
- `display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem`
- `border: none; padding: 0.8rem 1.2rem; border-radius: 999px`
- `font-family: Inter; font-size: 0.95rem`
- **Hover:** `color: var(--text); background: var(--card)` 
- **Fundo fraco:** `background: rgba(217, 83, 79, 0.12)` (com `color: var(--danger)`)
- **Fundo gradiente forte:** `background: linear-gradient(135deg, #d4b87e, #a88d5c)` com `color: #141414`

#### 2.4.2 Navbar (`topbar`, `topbar-inner`, `brand`, `brand-logo`)
- **Topbar altura/background:** `rgba(15, 15, 16, 0.85)` (`--bg-soft` equivalent)
- **Topbar-inner:** `padding: 0 1.25rem` (do container-user)
- **Brand/link:** `color: var(--text)` (`#eae7e2`)
- **Brand-logo:** `background: var(--gold-soft)` (`rgba(194, 168, 120, 0.12)`), `color: var(--gold)` (`#c2a878`), `border-radius: 50%` (círculo), `width: 100%; height: 100%; object-fit: cover`
- **Ação do admin:** `color: var(--text-muted)` hover effects
- **Topbar-actions:** `background: var(--card)` (`#1e1f22`), `border-color: var(--gold-dark)`, `background: linear-gradient(135deg, #2a2b2f, #1a1b1e)` ou `linear-gradient(135deg, #d4b87e, #a88d5c)`

#### 2.4.3 Cards e Containers
- **`container-user`:** `width: 100%; max-width: 1080px; margin: 0 auto; padding: 0 1.25rem`
- **`card`:** `background: var(--card)` (`#1e1f22`), `border-radius: var(--radius)` (`16px`), `shadow: var(--shadow)`
- **Texto serifado:** `.serif` classe usando `font-family: var(--font-serif)` (`Playfair Display`)

#### 2.4.4 Estados de Texto
- **`muted`:** `color: var(--text-muted)` (`#9a958c`)
- **Semifonte:** cores intermediárias para estados secundários

## 3. Rotas e Navegação

### 3.1 Rotas Principais
- `/` - Tela de login
- `/register` - Tela de registro
- `/home` - Tela principal (memorial)
- `/admin` - Painel administrativo (protegido, 403 se não for admin)
- `/memorial/:id` - Detalhes do memorial
- `/perfil` - Perfil do usuário

### 3.2 Fluxo de Telas
```
Login/Register → Home → (Memorial/Perfil/Admin)
```

## 4. Autenticação e Estado

### 4.1 Fluxo de Autenticação
1. Tela de login com email/senha
2. Pós-login: armazenar token/state em Provider
3. Verificar autenticação em todas as rotas protegidas (`/admin`, `/m`)
4. Logout: limpar estado e redirecionar para login

### 4.2 Persistência de Sessão
- Usar `SharedPreferences` para token
- Verificar sessão expirada nos requests
- Auto-login em recarregamento da página (usando `html` package ou `Synchronously`)

## 5. Telas Detalhadas

### 5.1 Tela de Login (Login Screen)
- Campos: email, senha
- Botão "Entrar" com estilo `btn-user` (gradient dourado)
- Link para "Registrar"
- Mensagens de erro da API (401 = credenciais inválidas)

### 5.2 Tela de Registro (Register Screen)
- Campos: nome, email, senha, plano (mensal/bi-anual/quinquenal)
- Botão "Criar Conta" com estilo `btn-user`
- Auto-login após bem-sucedido
- Conexão com API Flask `/registrar`

### 5.3 Tela Inicial/Home (Home Screen)
- Exibir memorial do usuário logado
- Lista de memorialis (`Memorial.query.filter_by(user_id=current_user.id).all()`)
- Botão de navegação para criar novo memorial
- Link para perfil
- Exibir status do plano (pending/ativo/expirado) com banner `.plano-banner`

### 5.4 Painel Administrativo (Admin Screen)
- Lista de todos os usuários
- Botões de permitir/ bloquear (estilo `btn-user` ou `btn-danger`)
- Estatísticas do memorial
- Acesso apenas para emails em `ADMIN_EMAILS` (lista configurada no backend)

### 5.5 Detalhes do Memorial (Memorial Screen)
- Informações do memorial (nome, data, biografia)
- Galeria de imagens (strings separadas por vírgula do backend)
- Frase de efeito
- Botões de edição/exclusão (se dono, estilo `btn-user`)

### 5.6 Perfil do Usuário (Profile Screen)
- Dados do usuário (nome, email)
- Histórico de memorialis
- Opções de edição de senha
- Botão de logout

## 5. Integração com API Flask

### 5.1 Endpoints Mapeados

| Flutter Endpoint | Flask Endpoint | Descrição |
|-----------------|----------------|-----------|
| `POST /login` | `POST /login` | Autenticação |
| `POST /register` | `POST /registrar` | Registro com auto-login |
| `GET /m` | `GET /m` | Página inicial do usuário |
| `GET /admin` | `GET /admin` | Painel admin (403 se não for admin) |
| `GET /memorial/:id` | `GET /memorial/:id` | Detalhes do memorial |
| `POST /logout` | `POST /logout` | Deslogar |

### 5.2 Tratamento de Erros
- Tratar códigos 401 (não autenticado) → redirect para login
- Tratar códigos 403 (não autorizado) → mostrar página de acesso negado
- Tratar códigos 404 (não encontrado) → página 404 customizada
- Mensagens user-friendly a partir do JSON de erro

## 6. Gerenciamento de Estado

### 6.1 Provider vs Riverpod
- **Provider**: Mais simples, menos boilerplate (recomendado)
- **Riverpod**: Mais robusto, teste mais fácil
- *Recomendação*: Usar Provider para este projeto

### 6.2 Modelos de Estado
- `AuthState` (logado/deslogado, usuário, token)
- `MemorialState` (lista de memorialis, carregando, erro)
- `UserState` (dados do usuário corrente)

### 6.3 ChangeNotifier Implementation
```dart
class AuthProvider extends ChangeNotifier {
  User? _user;
  String? _token;
  
  User get user => _user;
  String get token => _token;
  bool get isAuthenticated => _user != null;
  
  Future login(String email, String password) async {
    // Chamada HTTP POST ${BASE_URL}/login
    // Atualizar _user e _token
    // notifyListeners();
  }
  
  Future logout() async {
    // Limpar _user e _token
    // notifyListeners();
  }
```

## 7. Navegação e Rotas

### 7.1 Configuração de Rotas (GoRoute)
```dart
final goRoute = GoRoute(
  paths: {
    '/': () => const LoginScreen(),
    '/home': () => const HomeScreen(),
    '/admin': () => const AdminScreen(),
    '/memorial/:id': () => MemorialScreen(id: int.parse(params['id']!)),
    '/perfil': () => const ProfileScreen(),
  },
);
```

### 7.2 Deep Linking (Web)
- Configurar `navigatorKey` para navegação profunda
- Suporte a back button do browser
- State preservation across reload usando `RouteInformationProvider`

## 6. Upload de Imagens

### 6.1 Integração com Uploads Flask
- A API Flask salva em `instance/uploads/<memorial_id>/`
- O frontend envia imagens via `POST /memorial/:id/upload`
- Gallery exibida como string separada por vírgula (conforme modelo existente)

### 6.3 Preview de Imagem
- Preview before upload usando `FileImage`
- Suporte a múltiplas imagens (modelo: strings separadas por vírgula)
- Validação de tamanho/tipo (verificar `accept` no input type=file)

## 7. Pagamento e Planos

### 7.1 Integração AbacatePay
- Os planos (mensal, bienal, quinquenal) já existem no backend
- Flutter apenas exibe opções e chama API de pagamento/verificação
- Status do plano exibido no perfil do usuário (usando cores `--success`/ `--danger`)

### 7.2 Fluxo de Plano
1. Usuário seleciona plano na tela de registro
2. Chamada API para criar usuário com plano
3. Redirecionamento para tela de verificação/pagamento (simulação)
4. Atualização do status do plano no perfil (usar `--gold` para ativo, `--danger` para pendente)

## 8. Considerações Finais

### 8.1 Próximos Passos
1. Configurar projeto Flutter novo com suporte a web
2. Implementar tela de login com styling idêntico ao HTML
3. Integrar com API Flask existente (todos os endpoints)
4. Implementar todas as telas listadas com styling consistente
5. Testar em diferentes browsers (Chrome, Edge, Safari)
6. Deploy para Firebase Hosting ou similar com URL customizada

### 8.2 Desafios Esperados
- Manter consistência visual exata com templates HTML atuais
- Integração exata com endpoints Flask existentes
- Tratamento de estado em Single Page Application (SPA)
- Offline first considerations (optional)

### 8.3 Checklist de Conclusão
- [ ] Projeto Flutter configurado para web com `web/` directory
- [ ] Tela de login com styling idêntico (cores `--bg`, `--gold`, fontes `Inter`/`Playfair Display`)
- [ ] Integração com API de registro e login
- [ ] Tela home exibindo memorial do usuário com lista de memorialis
- [ ] Painel admin funcionando (403 para não-admin, styling `btn-danger`/`.danger`)
- [ ] Upload e exibição de imagens (gallery string separada por vírgula)
- [ ] Perfil de usuário funcional com dados `{username}, {email}`
- [ ] Logout funcionando e limpar `SharedPreferences`
- [ ] Navegação entre todas as rotas `/`, `/register`, `/home`, `/admin`, `/perfil`
- [ ] Responsividade testada em mobile (375px), tablet (768px), desktop (1440px)
- [ ] Fonte Google Fonts importada corretamente (`Inter` + `Playfair Display`)
- [ ] Cores variáveis CSS mapeadas para o widget system do Flutter