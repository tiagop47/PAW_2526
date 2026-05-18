import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
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
  styleUrl: './register.component.css',
})
export class RegisterComponent implements OnInit {
  supermercados: SupermarketDTO[] = [];
  errorMessage: string = '';
  registerForm!: FormGroup;
  captchaSiteKey: string | null = null;
  captchaResponse: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private supermarketService: SupermarketService,
    private router: Router,
  ) {
    this.registerForm = this.fb.group({
      nome: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      telefone: ['', Validators.required],
      morada: ['', Validators.required],
      nif: [''],
      password: ['', [Validators.required, Validators.minLength(6)]],
      supermercadoFavorito: [''],
    });
  }

  ngOnInit() {
    this.supermarketService.getSupermarkets().subscribe({
      next: (markets) => (this.supermercados = markets),
      error: (err) => console.error('Erro ao carregar supermercados:', err),
    });

    this.carregarCaptcha();
  }

  carregarCaptcha() {
    this.authService.getCaptchaKey().subscribe(res => {
      if (res.siteKey) {
        this.captchaSiteKey = res.siteKey;
        this.renderizarCaptcha();
      }
    });
  }

  renderizarCaptcha() {
    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${this.captchaSiteKey}`;
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    script.onload = () => {
      // No v3 não renderizamos widget, apenas preparamos o ambiente
      console.log('reCAPTCHA v3 carregado');
    };
  }

  onSubmit() {
    if (this.registerForm.valid) {
      const realizarRegisto = (token?: string) => {
        const dados: any = { ...this.registerForm.value };
        if (token) {
          dados['g-recaptcha-response'] = token;
        }

        this.authService.register(dados as RegisterDTO).subscribe({
          next: () => {
            this.router.navigate(['/login']);
          },
          error: (err) => {
            this.errorMessage = err.error?.error || 'Erro ao criar conta.';
          },
        });
      };

      if (this.captchaSiteKey) {
        (window as any).grecaptcha.ready(() => {
          (window as any).grecaptcha.execute(this.captchaSiteKey, { action: 'registar' }).then((token: string) => {
            realizarRegisto(token);
          });
        });
      } else {
        realizarRegisto();
      }
    }
  }
}
