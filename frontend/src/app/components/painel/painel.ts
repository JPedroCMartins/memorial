import { Component, HostListener, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

// ==========================================
// INTERFACES (Tipagem dos Dados)
// ==========================================
interface Comentario {
  id: number;
  texto: string;
  nome_autor: string;
  data_criacao: string;
  is_visible: boolean;
}

interface ArquivoMidia {
  id: string;
  url: string;
  nome: string;
}

interface Memorial {
  id: number;
  nome: string;
  nascimento: string;
  falecimento: string;
  frase_efeito: string;
  biografia: string;
  url_personalizada: string;
  logo_filename: string | null;
  comentarios: Comentario[];
  imagens: ArquivoMidia[];
  videos: ArquivoMidia[];
  audios: ArquivoMidia[];
}

interface Toast {
  mensagem: string;
  tipo: 'sucesso' | 'erro';
}

@Component({
  selector: 'app-painel',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './painel.html' 
})
export class Painel implements OnInit {
  // ==========================================
  // DADOS DA TELA
  // ==========================================
  username = 'João Pedro';

  memoriais: Memorial[] = [
    {
      id: 1,
      nome: 'Maria da Silva',
      nascimento: '1940-04-12', // Formato YYYY-MM-DD é melhor para inputs type="date"
      falecimento: '2021-09-05',
      frase_efeito: 'Uma vida dedicada ao amor e à família.',
      biografia: 'Maria nasceu no interior e construiu uma linda família...',
      url_personalizada: 'maria-silva',
      logo_filename: null,
      comentarios: [
        { id: 101, texto: 'Saudades eternas, vó.', nome_autor: 'Carlos', data_criacao: '10/09/2021', is_visible: true },
        { id: 102, texto: 'Uma mulher incrível.', nome_autor: 'Ana', data_criacao: '12/09/2021', is_visible: false }
      ],
      imagens: [
        { id: 'img1', url: 'https://via.placeholder.com/150', nome: 'foto1.jpg' }
      ],
      videos: [],
      audios: []
    }
  ];

  // ==========================================
  // CONTROLE DE ESTADO DA UI (MODAIS E MENUS)
  // ==========================================
  isNovoMemorialModalOpen = false;
  activeDropdownId: number | null = null;
  memorialSelecionadoParaComentarios: Memorial | null = null;
  memorialSendoEditado: Memorial | null = null;
  memorialSendoExcluido: Memorial | null = null;

  // Toast de feedback
  toast: Toast | null = null;
  private toastTimer: any;

  // ==========================================
  // FORMULÁRIOS REATIVOS
  // ==========================================
  novoMemorialForm: FormGroup;
  editForm: FormGroup;

  constructor(private fb: FormBuilder, private router: Router) {
    // Inicializa o formulário de CRIAÇÃO
    this.novoMemorialForm = this.fb.group({
      nome: ['', Validators.required],
      nascimento: ['', Validators.required],
      falecimento: ['', Validators.required],
      frase_efeito: ['', Validators.required],
      biografia: ['', Validators.required],
      url_personalizada: ['', Validators.required]
    });

    // Inicializa o formulário de EDIÇÃO
    this.editForm = this.fb.group({
      nome: ['', Validators.required],
      nascimento: ['', Validators.required],
      falecimento: ['', Validators.required],
      frase_efeito: ['', Validators.required],
      biografia: ['', Validators.required],
      url_personalizada: ['', Validators.required]
    });
  }

  ngOnInit() {}

  // Fecha todos os modais e o dropdown com Esc
  @HostListener('document:keydown.escape')
  onEscape() {
    if (this.memorialSendoExcluido) {
      this.fecharConfirmarExclusao();
    } else if (this.memorialSelecionadoParaComentarios) {
      this.fecharModalComentarios();
    } else if (this.memorialSendoEditado) {
      this.fecharModalEdicao();
    } else if (this.isNovoMemorialModalOpen) {
      this.toggleNovoMemorialModal();
    }
    this.activeDropdownId = null;
  }

  // Toast
  mostrarToast(mensagem: string, tipo: Toast['tipo'] = 'sucesso') {
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
    this.toast = { mensagem, tipo };
    this.toastTimer = window.setTimeout(() => {
      this.toast = null;
    }, 4000);
  }

  fecharToast() {
    this.toast = null;
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
  }

  sair() {
    this.mostrarToast('Você saiu do sistema.');
    this.router.navigate(['/login']);
  }

  // ==========================================
  // MÉTODOS: NOVO MEMORIAL
  // ==========================================
  toggleNovoMemorialModal() {
    if (this.isNovoMemorialModalOpen) {
      this.novoMemorialForm.reset();
    }
    this.isNovoMemorialModalOpen = !this.isNovoMemorialModalOpen;
  }

  fecharNovoMemorialModal() {
    this.isNovoMemorialModalOpen = false;
    this.novoMemorialForm.reset();
  }

  onSubmitNovoMemorial() {
    if (this.novoMemorialForm.valid) {
      console.log('Dados do novo memorial:', this.novoMemorialForm.value);
      // Aqui entraria a chamada HTTP para sua API
      this.mostrarToast('Memorial criado com sucesso!');
      this.fecharNovoMemorialModal();
    } else {
      this.novoMemorialForm.markAllAsTouched();
    }
  }

  // ==========================================
  // MÉTODOS: EDIÇÃO DE MEMORIAL
  // ==========================================
  abrirModalEdicao(memorial: Memorial) {
    this.memorialSendoEditado = memorial;
    this.activeDropdownId = null; // Fecha o menu dropdown

    // Preenche o formulário com os dados do memorial selecionado
    this.editForm.patchValue({
      nome: memorial.nome,
      nascimento: memorial.nascimento,
      falecimento: memorial.falecimento,
      frase_efeito: memorial.frase_efeito,
      biografia: memorial.biografia,
      url_personalizada: memorial.url_personalizada
    });
  }

  fecharModalEdicao() {
    this.memorialSendoEditado = null;
    this.editForm.reset();
  }

  onSubmitEdicao() {
    if (this.editForm.valid) {
      console.log('Dados editados prontos para salvar:', this.editForm.value);
      // Aqui entraria a chamada HTTP para salvar na sua API
      this.mostrarToast('Memorial atualizado com sucesso!');
      this.fecharModalEdicao();
    } else {
      this.editForm.markAllAsTouched();
    }
  }

  removerMidiaModal(tipo: 'imagem' | 'video' | 'audio', idMidia: string) {
    if (this.memorialSendoEditado) {
      if (tipo === 'imagem') {
        this.memorialSendoEditado.imagens = this.memorialSendoEditado.imagens.filter(img => img.id !== idMidia);
      } else if (tipo === 'video') {
        this.memorialSendoEditado.videos = this.memorialSendoEditado.videos.filter(vid => vid.id !== idMidia);
      } else if (tipo === 'audio') {
        this.memorialSendoEditado.audios = this.memorialSendoEditado.audios.filter(aud => aud.id !== idMidia);
      }
      this.mostrarToast(`Arquivo de ${tipo} removido.`, 'sucesso');
    }
  }

  // ==========================================
  // MÉTODOS: COMENTÁRIOS E DROPDOWNS
  // ==========================================
  toggleDropdown(id: number, event: Event) {
    event.stopPropagation(); // Evita que o clique feche o dropdown imediatamente pelo HostListener
    this.activeDropdownId = this.activeDropdownId === id ? null : id;
  }

  // Fecha dropdowns se clicar em qualquer outro lugar da tela
  @HostListener('document:click')
  fecharDropdownsGlobais() {
    this.activeDropdownId = null;
  }

  abrirModalComentarios(memorial: Memorial) {
    this.memorialSelecionadoParaComentarios = memorial;
    this.activeDropdownId = null;
  }

  fecharModalComentarios() {
    this.memorialSelecionadoParaComentarios = null;
  }

  toggleComentarioVisibilidade(comentario: Comentario) {
    comentario.is_visible = !comentario.is_visible;
    this.mostrarToast(comentario.is_visible ? 'Comentário visível no memorial.' : 'Comentário ocultado.');
    // Aqui você também faria um request HTTP para atualizar no banco
  }

  apagarComentario(memorial: Memorial, idComentario: number) {
    memorial.comentarios = memorial.comentarios.filter(c => c.id !== idComentario);
    this.mostrarToast('Comentário apagado permanentemente.');
    // Aqui você também faria um request HTTP para deletar no banco
  }

  // ==========================================
  // MÉTODOS: APAGAR MEMORIAL (diálogo de confirmação)
  // ==========================================
  solicitarExclusao(memorial: Memorial) {
    this.memorialSendoExcluido = memorial;
    this.activeDropdownId = null;
  }

  fecharConfirmarExclusao() {
    this.memorialSendoExcluido = null;
  }

  confirmarExclusao() {
    if (this.memorialSendoExcluido) {
      const nome = this.memorialSendoExcluido.nome;
      this.memoriais = this.memoriais.filter(m => m.id !== this.memorialSendoExcluido!.id);
      this.fecharConfirmarExclusao();
      this.mostrarToast(`Memorial de "${nome}" e todas as mídias foram removidos.`);
      // Aqui você faria o DELETE via API
    }
  }

  // ==========================================
  // MÉTODOS: APAGAR MEMORIAL (legado)
  // ==========================================
  apagarMemorial(id: number) {
    this.mostrarToast('Removendo memorial...', 'erro');
  }
}