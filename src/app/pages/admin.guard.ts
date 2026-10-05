import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { supabase } from './supabase';

export const adminGuard: CanActivateFn = async () => {
  const router = inject(Router);

  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    router.navigate(['/connexion']);
    return false;
  }

  const { data: admin, error } = await supabase
    .from('admins')
    .select('restaurant_id')
    .eq('user_id', session.user.id)
    .single();

  if (error || !admin) {
    router.navigate(['/bienvenue']);
    return false;
  }

  return true;
};