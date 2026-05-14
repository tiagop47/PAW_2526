import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ReclamacaoDTO } from '../../models/reclamacao.dto';
import { SupermarketDTO } from '../../models/supermarket.dto';
import { Order } from '../../models/order';
import { ReclamacaoService } from '../../services/reclamacao.service';
import { SupermarketService } from '../../services/supermarket.service';
import { OrderService } from '../../services/order.service';

@Component({
  selector: 'app-livro-reclamacoes',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './livro-reclamacoes.html',
  styleUrl: './livro-reclamacoes.css',
})
export class LivroReclamacoes implements OnInit {
  reclamacaoForm: FormGroup;
  reclamacoes: ReclamacaoDTO[] = [];
  supermercados: SupermarketDTO[] = [];
  encomendas: Order[] = [];
  loading = true;
  submitting = false;
  message: string | null = null;
  error: string | null = null;

  constructor(
    private fb: FormBuilder,
    private reclamacaoService: ReclamacaoService,
    private supermarketService: SupermarketService,
    private orderService: OrderService,
  ) {
    this.reclamacaoForm = this.fb.group({
      supermercadoId: [''],
      encomendaId: [''],
      categoria: ['outro', Validators.required],
      assunto: ['', [Validators.required, Validators.minLength(3)]],
      descricao: ['', [Validators.required, Validators.minLength(10)]],
    });
  }

  ngOnInit(): void {
    this.carregarDados();
  }

  carregarDados(): void {
    this.loading = true;

    this.reclamacaoService.listarMinhas().subscribe({
      next: (res) => {
        this.reclamacoes = res.reclamacoes || [];
        this.loading = false;
      },
      error: () => {
        this.reclamacoes = [];
        this.loading = false;
      },
    });

    this.supermarketService.getSupermarkets().subscribe({
      next: (data) => (this.supermercados = data),
      error: () => (this.supermercados = []),
    });

    this.orderService.listarEncomendas().subscribe({
      next: (data) => (this.encomendas = data),
      error: () => (this.encomendas = []),
    });
  }

  enviar(): void {
    if (this.reclamacaoForm.invalid) {
      return;
    }

    this.submitting = true;
    this.message = null;
    this.error = null;

    const dados = this.reclamacaoForm.value;
    this.reclamacaoService
      .criar({
        supermercadoId: dados.supermercadoId || undefined,
        encomendaId: dados.encomendaId || undefined,
        categoria: dados.categoria,
        assunto: dados.assunto,
        descricao: dados.descricao,
      })
      .subscribe({
        next: (res) => {
          this.reclamacoes = [res.reclamacao].concat(this.reclamacoes);
          this.reclamacaoForm.reset({
            supermercadoId: '',
            encomendaId: '',
            categoria: 'outro',
            assunto: '',
            descricao: '',
          });
          this.message = 'Reclamação enviada com sucesso.';
          this.submitting = false;
        },
        error: (err) => {
          this.error = err.error?.erro || 'Não foi possível enviar a reclamação.';
          this.submitting = false;
        },
      });
  }

  estadoLabel(estado: ReclamacaoDTO['estado']): string {
    const labels = {
      pendente: 'Pendente',
      em_analise: 'Em análise',
      resolvida: 'Resolvida',
    };

    return labels[estado];
  }

  categoriaLabel(categoria: ReclamacaoDTO['categoria']): string {
    const labels = {
      produto: 'Produto',
      entrega: 'Entrega',
      pagamento: 'Pagamento',
      atendimento: 'Atendimento',
      outro: 'Outro',
    };

    return labels[categoria];
  }

  estadoBadge(estado: ReclamacaoDTO['estado']): string {
    if (estado === 'resolvida') return 'bg-success';
    if (estado === 'em_analise') return 'bg-warning text-dark';
    return 'bg-secondary';
  }
}
