(function() {
  const API_BASE = 'https://api.jeevajyothimedia.com/api/public';
  const DEFAULT_WHATSAPP_IMAGE = 'assets/images/whatsapp.png';
  const DEFAULT_WHATSAPP_LINK = 'https://wa.me/+918078864233';

  async function loadWhatsApp() {
    if (window.whatsappLoaded) return;
    window.whatsappLoaded = true;

    try {
      const [whatsappRes, contactRes] = await Promise.all([
        fetch(`${API_BASE}/whatsapp`),
        fetch(`${API_BASE}/contact`)
      ]);

      if (!whatsappRes.ok) throw new Error(`WhatsApp request failed (${whatsappRes.status})`);
      if (!contactRes.ok) throw new Error(`Contact request failed (${contactRes.status})`);

      const whatsappJson = await whatsappRes.json();
      const contactJson = await contactRes.json();

      const whatsappData = whatsappJson?.data ?? whatsappJson;
      const contactData = contactJson?.data ?? contactJson;

      const whatsappImage = whatsappData?.image || DEFAULT_WHATSAPP_IMAGE;
      const whatsappLink = contactData?.whatsapp || DEFAULT_WHATSAPP_LINK;

      // Footer WhatsApp
      const footerWhatsApp = document.getElementById('footerWhatsApp');
      if (footerWhatsApp) {
        footerWhatsApp.href = whatsappLink;
        const img = footerWhatsApp.querySelector('img') || footerWhatsApp;
        if (img && img.tagName === 'IMG') {
          img.src = whatsappImage;
          img.alt = 'Join WhatsApp Community';
        }
      }

      // Prominent community button (if present)
      const communityBtn = document.getElementById('whatsappCommunityBtn');
      if (communityBtn) {
        communityBtn.href = whatsappLink;
        const communityImg = document.getElementById('whatsappCommunityImg');
        if (communityImg) {
          communityImg.src = whatsappImage;
        }
      }

      // Large hero/community link (if present)
      const heroCommunityBtn = document.getElementById('leftAdLink2');
      void heroCommunityBtn;

    } catch (error) {
      console.warn('WhatsApp loader failed:', error);
      // User-friendly: keep existing UI/defaults without breaking layout.
    }
  }

  document.addEventListener('DOMContentLoaded', loadWhatsApp);
})();

