import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { SupermarketService } from '../../services/supermarket.service';
import { SupermarketDTO } from '../../models/supermarket.dto';
import { UserDTO } from '../../models/user.dto';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css'
})
export class SettingsComponent implements OnInit {
  settingsForm!: FormGroup;
  supermercados: SupermarketDTO[] = [];
  message: string | null = null;
  error: string | null = null;
  loading = false;
  initialLoading = true;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private supermarketService: SupermarketService
  ) {
    // Inicializar formulário vazio
    this.settingsForm = this.fb.group({
      nome: ['', Validators.required],
      email: [{ value: '', disabled: true }, [Validators.required, Validators.email]],
      telefone: ['', Validators.required],
      nif: [''],
      morada: ['', Validators.required],
      supermercadoFavorito: ['']
    });
  }

  ngOnInit(): void {
    // 1. Carregar lista de supermercados
    this.supermarketService.getSupermarkets().subscribe(data => {
      this.supermercados = data;
    });

    // 2. Carregar perfil atual da API e injetar no formulário
    this.authService.getCurrentUser().subscribe({
      next: (user: UserDTO) => {
        this.settingsForm.patchValue({
          nome: user.nome,
          email: user.email,
          telefone: user.telefone,
          nif: user.nif,
          morada: user.morada,
          supermercadoFavorito: user.supermercadoFavorito
        });
        this.initialLoading = false;
      },
      error: () => {
        this.error = 'Não foi possível carregar o seu perfil.';
        this.initialLoading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.settingsForm.valid) {
      this.loading = true;
      this.message = null;
      this.error = null;
      
      this.authService.updateProfile(this.settingsForm.getRawValue()).subscribe({
        next: () => {
          this.message = 'Configurações atualizadas com sucesso!';
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Erro ao atualizar perfil.';
          this.loading = false;
        }
      });
    }
  }
}
