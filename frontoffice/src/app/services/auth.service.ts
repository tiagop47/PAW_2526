import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { API_URL } from '../app.config';
import { LoginModel } from '../models/login.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private endpoint = `${API_URL}/auth/`;

  constructor(private http: HttpClient) { }

  login(email: string, password: string): Observable<any> {
    return this.http.post<any>(this.endpoint + "login", new LoginModel(email, password)).pipe(
      tap(user => {
        if (user && user.token) {
          localStorage.setItem('currentUser', JSON.stringify(user));
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem('currentUser');
  }

  register(username: string, password: string): Observable<any> {
    // Note: Usei o endpoint do seu projeto, mas com o estilo do professor
    return this.http.post<any>(this.endpoint + "registar", new LoginModel(username, password));
  }

  // Método auxiliar para os guards e outros componentes
  isLoggedIn(): boolean {
    return localStorage.getItem('currentUser') !== null;
  }
}
