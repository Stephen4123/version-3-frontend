(async function() {
  if (window.videosLoaded) return;
  window.videosLoaded = true;
  try {
    let videos = [];
    if (window.WorkerData && window.WorkerData.fetchWorkerJson) {
      videos = await window.WorkerData.fetchWorkerJson('videos', []);
    }
    if (!Array.isArray(videos) || !videos.length) {
      const response = await fetch('https://api.jeevajyothimedia.com/api/public/videos');
      if (!response.ok) throw new Error('Failed to load videos data');
      const json = await response.json();
      videos = Array.isArray(json?.data) ? json.data : json;
    }

    const videoGrid = document.getElementById('videoGrid');
    if (!videoGrid) return;

    videoGrid.innerHTML = ''; // Clear existing content

    // Function to extract Google Drive file ID from URL
    function extractDriveFileId(url) {
      if (!url) return null;
      const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
      return match ? match[1] : null;
    }

    videos.forEach((video, index) => {
      const div = document.createElement('div');
      div.className = 'video-card';

      const fileId = extractDriveFileId(video.link);

      if (fileId && video.link.includes('drive.google.com')) {
        const iframe = document.createElement('iframe');
        iframe.src = `https://drive.google.com/file/d/${fileId}/preview`;
        iframe.width = '100%';
        iframe.frameBorder = '0';
        iframe.allow = 'autoplay; encrypted-media';
        iframe.allowFullscreen = true;
        div.appendChild(iframe);
      } else {
        const thumb = document.createElement('div');
        thumb.className = 'video-thumb';

        const img = document.createElement('img');
        img.src = video.image;
        img.alt = `Video ${index + 1}`;
        img.loading = 'lazy';

        const overlay = document.createElement('div');
        overlay.className = 'video-play-overlay';
        overlay.innerHTML = `<div class="video-play-icon"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></div>`;

        thumb.appendChild(img);
        thumb.appendChild(overlay);
        div.appendChild(thumb);

        // Clicking the thumbnail also opens the link
        thumb.style.cursor = 'pointer';
        thumb.addEventListener('click', () => window.open(video.link, '_blank', 'noopener'));
      }

      videoGrid.appendChild(div);
    });

  } catch (error) {
    console.warn('Videos loader failed:', error);
  }
})();







