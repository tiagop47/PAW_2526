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
    return this.metodoEntrega === 'entrega_domicilio' ? 'Entrega ao Domicílio' : 'Levantamento em Loja';
  }

  podeCancelar(): boolean {
    const cancelavel = this.estado === 'pendente' || this.estado === 'confirmada';
    if (!cancelavel) return false;
    return Date.now() - this.criadoEm.getTime() < Order.CANCEL_WINDOW_MS;
  }

  tempoRestanteCancelamento(): string | null {
    const restante = Order.CANCEL_WINDOW_MS - (Date.now() - this.criadoEm.getTime());
    if (restante <= 0) return null;

    const minutos = Math.floor(restante / 60000);
    const segundos = Math.floor((restante % 60000) / 1000);
    return `${minutos}m ${segundos}s`;
  }

  get tempoDecorrido(): string {
    const diffMs = Date.now() - this.criadoEm.getTime();
    const diffMin = Math.floor(diffMs / 60000);

    if (diffMin < 1) {
      return 'Agora mesmo';
    }
    if (diffMin < 60) {
      return `Há ${diffMin} min`;
    }

    const diffHoras = Math.floor(diffMin / 60);
    if (diffHoras < 24) {
      return `Há ${diffHoras} horas`;
    }

    return `Há ${Math.floor(diffHoras / 24)} dias`;
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
