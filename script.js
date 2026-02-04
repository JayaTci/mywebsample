// Client-side form handling for contact form
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('contact-form');
  if (!form) return;
  const submitBtn = document.getElementById('contact-submit');
  const feedback = document.getElementById('contact-feedback');

  function showMessage(msg, type = 'info'){
    feedback.textContent = msg;
    feedback.className = 'contact-feedback ' + (type === 'success' ? 'success' : (type === 'error' ? 'error' : ''));
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    showMessage('Sending...', 'info');
    submitBtn.disabled = true;

    const payload = {
      name: document.getElementById('contact-name').value.trim(),
      email: document.getElementById('contact-email').value.trim(),
      phone: document.getElementById('contact-phone').value.trim(),
      subject: document.getElementById('contact-subject').value.trim(),
      message: document.getElementById('contact-message').value.trim(),
      hp: document.getElementById('contact-hp').value.trim()
    };

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showMessage('Thanks — your message was sent. I will get back to you soon!', 'success');
        form.reset();
      } else {
        showMessage((data && data.error) ? data.error : 'Failed to send message.', 'error');
      }
    } catch (err) {
      showMessage('Network error. Please try again later.', 'error');
    }

    submitBtn.disabled = false;
  });
});
