import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserStatsService, UserStats, Cupao } from '../../services/user-stats.service';
import { AuthService } from '../../services/auth.service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  private statsService = inject(UserStatsService);
  private authService = inject(AuthService);
  
  stats: UserStats | null = null;
  cupoes: Cupao[] = [];
  userName = '';
  loading = true;

  ngOnInit(): void {
    this.authService.isLoggedIn$.subscribe(user => {
      if (user) {
        this.userName = user.nome;
      }
    });

    this.statsService.getStats().subscribe({
      next: (res) => {
        this.stats = res.stats;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });

    this.statsService.getCupoes().subscribe({
      next: (res) => this.cupoes = res.cupoes || [],
      error: () => this.cupoes = []
    });
  }
}
