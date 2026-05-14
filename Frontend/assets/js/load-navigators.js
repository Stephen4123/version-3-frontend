(async function() {
  if (window.navigatorsLoaded) return;
  window.navigatorsLoaded = true;
  try {
    let data = null;
    if (window.WorkerData && window.WorkerData.fetchWorkerJson) {
      data = await window.WorkerData.fetchWorkerJson('navigators', null);
    }
    if (!data) {
      const response = await fetch('http://localhost:3000/api/public/navigators');
      if (!response.ok) throw new Error('Failed to load navigators data');
      data = await response.json();
    }

    // Update brand name in header
    const headerBrandName = document.getElementById('headerBrandName');
    if (headerBrandName && data.brandName) {
      headerBrandName.textContent = data.brandName;
    }

    // Update footer brand name
    const footerBrandName = document.getElementById('footerBrandName');
    if (footerBrandName && data.brandName) {
      footerBrandName.outerHTML = `<a id="footerBrandName" href="/" style="text-decoration: none; color: inherit;">${data.brandName}</a>`;
    }

    // Update footer text
    const footerText = document.getElementById('footerText');
    if (footerText && data.footerText) {
      footerText.textContent = data.footerText;
    }

    // Update social links
    const footerFacebook = document.getElementById('footerFacebook');
    const footerInstagram = document.getElementById('footerInstagram');
    const footerYouTube = document.getElementById('footerYouTube');

    if (footerFacebook && data.facebookLink) footerFacebook.href = data.facebookLink;
    if (footerInstagram && data.instagramLink) footerInstagram.href = data.instagramLink;
    if (footerYouTube && data.youtubeLink) footerYouTube.href = data.youtubeLink;

    // Update social image sources
    if (footerFacebook && data.facebookImage) {
      const img = footerFacebook.querySelector('img');
      if (img) img.src = data.facebookImage;
    }
    if (footerInstagram && data.instagramImage) {
      const img = footerInstagram.querySelector('img');
      if (img) img.src = data.instagramImage;
    }
    if (footerYouTube && data.youtubeImage) {
      const img = footerYouTube.querySelector('img');
      if (img) img.src = data.youtubeImage;
    }

    // Update social links in contact section if present
    const socialFacebook = document.getElementById('socialFacebook');
    const socialInstagram = document.getElementById('socialInstagram');
    const socialYouTube = document.getElementById('socialYouTube');
    const socialWhatsApp = document.getElementById('socialWhatsApp');

    if (socialFacebook && data.facebookLink) socialFacebook.href = data.facebookLink;
    if (socialInstagram && data.instagramLink) socialInstagram.href = data.instagramLink;
    if (socialYouTube && data.youtubeLink) socialYouTube.href = data.youtubeLink;

    // Update social image sources in contact section
    if (socialFacebook && data.facebookImage) {
      const img = socialFacebook.querySelector('img');
      if (img) img.src = data.facebookImage;
    }
    if (socialInstagram && data.instagramImage) {
      const img = socialInstagram.querySelector('img');
      if (img) img.src = data.instagramImage;
    }
    if (socialYouTube && data.youtubeImage) {
      const img = socialYouTube.querySelector('img');
      if (img) img.src = data.youtubeImage;
    }
    if (socialWhatsApp && data.whatsappImage) {
      const img = socialWhatsApp.querySelector('img');
      if (img) img.src = data.whatsappImage;
    }

    // Update YouTube button link if exists
    const watchBtn = document.querySelector('.watch-btn');
    if (watchBtn && data.youtubeBtnLink) {
      watchBtn.href = data.youtubeBtnLink;
    }

    // Update navigation items
    if (data.navItems) {
      const nav = document.querySelector('.nav');
      if (nav) {
        nav.innerHTML = '';
        const currentPath = window.location.pathname;
        const currentSearch = window.location.search;
        const currentHref = currentPath === '/' ? 'index.html' : currentPath.split('/').pop().split('?')[0]; // Remove query params

        data.navItems.filter(item => item.display !== false && item.display !== "false").forEach(item => {
          const a = document.createElement('a');
          a.href = item.href;
          a.textContent = item.name;

          // Check if current page matches this nav item or is a subpage
          let isCurrent = false;

          // Exact match (ignoring .html extension)
          if (item.href.split('.')[0] === currentHref.split('.')[0]) {
            isCurrent = true;
          }
          // Home page special cases
          else if (item.href === '/' && (currentPath === '/' || currentHref === 'index.html')) {
            isCurrent = true;
          }
          // Subpage matching
          else if (currentHref === 'news-article.html' && item.href === 'updates.html') {
            isCurrent = true;
          }

          if (isCurrent) {
            a.setAttribute('aria-current', 'page');
            a.classList.add('current'); // Add CSS class for additional styling
          }

          nav.appendChild(a);
        });

        // Apply highlighting after all navigation items are added
        const navLinks = nav.querySelectorAll('a');
        const currentPath2 = window.location.pathname;
        const currentHref2 = currentPath2 === '/' ? 'index.html' : currentPath2.split('/').pop().split('?')[0];

        navLinks.forEach(link => {
          const href = link.getAttribute('href');
          let shouldHighlight = false;

          if (href.split('.')[0] === currentHref2.split('.')[0]) {
            shouldHighlight = true;
          }
          else if (href === '/' && (currentPath2 === '/' || currentHref2 === 'index.html')) {
            shouldHighlight = true;
          }
          else if (currentHref2 === 'news-article.html' && href === 'updates.html') {
            shouldHighlight = true;
          }

          if (shouldHighlight) {
            link.setAttribute('aria-current', 'page');
            link.classList.add('current');
          } else {
            link.removeAttribute('aria-current');
            link.classList.remove('current');
          }
        });

      }
    }

    // Update mobile ads
    if (data.mobileAds) {
      const mobileAdsContainer = document.querySelector('.mobile-ads .grid.two');
      if (mobileAdsContainer) {
        mobileAdsContainer.innerHTML = '';
        data.mobileAds.forEach(ad => {
          const a = document.createElement('a');
          a.href = ad.link;
          a.className = 'ad-banner horizontal';
          const img = document.createElement('img');
          img.src = ad.image;
          img.alt = ad.alt;
          a.appendChild(img);
          mobileAdsContainer.appendChild(a);
        });
      }
    }

    // Update sidebar ads
    if (data.sidebarAds) {
      const leftAds = document.querySelectorAll('.sidebar-ad.left-ad .ad-banner.vertical');
      if (leftAds[0] && data.sidebarAds.left2) {
        leftAds[0].href = data.sidebarAds.left2.link;
        const img = leftAds[0].querySelector('img');
        if (img) {
          img.src = data.sidebarAds.left2.image;
          img.alt = data.sidebarAds.left2.alt;
        }
      }
      if (leftAds[1] && data.sidebarAds.left) {
        leftAds[1].href = data.sidebarAds.left.link;
        const img = leftAds[1].querySelector('img');
        if (img) {
          img.src = data.sidebarAds.left.image;
          img.alt = data.sidebarAds.left.alt;
        }
      }

      const rightAds = document.querySelectorAll('.sidebar-ad.right-ad .ad-banner.vertical');
      if (rightAds[0] && data.sidebarAds.right2) {
        rightAds[0].href = data.sidebarAds.right2.link;
        const img = rightAds[0].querySelector('img');
        if (img) {
          img.src = data.sidebarAds.right2.image;
          img.alt = data.sidebarAds.right2.alt;
        }
      }
      if (rightAds[1] && data.sidebarAds.right) {
        rightAds[1].href = data.sidebarAds.right.link;
        const img = rightAds[1].querySelector('img');
        if (img) {
          img.src = data.sidebarAds.right.image;
          img.alt = data.sidebarAds.right.alt;
        }
      }
    }

    // Update brand logo
    (window.WorkerData && window.WorkerData.fetchWorkerJson
      ? window.WorkerData.fetchWorkerJson('logo', null).then(logoData => {
          if (logoData && logoData.image) {
            const brandLogos = document.querySelectorAll('.brand-logo');
            brandLogos.forEach(img => img.src = logoData.image);
          }
        })
      : fetch('data/logo.json?v=202605071811')
          .then(response => response.ok ? response.json() : null)
          .then(logoData => {
            if (logoData && logoData.image) {
              const brandLogos = document.querySelectorAll('.brand-logo');
              brandLogos.forEach(img => img.src = logoData.image);
            }
          }))
      .catch(error => console.error('Error loading logo data:', error));

  } catch (error) {
    // Handle error silently
  }

  // Initialize ad modal functionality
  initializeAdModals();
})();

// Function to handle ad modal initialization and clicks
function initializeAdModals() {
  // Create modal element if it doesn't exist
  let adModal = document.getElementById('ad-modal');
  if (!adModal) {
    adModal = document.createElement('div');
    adModal.id = 'ad-modal';
    adModal.className = 'ad-modal';
    adModal.innerHTML = `
      <button class="ad-modal-close" aria-label="Close modal">&times;</button>
      <div class="ad-modal-content">
        <a id="ad-modal-link" href="#" target="_blank" rel="noopener noreferrer" style="display: block; cursor: pointer;">
          <img id="ad-modal-image" src="" alt="Advertisement">
        </a>
      </div>
    `;
    document.body.appendChild(adModal);
  }

  const modal = document.getElementById('ad-modal');
  const closeBtn = modal.querySelector('.ad-modal-close');
  const modalImage = modal.querySelector('#ad-modal-image');
  const modalLink = modal.querySelector('#ad-modal-link');

  // Add click handlers to all sidebar ad banners
  document.querySelectorAll('.sidebar-ad .ad-banner.vertical').forEach(banner => {
    banner.addEventListener('click', (e) => {
      const img = banner.querySelector('img');
      const link = banner.parentElement.href || banner.href;
      
      if (img && img.src) {
        e.preventDefault();
        e.stopPropagation();
        
        modalImage.src = img.src;
        if (link) {
          modalLink.href = link;
        }
        
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
      }
    });
  });

  // Close modal on close button click
  closeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    modal.classList.remove('active');
    document.body.style.overflow = '';
  });

  // Close modal on outside click (but not on the image/link)
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  });

  // Close modal on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  });
}



