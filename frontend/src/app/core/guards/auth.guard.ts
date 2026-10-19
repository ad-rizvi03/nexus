import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { map } from 'rxjs';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isCheckingAuth()) {
    return authService.isAuthenticated() ? true : router.parseUrl('/login');
  }

  return authService.checkInitialAuth().pipe(
    map((isAuthenticated) => (isAuthenticated ? true : router.parseUrl('/login')))
  );
};
