import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { OrderItemDTO } from '../models/order.dto';
import { Order } from '../models/order';
import { OrderService } from '../services/order.service';
import { AvaliacaoService } from '../services/avaliacao.service';
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
  order: Order | null = null;
  items: OrderItemDTO[] = [];
  jaAvaliou = false;
  avaliouAgora = false;
  loading = false;
  erro: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private orderService: OrderService,
    private avaliacaoService: AvaliacaoService,
    private currencyPipe: CurrencyPipe,
    private datePipe: DatePipe,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.carregarEncomenda(id);
  }

  carregarEncomenda(id: string): void {
    this.loading = true;
    forkJoin({
      order: this.orderService.obterEncomenda(id),
      avaliacoes: this.avaliacaoService.getMinhasAvaliacoes(),
    }).subscribe({
      next: ({ order, avaliacoes }) => {
        this.order = order;
        this.items = order.produtos;
        this.jaAvaliou = avaliacoes.some((a) => a.encomendaId === id);
        this.loading = false;
      },
      error: () => {
        this.erro = 'Não foi possível carregar os detalhes da encomenda.';
        this.loading = false;
      },
    });
  }

  onAvaliouSubmetido(): void {
    this.avaliouAgora = true;
  }

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
    return typeof item.produtoId === 'string' ? item.produtoId : item.produtoId.nome;
  }

  getProdutoImagem(item: OrderItemDTO): string {
    return typeof item.produtoId === 'string' ? '' : item.produtoId.imagem;
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
