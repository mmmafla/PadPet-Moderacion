let solicitudesOriginales = [];

// Cargar datos al iniciar
document.addEventListener('DOMContentLoaded', async () => {
  const { data, error } = await supabaseClient.rpc('get_solicitud');
  const container = document.getElementById('solicitudes');

  if (error || !data) {
    container.innerHTML = `<p class="text-red-600">Error al cargar solicitudes.</p>`;
    console.error(error);
    return;
  }

  solicitudesOriginales = data;
  aplicarFiltros();

  document.getElementById('estado-filter').addEventListener('change', aplicarFiltros);
  document.getElementById('rut-filter').addEventListener('input', aplicarFiltros);
});

function aplicarFiltros() {
  const estado = document.getElementById('estado-filter').value;
  const rut = document.getElementById('rut-filter').value.trim().toLowerCase();
  const container = document.getElementById('solicitudes');

  const filtradas = solicitudesOriginales.filter(s => {
    const matchEstado = estado === 'todos' || (s.estado_nombre && s.estado_nombre.toLowerCase() === estado);
    const matchRut = s.run_vet.toLowerCase().includes(rut);
    return matchEstado && matchRut;
  });

  container.innerHTML = '';

  if (filtradas.length === 0) {
    container.innerHTML = '<p class="text-center text-gray-600">No se encontraron solicitudes.</p>';
    return;
  }

  filtradas.forEach(s => container.appendChild(crearTarjeta(s)));
}

function crearTarjeta(solicitud) {
  console.log(solicitud);
  const wrapper = document.createElement('div');
  wrapper.className = 'bg-white rounded-xl shadow-md overflow-hidden transition hover:shadow-lg';
  const estadoNombre = solicitud.estado_nombre || 'Desconocido';
  const estadoColor = estadoNombre === 'Espera' ? 'text-yellow-600 bg-yellow-100'
                   : estadoNombre === 'Aceptada' ? 'text-green-600 bg-green-100'
                   : estadoNombre === 'Rechazada' ? 'text-red-600 bg-red-100'
                   : 'text-gray-600 bg-gray-200';
  const header = document.createElement('button');
  header.className = 'w-full text-left px-6 py-4 bg-gray-100 hover:bg-gray-200 flex justify-between items-center';
  header.addEventListener('click', () => toggleDropdown(solicitud.id_solicitud));

  header.innerHTML = `
    <div>
      <p class="font-semibold">RUN Veterinario: ${solicitud.run_vet}</p>
      <p class="text-sm text-gray-600">Fecha envío: ${new Date(solicitud.fecha_envio).toLocaleDateString()}</p>
    </div>
    <span class="px-3 py-1 rounded-full text-sm font-medium ${estadoColor}">${estadoNombre}</span>
  `;

  const detalle = document.createElement('div');
  detalle.id = `detalle-${solicitud.id_solicitud}`;
  detalle.className = 'hidden px-6 py-4 border-t space-y-2 bg-gray-50';

  detalle.innerHTML = `
    <p><strong>Nombre:</strong> ${solicitud.nombre_vet} ${solicitud.apellidos_vet}</p>
    <p><strong>Universidad:</strong> ${solicitud.nom_uni || '—'}</p>
    <p><strong>Especialidad:</strong> ${solicitud.nom_especialidad || '—'}</p>
    <p><strong>Año Titulación:</strong> ${solicitud.anno_titulacion || '—'}</p>
    <p><strong>País:</strong> ${solicitud.nom_pais || '—'}</p>
    <div>
      <strong>Certificado de Título:</strong><br>
      ${solicitud.foto_titulo ? `<a href="https://irorlonysbmkbdthvrmt.supabase.co/storage/v1/object/public/image-certificate/${solicitud.foto_titulo}" target="_blank" class="text-blue-600 underline hover:text-blue-800 transition">Ver certificado</a>` : 'No disponible'}
    </div>
    ${
      solicitud.estado === 'rechazada' && solicitud.comentario
        ? `<div class="bg-red-100 border border-red-300 text-red-700 p-3 rounded">
            <strong>Comentario:</strong> ${solicitud.comentario}
          </div>`
        : ''
    }
  `;

  // Botones si está en estado de espera (id 3)
  if (solicitud.estado_id === 3) {
    const botonesDiv = document.createElement('div');
    botonesDiv.className = 'flex flex-wrap gap-4 mt-4';

    const aprobarBtn = document.createElement('button');
    aprobarBtn.textContent = 'Aprobar';
    aprobarBtn.className = 'bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition';
    aprobarBtn.addEventListener('click', () => aprobarSolicitud(solicitud.id_solicitud));

    const rechazarBtn = document.createElement('button');
    rechazarBtn.textContent = 'Rechazar';
    rechazarBtn.className = 'bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition';
    rechazarBtn.addEventListener('click', () => rechazarSolicitud(solicitud.id_solicitud));

    botonesDiv.appendChild(aprobarBtn);
    botonesDiv.appendChild(rechazarBtn);
    detalle.appendChild(botonesDiv);
  }

  wrapper.appendChild(header);
  wrapper.appendChild(detalle);
  return wrapper;
}

function toggleDropdown(id) {
  document.querySelectorAll('[id^="detalle-"]').forEach(el => {
    if (el.id !== `detalle-${id}`) {
      el.classList.add('hidden');
    }
  });

  const selected = document.getElementById(`detalle-${id}`);
  if (!selected) return;
  selected.classList.toggle('hidden');
}

async function aprobarSolicitud(id) {
  const confirmacion = confirm('¿Deseas aprobar esta solicitud?');
  if (!confirmacion) return;

  const { error } = await supabaseClient.rpc('aprobar_solicitud', {
    id_solicitud_input: id
  });

  if (error) {
    alert('Error al aprobar');
    console.error(error);
    return;
  }
  alert('Solicitud aprobada');
  location.reload();
}

async function rechazarSolicitud(id) {
  const comentario = prompt('Ingresa un comentario para rechazar la solicitud:');
  if (!comentario) return;

  const { error } = await supabaseClient.rpc('rechazar_solicitud', {
    id_solicitud_input: id,
    comentario_input: comentario
  });

  if (error) {
    alert('Error al rechazar');
    console.error(error);
    return;
  }
  alert('Solicitud rechazada');
  location.reload();
}
