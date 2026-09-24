import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { LoggedUser } from '../models/release.models';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly url = 'http://localhost:8000/api/v1/usuarios/me';

  getCurrentUser(): Observable<LoggedUser> {
    const token = typeof localStorage === 'undefined' ? null : localStorage.getItem('token');
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    return this.http.get<LoggedUser>(this.url, { headers });
  }
}
