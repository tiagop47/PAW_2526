import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  username: string;
  password: string;

  constructor(private router: Router, private authService: AuthService) { 
    this.password = "";
    this.username = "";
  }

  ngOnInit(): void {
  }

  login(): void {
    this.authService.login(this.username, this.password).subscribe((user: any) => {
      if (user && user.token) {
        localStorage.setItem('currentUser', JSON.stringify(user));
        // Note: mudei para '/' porque é a rota principal no seu projeto atual, 
        // mas pode mudar para '/itemlist' se preferir.
        this.router.navigate(['/']);
      } else {
        alert('Erro no login!');
      }
    }, (error) => {
      alert('Erro no login!');
    });
  }

  // O seu exemplo tinha um método register no login, 
  // no seu projeto atual existe um componente próprio para registo.
  // Vou manter este aqui para seguir o seu modelo.
  register(): void {
    this.router.navigate(['/register']);
  }

}
