import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, tap, map, BehaviorSubject } from 'rxjs';
import { API_URL } from '../app.config';
import { LoginDTO } from '../models/login.dto';
import { RegisterDTO } from '../models/register.dto';
import { LoginResponseDTO, UserDTO, UserResponseDTO } from '../models/user.dto';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private endpoint = `${API_URL}/auth/`;
  private currentUserSubject = new BehaviorSubject<UserDTO | null>(
    JSON.parse(localStorage.getItem('currentUser') || 'null'),
  );

  public isLoggedIn$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {}

  login(email: string, password: string): Observable<UserDTO> {
    const loginData: LoginDTO = { email, password };

    return this.http.post<LoginResponseDTO>(this.endpoint + 'login', loginData).pipe(
      map((res) => Object.assign({}, res.user, { token: res.token })),
      tap((user) => {
        localStorage.setItem('currentUser', JSON.stringify(user));
        this.currentUserSubject.next(user);
      }),
    );
  }

  logout(): void {
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
  }

  register(data: RegisterDTO): Observable<RegisterDTO> {
    return this.http.post<RegisterDTO>(this.endpoint + 'registar', data);
  }

  updateProfile(data: Partial<UserDTO>): Observable<UserDTO> {
    const userId = this.currentUserSubject.value?._id;
    return this.http.patch<UserResponseDTO>(`${API_URL}/users/${userId}`, data).pipe(
      map((res) => res.user),
      tap((updatedUser) => {
        const current = this.currentUserSubject.value;

        if (current) {
          const newUser = Object.assign({}, current, updatedUser);
          localStorage.setItem('currentUser', JSON.stringify(newUser));
          this.currentUserSubject.next(newUser);
        }
      }),
    );
  }

  getCurrentUser(): Observable<UserDTO> {
    const user = this.currentUserSubject.value;
    return of(user as UserDTO);
  }

  isLoggedIn(): boolean {
    return localStorage.getItem('currentUser') !== null;
  }
}
