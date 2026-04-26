import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { UserDTO } from '../../models/user.dto';

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
    this.authService.login(this.username, this.password).subscribe({
      next: (user: UserDTO) => {
        if (user && user.token) {
          this.router.navigate(['/']);
        }
      },
      error: (err) => {
        alert('Erro no login! Verifique as suas credenciais.');
      }
    });
  }

  
  register(): void {
    this.router.navigate(['/register']);
  }

}
