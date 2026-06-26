import { Component, HostListener } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

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

@Component({
  selector: 'app-painel',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './painel.html' 
})
export class Painel {
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

  // ==========================================
  // FORMULÁRIOS REATIVOS
  // ==========================================
  novoMemorialForm: FormGroup;
  editForm: FormGroup;

  constructor(private fb: FormBuilder) {
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

  // ==========================================
  // MÉTODOS: NOVO MEMORIAL
  // ==========================================
  toggleNovoMemorialModal() {
    this.isNovoMemorialModalOpen = !this.isNovoMemorialModalOpen;
    // Se fechou, limpa o formulário
    if (!this.isNovoMemorialModalOpen) {
      this.novoMemorialForm.reset();
    }
  }

  onSubmitNovoMemorial() {
    if (this.novoMemorialForm.valid) {
      console.log('Dados do novo memorial:', this.novoMemorialForm.value);
      // Aqui entraria a chamada HTTP para sua API
      this.toggleNovoMemorialModal();
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
      this.fecharModalEdicao();
    } else {
      this.editForm.markAllAsTouched();
    }
  }

  removerMidiaModal(tipo: 'imagem' | 'video' | 'audio', idMidia: string) {
    if(confirm(`Tem certeza que deseja remover este(a) ${tipo}?`)) {
      console.log(`Deletar ${tipo} com ID: ${idMidia}`);
      
      // Simulação da exclusão visual no Frontend
      if (this.memorialSendoEditado) {
        if (tipo === 'imagem') {
          this.memorialSendoEditado.imagens = this.memorialSendoEditado.imagens.filter(img => img.id !== idMidia);
        } else if (tipo === 'video') {
          this.memorialSendoEditado.videos = this.memorialSendoEditado.videos.filter(vid => vid.id !== idMidia);
        } else if (tipo === 'audio') {
          this.memorialSendoEditado.audios = this.memorialSendoEditado.audios.filter(aud => aud.id !== idMidia);
        }
      }
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
    // Aqui você também faria um request HTTP para atualizar no banco
  }

  apagarComentario(memorial: Memorial, idComentario: number) {
    if(confirm('Apagar este comentário permanentemente?')) {
      memorial.comentarios = memorial.comentarios.filter(c => c.id !== idComentario);
      // Aqui você também faria um request HTTP para deletar no banco
    }
  }

  // ==========================================
  // MÉTODOS: APAGAR MEMORIAL
  // ==========================================
  apagarMemorial(id: number) {
    if(confirm('Tem certeza que deseja apagar permanentemente este memorial e todas as suas mídias?')) {
      this.memoriais = this.memoriais.filter(m => m.id !== id);
      // Aqui você faria o DELETE via API
    }
  }
}