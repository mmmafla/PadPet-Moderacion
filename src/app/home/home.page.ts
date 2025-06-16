import { Component, inject } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { SupabaseService } from 'src/app/services/supabase.service';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [IonicModule, ReactiveFormsModule, CommonModule]
})
export class HomePage {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private toastController = inject(ToastController);
  private supabaseService = inject(SupabaseService);

  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  loading = false;

  async presentToast(message: string, color: string = 'primary') {
    const toast = await this.toastController.create({
      message,
      duration: 2500,
      color,
      position: 'top',
    });
    await toast.present();
  }

  
  async login() {
    if (this.loginForm.invalid) return;

    this.loading = true;
    const { email, password } = this.loginForm.value;

    const { data, error } = await this.supabaseService.signInWithPassword(email, password);

    if (error || !data || !data.user) {
      this.loading = false;
      this.presentToast('Credenciales incorrectas o error de conexión.', 'danger');
      return;
    }

    const { data: mod, error: modError } = await this.supabaseService
      .getClient()
      .from('moderador')
      .select('*')
      .eq('id_auth', data.user.id)
      .single();

    if (modError || !mod) {
      this.loading = false;
      this.presentToast('No tienes permisos de moderador.', 'warning');
      return;
    }

    this.loading = false;
    this.router.navigateByUrl('/solicitudes');
  }

}
