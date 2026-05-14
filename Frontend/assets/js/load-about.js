(async function() {
  if (window.aboutLoaded) return;
  window.aboutLoaded = true;
  try {
    let data = null;
    if (window.WorkerData && window.WorkerData.fetchWorkerJson) {
      data = await window.WorkerData.fetchWorkerJson('about', null);
    }
    if (!data) {
      const response = await fetch('https://api.jeevajyothimedia.com/api/public/about');
      if (!response.ok) throw new Error('Failed to load about data');
      data = await response.json();
    }

    // Update about content
    const aboutContent = document.getElementById('aboutContent');
    if (aboutContent && data.contentHtml) {
      aboutContent.innerHTML = data.contentHtml;
      // Highlight brand name in about content
      aboutContent.innerHTML = aboutContent.innerHTML.replace(/Jeevajyothi Media/g, '<span class="brand-highlight">$&</span>');
    }

  } catch (error) {
    console.error('About loader failed:', error);
    // Fallback: show error message
    const aboutContent = document.getElementById('aboutContent');
    if (aboutContent) {
      aboutContent.innerHTML = '<p style="color: var(--error);">Unable to load about content. Please try again later.</p>';
    }
  }
})();



