import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

interface ArquivoMidia {
  id: string;
  url: string;
  nome: string;
}

interface ComentarioPúblico {
  id: number;
  texto: string;
  nome_autor: string;
  data_criacao: string;
}

interface MemorialPublico {
  id: number;
  nome: string;
  nascimento: string;
  falecimento: string;
  frase_efeito: string;
  biografia: string;
  logo_url: string;
  banner_url: string;
  imagens: ArquivoMidia[];
  videos: ArquivoMidia[];
  audios: ArquivoMidia[];
  comentarios: ComentarioPúblico[];
}

@Component({
  selector: 'memorial',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './memorial.html',
  styleUrls: ['./memorial.css']
})
export class Memorial implements OnInit {
  
  // Estado da UI
  activeTab: 'fotos' | 'videos' | 'audios' = 'fotos';
  isBioExpanded = false;
  isModalOpen = false;

  // Formulário para Nova Mensagem
  mensagemForm: FormGroup;

  // Dados Simulados
  memorial: MemorialPublico = {
    id: 1,
    nome: 'Maria da Silva',
    nascimento: '12 de Abril de 1940',
    falecimento: '05 de Setembro de 2021',
    frase_efeito: 'O amor que plantamos é a única herança que floresce para sempre.',
    biografia: 'Maria nasceu em uma manhã ensolarada no interior e, desde cedo, mostrou uma força de vontade inabalável. Dedicou sua vida à família e ao trabalho com a terra. Suas mãos calejadas contavam a história de quem construiu um lar cheio de amor, ensinando a todos o valor da simplicidade e da união. \n\nSempre com um sorriso no rosto, ela adorava reunir todos aos domingos. O cheiro do seu café fresco e do bolo de fubá jamais será esquecido por aqueles que tiveram o privilégio de compartilhar a vida com ela. Que sua luz continue nos guiando.',
    logo_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80',
    banner_url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80',
    imagens: [
      { id: '1', url: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=400&q=80', nome: 'foto1' },
      { id: '2', url: 'https://images.unsplash.com/photo-1581579186913-46eaacae27e4?auto=format&fit=crop&w=400&q=80', nome: 'foto2' },
      { id: '3', url: 'https://images.unsplash.com/photo-1476610182048-b716b8518aae?auto=format&fit=crop&w=400&q=80', nome: 'foto3' }
    ],
    videos: [],
    audios: [],
    comentarios: [
      { id: 1, texto: 'Nossa eterna rainha. Sentimos sua falta todos os dias.', nome_autor: 'Família Silva', data_criacao: '10 de Setembro de 2021' },
      { id: 2, texto: 'Uma mulher incrível que deixou um legado de muito amor.', nome_autor: 'Ana Paula', data_criacao: '15 de Setembro de 2021' }
    ]
  };

  constructor(private fb: FormBuilder) {
    this.mensagemForm = this.fb.group({
      nome_autor: ['', Validators.required],
      texto: ['', [Validators.required, Validators.minLength(5)]]
    });
  }

  ngOnInit() {}

  // Controles de Tela
  setTab(tab: 'fotos' | 'videos' | 'audios') {
    this.activeTab = tab;
  }

  toggleBio() {
    this.isBioExpanded = !this.isBioExpanded;
  }

  toggleModal() {
    this.isModalOpen = !this.isModalOpen;
    if (!this.isModalOpen) {
      this.mensagemForm.reset();
    } else {
      document.body.style.overflow = 'hidden'; // Trava o scroll do fundo
    }
  }

  closeModal() {
    this.isModalOpen = false;
    document.body.style.overflow = 'auto'; // Libera o scroll
  }

  // Envio da Homenagem
  onSubmitMensagem() {
    if (this.mensagemForm.valid) {
      console.log('Mensagem enviada para moderação:', this.mensagemForm.value);
      alert('Sua mensagem foi enviada e aguarda aprovação da família.');
      this.closeModal();
    } else {
      this.mensagemForm.markAllAsTouched();
    }
  }
}