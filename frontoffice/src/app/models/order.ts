import { OrderDTO, OrderItemDTO } from './order.dto';

export class Order {
  readonly id: string;
  readonly supermercado: { _id: string; nome: string; localizacao: string };
  readonly clienteId: string;
  readonly estafeta?: { nome: string; telefone: string };
  readonly produtos: OrderItemDTO[];
  readonly valorTotal: number;
  readonly estado: OrderDTO['estado'];
  readonly metodoEntrega: OrderDTO['metodoEntrega'];
  readonly moradaEntrega?: string;
  readonly confirmadaEm?: Date;
  readonly criadoEm: Date;

  private static readonly CANCEL_WINDOW_MS = 5 * 60 * 1000;

  private static readonly ESTADO_LABELS: Record<OrderDTO['estado'], string> = {
    pendente: 'Pendente',
    confirmada: 'Confirmada',
    preparacao: 'Em Preparação',
    em_entrega: 'Em Entrega',
    aguarda_confirmacao: 'Aguarda Confirmação',
    entregue: 'Entregue',
    cancelada: 'Cancelada',
  };

  private static readonly ESTADO_CLASSES: Record<OrderDTO['estado'], string> = {
    pendente: 'badge-pendente',
    confirmada: 'badge-confirmada',
    preparacao: 'badge-preparacao',
    em_entrega: 'badge-entrega',
    aguarda_confirmacao: 'badge-aguarda',
    entregue: 'badge-entregue',
    cancelada: 'badge-cancelada',
  };

  constructor(dto: OrderDTO) {
    this.id = dto._id;
    this.supermercado = dto.supermercadoId;
    this.clienteId = dto.clienteId;
    this.estafeta = dto.estafetaId;
    this.produtos = dto.produtos;
    this.valorTotal = dto.valorTotal;
    this.estado = dto.estado;
    this.metodoEntrega = dto.metodoEntrega;
    this.moradaEntrega = dto.moradaEntrega;
    this.confirmadaEm = dto.confirmadaEm ? new Date(dto.confirmadaEm) : undefined;
    this.criadoEm = new Date(dto.criadoEm);
  }

  get estadoLabel(): string {
    if (this.estado === 'em_entrega' && !this.estafeta) return 'Aguarda Estafeta';
    return Order.ESTADO_LABELS[this.estado];
  }

  get estadoCssClass(): string {
    return Order.ESTADO_CLASSES[this.estado];
  }

  get metodoEntregaLabel(): string {
    return this.metodoEntrega === 'entrega_domicilio' ? 'Entrega ao Domicílio' : 'Levantamento em Loja';
  }

  // Regra b): cancelar até 5 min após confirmação, ou enquanto pendente
  podeCancelar(): boolean {
    if (this.estado === 'pendente') return true;
    if (this.estado === 'confirmada' && this.confirmadaEm) {
      return Date.now() - this.confirmadaEm.getTime() < Order.CANCEL_WINDOW_MS;
    }
    return false;
  }

  tempoRestanteCancelamento(): string | null {
    if (this.estado !== 'confirmada' || !this.confirmadaEm) return null;
    const restante = Order.CANCEL_WINDOW_MS - (Date.now() - this.confirmadaEm.getTime());
    if (restante <= 0) return null;
    const minutos = Math.floor(restante / 60000);
    const segundos = Math.floor((restante % 60000) / 1000);
    return `${minutos}m ${segundos}s`;
  }

  podeConfirmarRececao(): boolean {
    return this.estado === 'aguarda_confirmacao';
  }
}
