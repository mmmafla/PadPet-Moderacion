document.getElementById('upload-form').addEventListener('submit', function (e) {
  e.preventDefault();
  const tipo = document.getElementById('tipo-carga').value;
  const fileInput = document.getElementById('csv-file');
  const results = document.getElementById('results');
  results.innerHTML = '';

  if (!fileInput.files.length) {
    results.innerHTML = '<p class="text-red-600">Debes seleccionar un archivo CSV.</p>';
    return;
  }

  const file = fileInput.files[0];

  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete: async function (resultsCSV) {
      const data = resultsCSV.data;
      let exitos = 0;
      let errores = 0;

      for (let i = 0; i < data.length; i++) {
        const fila = data[i];

        // Limpieza: campos vacíos a null
        for (const key in fila) {
          if (fila[key] === '') fila[key] = null;
        }

        // Inserción según tipo
        let insertResult;
        if (tipo === 'tutor') {
          delete fila.id_tutor;
          insertResult = await supabaseClient.from('tutor').insert(fila);
        } else if (tipo === 'mascota') {
          delete fila.id_masc;
          insertResult = await supabaseClient.from('mascota').insert(fila);
        } else {
          errores++;
          results.insertAdjacentHTML('beforeend', `<div class="text-red-600">Tipo de carga no reconocido.</div>`);
          break;
        }

        const { error } = insertResult;

          if (error) {
            errores++;
            results.insertAdjacentHTML('beforeend', `
              <div class="text-red-600">
                ⚠️ Error en la fila ${i + 1}: No se pudo cargar la información. Verifica que los datos sean válidos.
              </div>
            `);
          } else {
            exitos++;
            results.insertAdjacentHTML('beforeend', `
              <div class="text-green-600">
                ✅ Fila ${i + 1} cargada correctamente.
              </div>
            `);
          }

      }

      // Resumen
      results.insertAdjacentHTML('afterbegin', `<div class="font-semibold">Insertados: ${exitos}, Errores: ${errores}</div>`);
    }
  });
});
