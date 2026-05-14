(async function() {
  if (window.contactLoaded) return;
  window.contactLoaded = true;
  try {
    let data = null;
    if (window.WorkerData && window.WorkerData.fetchWorkerJson) {
      data = await window.WorkerData.fetchWorkerJson('contact', null);
    }
    if (!data) {
      const response = await fetch('http://localhost:3000/api/public/contact');
      if (!response.ok) throw new Error('Failed to load contact data');
      data = await response.json();
    }

    // Update contact phone
    const contactPhone = document.getElementById('contactPhone');
    if (contactPhone && data.phone) {
      contactPhone.textContent = data.phone;
    }

    // Update contact email
    const contactEmail = document.getElementById('contactEmail');
    if (contactEmail && data.email) {
      contactEmail.textContent = data.email;
    }

    // Update contact note
    const contactNote = document.getElementById('contactNote');
    if (contactNote && data.note) {
      contactNote.textContent = data.note;
    }

    // Update WhatsApp link
    const socialWhatsApp = document.getElementById('socialWhatsApp');
    if (socialWhatsApp && data.whatsapp) {
      socialWhatsApp.href = data.whatsapp;
    }

  } catch (error) {
    console.warn('Contact loader failed:', error);
  }
})();







