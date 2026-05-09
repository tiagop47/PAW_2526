import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NotificationComponent } from './components/notification/notification.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { FooterComponent } from './components/footer/footer.component';
import { SocketService } from './services/socket.service';
import { NotificationService } from './services/notification.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NotificationComponent, NavbarComponent, FooterComponent],
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit {
  title = 'frontoffice';

  constructor(
    private socketService: SocketService,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    this.socketService.onEvent('notificacao-geral').subscribe((data: any) => {
      this.notificationService.showInfo(data.message);
    });

    this.socketService.onEvent('status-encomenda').subscribe((data: any) => {
      this.notificationService.showSuccess(data.mensagem);
    });

    this.socketService.onEvent('codigo-levantamento').subscribe((data: any) => {
      this.notificationService.showSuccess(data.mensagem);
    });

    // Se o utilizador estiver logado, juntar à sala dele
    const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (user && user._id) {
      this.socketService.joinRoom(`user_${user._id}`);
    }
  }
}
