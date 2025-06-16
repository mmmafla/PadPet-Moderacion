import { Component, OnInit, inject } from '@angular/core';
import { SupabaseService } from 'src/app/services/supabase.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // ✅ Asegúrate de importar esto
import { IonicModule, AlertController, ToastController } from '@ionic/angular';

@Component({
  selector: 'app-solicitudes',
  templateUrl: './solicitudes.page.html',
  styleUrls: ['./solicitudes.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,      // ✅ Agrégalo aquí
    IonicModule,
  ],
})
export class SolicitudesPage implements OnInit {
  private supabaseService = inject(SupabaseService);
  private alertController = inject(AlertController);
  private toastController = inject(ToastController);

  solicitudes: any[] = [];
  solicitudesFiltradas: any[] = [];

  filtroEstado: string = '';
  filtroRun: string = '';

  async ngOnInit() {
    await this.cargarSolicitudes();
  }

  async cargarSolicitudes() {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('solicitud')
      .select('*')
      .order('fecha_envio', { ascending: false });

    if (error) {
      console.error('❌ Error al cargar solicitudes:', error);
    } else {
      this.solicitudes = data;
      this.aplicarFiltros();
    }
  }

  aplicarFiltros() {
    this.solicitudesFiltradas = this.solicitudes.filter((s) => {
      const coincideEstado =
        this.filtroEstado === '' || s.estado === this.filtroEstado;

      const runVetStr = String(s.run_vet || '');
      const coincideRun = runVetStr.toLowerCase().includes(this.filtroRun.toLowerCase());


      return coincideEstado && coincideRun;
    });
    console.log('📦 Solicitudes desde Supabase:', this.solicitudes);
  }



  async aceptarSolicitud(id: number, runVet: string) {

    console.log('📦 ID recibido:', id);
    console.log('📦 RUN recibido:', runVet);
    const { error } = await this.supabaseService
      .getClient()
      .from('solicitud')
      .update({ estado: 'aceptada', comentario: null })
      .eq('id_solicitud', id);

    if (!error) {
      // Actualizar veterinario.estado_solicitud
      const { error: errorUpdate } = await this.supabaseService
        .getClient()
        .from('veterinario')
        .update({ estado_solicitud: 'aceptada' })
        .eq('run_vet', runVet);

      if (errorUpdate) {
        console.error('❌ Error al actualizar veterinario:', errorUpdate);
      }

      this.presentToast('Solicitud aceptada');
      await this.cargarSolicitudes();
    } else {
      this.presentToast('Error al aceptar', 'danger');
    }
  }


  async rechazarSolicitud(id: number, runVet: string) {
    const alert = await this.alertController.create({
      header: 'Rechazar solicitud',
      inputs: [
        {
          name: 'comentario',
          type: 'textarea',
          placeholder: 'Motivo del rechazo (opcional)',
        },
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Rechazar',
          handler: async (data) => {
            const { error } = await this.supabaseService
              .getClient()
              .from('solicitud')
              .update({ estado: 'rechazada', comentario: data.comentario || null })
              .eq('id_solicitud', id);

            if (!error) {
              // Actualizar veterinario.estado_solicitud
              const { error: errorUpdate } = await this.supabaseService
                .getClient()
                .from('veterinario')
                .update({ estado_solicitud: 'rechazada' })
                .eq('run_vet', runVet);

              if (errorUpdate) {
                console.error('❌ Error al actualizar veterinario:', errorUpdate);
              }

              this.presentToast('Solicitud rechazada');
              await this.cargarSolicitudes();
            } else {
              this.presentToast('Error al rechazar', 'danger');
            }
          },
        },
      ],
    });

    await alert.present();
  }

  async presentToast(message: string, color: string = 'primary') {
    const toast = await this.toastController.create({
      message,
      duration: 2500,
      color,
      position: 'top',
    });
    toast.present();
  }
}
