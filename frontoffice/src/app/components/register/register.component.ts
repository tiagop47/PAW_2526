import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { SupermarketService } from '../../services/supermarket.service';
import { RegisterDTO } from '../../models/register.dto';
import { SupermarketDTO } from '../../models/supermarket.dto';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private supermarketService = inject(SupermarketService);
  private router = inject(Router);

  supermercados: SupermarketDTO[] = [];
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
    this.supermarketService.getSupermarkets()
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
