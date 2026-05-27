(function () {
  const ENDPOINT = 'https://script.google.com/macros/s/AKfycbyrxFtYtQev5yun9ogM2noWmDC4v-0TQ-1HpwDzF8Q1XwfVO0wiUzIl9WtTlV4lp5MGQg/exec';

  const form = document.getElementById('contact-form');
  const btn = document.getElementById('contact-submit');
  const status = document.getElementById('contact-status');
  const btnText = btn ? btn.textContent : '';

  function setStatus(msg, type) {
    if (!status) return;
    status.textContent = msg;
    status.classList.remove('hidden', 'text-green-600', 'text-red-600', 'text-gray-500');
    if (type === 'ok') status.classList.add('text-green-600');
    if (type === 'err') status.classList.add('text-red-600');
    if (type === 'info') status.classList.add('text-gray-500');
  }

  if (!form) return;

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Enviando...';
    setStatus('Enviando tus datos...', 'info');

    const data = {
      nombre: form.nombre.value.trim(),
      email: form.email.value.trim(),
      telefono: form.telefono.value.trim(),
      tarea: form.tarea.value.trim(),
      origen: location.hostname,
      fecha: new Date().toISOString(),
    };

    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error('HTTP ' + res.status);
      const json = await res.json().catch(() => ({}));
      if (json && json.ok === false) throw new Error(json.error || 'Error del servidor');

      form.reset();
      setStatus('¡Enviado con éxito! Te respondemos en menos de 24 h.', 'ok');
      btn.textContent = '¡Enviado!';
    } catch (err) {
      console.error(err);
      setStatus('No hemos podido enviarlo. Inténtalo de nuevo o escríbenos por WhatsApp.', 'err');
      btn.disabled = false;
      btn.textContent = btnText;
    }
  });
})();
