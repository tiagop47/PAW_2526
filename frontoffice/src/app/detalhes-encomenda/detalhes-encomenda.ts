import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { OrderItemDTO } from '../models/order.dto';
import { Order } from '../models/order';
import { OrderService } from '../services/order.service';
import { AvaliacaoModalComponent } from '../components/avaliacao-modal/avaliacao-modal.component';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-detalhes-encomenda',
  standalone: true,
  imports: [CommonModule, RouterModule, AvaliacaoModalComponent],
  templateUrl: './detalhes-encomenda.html',
  styleUrl: './detalhes-encomenda.css',
  providers: [CurrencyPipe, DatePipe],
})
export class DetalhesEncomenda implements OnInit {
  @Input() items: OrderItemDTO[] = [];
  @Input() order: Order | null = null;
  @Input() embedded = false;
  @Input() jaAvaliou = false;
  @Output() avaliouEncomenda = new EventEmitter<string>();

  estafetaId: { nome: string; telefone: string } | undefined = undefined;
  avaliouAgora = false;
  loading = false;
  erro: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private orderService: OrderService,
    private currencyPipe: CurrencyPipe,
    private datePipe: DatePipe,
  ) {}

  ngOnInit(): void {
    const id = this.order?.id ?? this.route.snapshot.paramMap.get('id');
    if (id) {
      this.carregarEncomenda(id);
    }
  }

  carregarEncomenda(id: string): void {
    this.loading = true;
    this.orderService.obterEncomenda(id).subscribe({
      next: (order) => {
        this.order = order;
        this.estafetaId = order.estafeta;
        this.items = order.produtos;
        this.loading = false;
      },
      error: () => {
        this.erro = 'Não foi possível carregar os detalhes da encomenda.';
        this.loading = false;
      },
    });
  }

  onAvaliouSubmetido(orderId: string): void {
    this.avaliouAgora = true;
    this.avaliouEncomenda.emit(orderId);
  }

  voltar(): void {
    this.router.navigate(['/orders']);
  }

  // Getters para o resumo financeiro detalhado
  get subtotal(): number {
    return this.items.reduce((acc, item) => acc + item.precoUnitario * item.quantidade, 0);
  }

  get taxaEntrega(): number {
    if (!this.order) return 0;

    const diff = this.order.valorTotal - this.subtotal;
    return diff > 0 ? diff : 0;
  }

  get valorDesconto(): number {
    if (!this.order) return 0;

    const diff = this.subtotal - this.order.valorTotal;
    return diff > 0 ? diff : 0;
  }

  getProdutoNome(item: OrderItemDTO): string {
    if (typeof item.produtoId === 'string') {
      return item.produtoId;
    }

    return item.produtoId.nome;
  }

  getProdutoImagem(item: OrderItemDTO): string {
    if (typeof item.produtoId === 'string') {
      return '';
    }

    return item.produtoId.imagem;
  }

  gerarFatura(): void {
    if (!this.order) return;

    const doc = new jsPDF();
    const margin = 20;

    doc.setFontSize(22);
    doc.setTextColor(40);
    doc.text('FATURA SIMPLIFICADA', margin, 30);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Nº Encomenda: #${this.order.id.toUpperCase()}`, margin, 40);
    doc.text(`Data: ${this.datePipe.transform(this.order.criadoEm, 'dd/MM/yyyy HH:mm')}`, margin, 45);

    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text('EMISSOR:', margin, 60);
    doc.setFontSize(10);
    doc.text(this.order.supermercado.nome, margin, 67);
    doc.text(this.order.supermercado.localizacao, margin, 72);

    const tableData = this.items.map((item) => [
      this.getProdutoNome(item),
      item.quantidade,
      this.currencyPipe.transform(item.precoUnitario, 'EUR') || '0.00€',
      this.currencyPipe.transform(item.precoUnitario * item.quantidade, 'EUR') || '0.00€',
    ]);

    autoTable(doc, {
      startY: 85,
      head: [['Produto', 'Qtd', 'Preço Un.', 'Total']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [40, 40, 40] },
      margin: { left: margin, right: margin },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`TOTAL PAGO: ${this.currencyPipe.transform(this.order.valorTotal, 'EUR')}`, 140, finalY);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(150);
    doc.text('Obrigado pela sua preferência!', doc.internal.pageSize.width / 2, 280, { align: 'center' });

    doc.save(`fatura_${this.order.id.substring(18)}.pdf`);
  }
}
