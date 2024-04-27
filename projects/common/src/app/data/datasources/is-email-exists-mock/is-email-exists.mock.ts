import { Injectable } from '@angular/core';
import { IsEmailExistsResponse } from '@common/domain/entities/is-email-exists/is-email-exists.entity';
import { IsEmailExistsRepository } from '@common/domain/repositories/is-email-exists/is-email-exists.repository';
import { Observable, delay, of } from 'rxjs';

@Injectable()
export class IsEmailExistsMock implements IsEmailExistsRepository {
  execute(email: string): Observable<IsEmailExistsResponse> {
    const hasEmail = this.data.has(email);

    if (!hasEmail) {
      return of<IsEmailExistsResponse>({
        ok: false,
        errorCode: 'email-not-found',
      }).pipe(delay(1000));
    }

    return of<IsEmailExistsResponse>({ ok: true }).pipe(delay(1000));
  }

  private data: Set<string> = new Set(['a@gmail.com']);
}