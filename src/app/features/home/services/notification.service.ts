import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Notification } from '../models/notification.models';
import { authHeaders } from './auth-headers';

const BASE = 'http://localhost:8000/api/v1/notificacoes';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly http = inject(HttpClient);

  list(clientId: number): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${BASE}/pendentes/${clientId}`, { headers: authHeaders() });
  }

  markAsRead(id: number): Observable<Notification> {
    return this.http.patch<Notification>(`${BASE}/${id}/lida`, {}, { headers: authHeaders() });
  }
}
