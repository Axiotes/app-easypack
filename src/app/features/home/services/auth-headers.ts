import { HttpHeaders } from '@angular/common/http';

export function authHeaders(): HttpHeaders | undefined {
  const token = typeof localStorage === 'undefined' ? null : localStorage.getItem('token');
  return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
}
