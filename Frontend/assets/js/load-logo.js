(async function() {
  if (window.logoLoaded) return;
  window.logoLoaded = true;
  try {
    let data = null;
    if (window.WorkerData && window.WorkerData.fetchWorkerJson) {
      data = await window.WorkerData.fetchWorkerJson('logo', null);
    }
    if (!data) {
      const response = await fetch('https://api.jeevajyothimedia.com/api/public/logo');
      if (!response.ok) throw new Error('Failed to load logo data');
      data = await response.json();
    }

    // Update logo image
    const logoImage = document.getElementById('logoImage');
    if (logoImage && data.image) {
      logoImage.src = data.image;
    }

    // Update logo content
    const logoContent = document.getElementById('logoContent');
    if (logoContent && data.contentHtml) {
      logoContent.innerHTML = data.contentHtml;
    }

  } catch (error) {
    console.warn('Logo loader failed:', error);
  }
})();







