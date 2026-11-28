import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { LogOperacao } from '../models/release.models';

const BASE = 'http://localhost:8000/api/v1';

@Injectable({ providedIn: 'root' })
export class LogService {
  private readonly http = inject(HttpClient);

  list(): Observable<LogOperacao[]> {
    return this.http.get<LogOperacao[]>(`${BASE}/logs`);
  }
}
