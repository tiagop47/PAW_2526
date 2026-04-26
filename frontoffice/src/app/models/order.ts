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
    em_preparacao: 'Em Preparação',
    em_entrega: 'Em Entrega',
    aguarda_validacao: 'Aguarda Confirmação',
    entregue: 'Entregue',
    cancelada: 'Cancelada',
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



  get metodoEntregaLabel(): string {
    return this.metodoEntrega === 'entrega_domicilio'
      ? 'Entrega ao Domicílio'
      : 'Levantamento em Loja';
  }

  podeCancelar(): boolean {
    if (this.estado === 'pendente') return true;
    if (this.estado === 'confirmada' && this.confirmadaEm) {
      return Date.now() - this.confirmadaEm.getTime() < Order.CANCEL_WINDOW_MS;
    }
    return false;
  }

  tempoRestanteCancelamento(): string | null {
    if (this.estado !== 'confirmada' || !this.confirmadaEm) {
      return null;
    }
    
    var restante = Order.CANCEL_WINDOW_MS - (Date.now() - this.confirmadaEm.getTime());
    if (restante <= 0) {
      return null;
    }

    var minutos = Math.floor(restante / 60000);
    var segundos = Math.floor((restante % 60000) / 1000);

    return `${minutos}m ${segundos}s`;
  }

  podeConfirmarRececao(): boolean {
    return this.estado === 'aguarda_validacao';
  }

  podeAvaliar(): boolean {
    return this.estado === 'entregue';
  }

  temEstafeta(): boolean {
    return this.metodoEntrega === 'entrega_domicilio' && !!this.estafeta;
  }
}
