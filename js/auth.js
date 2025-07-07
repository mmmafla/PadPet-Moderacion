document.getElementById('login-form').addEventListener('submit', async function (e) {
  e.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  const { data, error } = await supabaseClient
    .from('moderador')
    .select('*')
    .eq('mail', email)
    .eq('pass', password)
    .single();

  if (error || !data) {
    document.getElementById('error-msg').textContent = 'Credenciales inválidas';
  } else {
    // Guardar sesión y redirigir
    localStorage.setItem('moderador_id', data.id);
    window.location.href = 'dashboard.html';
  }
});
