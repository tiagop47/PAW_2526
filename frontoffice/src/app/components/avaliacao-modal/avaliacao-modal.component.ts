import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AvaliacaoService } from '../../services/avaliacao.service';
import { Order } from '../../models/order';

@Component({
  selector: 'app-avaliacao-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './avaliacao-modal.component.html',
  styleUrl: './avaliacao-modal.component.css'
})
export class AvaliacaoModalComponent {
  @Input() order!: Order;
  @Output() fechado = new EventEmitter<void>();
  @Output() submetido = new EventEmitter<string>();

  notaSupermercado: number = 0;
  notaEstafeta: number = 0;
  comentario: string = '';
  erro: string | null = null;
  a_submeter: boolean = false;

  readonly estrelas = [1, 2, 3, 4, 5];

  constructor(private avaliacaoService: AvaliacaoService) {}

  fechar(): void {
    this.fechado.emit();
  }

  submeter(): void {
    if (this.notaSupermercado === 0) {
      this.erro = 'Por favor avalia o supermercado.';
      return;
    }
    if (this.order.temEstafeta() && this.notaEstafeta === 0) {
      this.erro = 'Por favor avalia o estafeta.';
      return;
    }

    this.a_submeter = true;
    this.erro = null;

    const dados: any = {
      encomendaId: this.order.id,
      notaSupermercado: this.notaSupermercado,
      comentario: this.comentario
    };

    if (this.order.temEstafeta()) {
      dados.notaEstafeta = this.notaEstafeta;
    }

    this.avaliacaoService.criarAvaliacao(dados).subscribe({
      next: () => {
        this.submetido.emit(this.order.id);
      },
      error: (err) => {
        this.erro = 'Erro ao enviar avaliação.';
        this.a_submeter = false;
      }
    });
  }
}
