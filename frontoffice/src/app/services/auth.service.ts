import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { RegisterDTO } from '../models/register.dto';
import { UserDTO } from '../models/user.dto';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/auth';
  private tokenSubject = new BehaviorSubject<string | null>(this.getToken());

  isLoggedIn$ = this.tokenSubject.asObservable();

  login(credentials: { email: string; password: string }): Observable<{ token: string; user: UserDTO }> {
    return this.http.post<{ token: string; user: UserDTO }>(`${this.apiUrl}/login`, credentials).pipe(
      tap(response => {
        if (response.token) {
          this.setToken(response.token);
        }
        if (response.user) {
          localStorage.setItem('currentUser', JSON.stringify(response.user));
        }
      })
    );
  }

  register(userData: RegisterDTO): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/registar`, userData);
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    this.tokenSubject.next(null);
  }

  getCurrentUser(): UserDTO | null {
    const userStr = localStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  private setToken(token: string): void {
    localStorage.setItem('token', token);
    this.tokenSubject.next(token);
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    if (!token) return false;
    
    return !this.isTokenExpired(token);
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      // O expiração do JWT (exp) é em segundos, o Date.now() em milissegundos
      const expirationDate = payload.exp * 1000;
      return Date.now() >= expirationDate;
    } catch (e) {
      return true; // Token inválido ou ilegível
    }
  }
}
