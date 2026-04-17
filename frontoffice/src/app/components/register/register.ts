import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RegisterDTO } from '../../models/register.dto';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class Register implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private http = inject(HttpClient);
  private router = inject(Router);

  supermercados: any[] = [];
  errorMessage: string = '';

  registerForm = this.fb.group({
    nome: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
    nif: ['', [Validators.minLength(9), Validators.maxLength(9)]],
    telefone: ['', Validators.required],
    morada: ['', Validators.required]
  });

  ngOnInit() {
    this.http.get<any>('http://localhost:3000/api/supermercados')
      .subscribe({
        next: (markets) => this.supermercados = markets,
        error: (err) => console.error('Erro ao carregar supermercados:', err)
      });
  }

  onSubmit() {
    if (this.registerForm.valid) {
      this.authService.register(this.registerForm.value as RegisterDTO).subscribe({
        next: () => {
          this.router.navigate(['/login']);
        },
        error: (err) => {
          this.errorMessage = err.error?.error || 'Erro ao criar conta.';
        }
      });
    }
  }
}
