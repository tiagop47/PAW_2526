import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AvaliacaoService } from '../../services/avaliacao.service';
import { AvaliacaoDTO } from '../../models/avaliacao.dto';

@Component({
  selector: 'app-avaliacoes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './avaliacoes.component.html',
  styleUrl: './avaliacoes.component.css'
})
export class AvaliacoesComponent implements OnInit {
  avaliacoes: AvaliacaoDTO[] = [];
  loading: boolean = true;
  error: string | null = null;

  constructor(private avaliacaoService: AvaliacaoService) {}

  ngOnInit(): void {
    this.avaliacaoService.getMinhasAvaliacoes().subscribe({
      next: (data) => {
        this.avaliacoes = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Erro ao carregar as suas avaliações.';
        this.loading = false;
      }
    });
  }
}
