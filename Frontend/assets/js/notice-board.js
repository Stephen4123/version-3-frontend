class NoticeBoard {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.currentIndex = 0;
    this.notices = [];
    this.timer = null;
    this.autoRotateInterval = 5000; // 5 seconds
    this.isPaused = false;
    this.init();
  }

  async init() {
    try {
      const response = await fetch('https://api.jeevajyothimedia.com/api/public/notices');
      const json = await response.json();
      this.notices = Array.isArray(json?.data) ? json.data : (Array.isArray(json) ? json : []);
      if (this.notices.length > 0) {
        this.render();
        this.startAutoRotate();
        this.bindEvents();
      } else {
        this.showEmptyState();
      }
    } catch (error) {
      console.error('Failed to load notices:', error);
      this.showEmptyState();
    }
  }

  render() {
    this.container.innerHTML = `
      <div class="notice-hero">
        <div class="notice-image-container">
          ${this.notices.map((notice, index) => `
            <div class="notice-image ${index === 0 ? 'active' : ''}" id="notice-${index}">
              <img src="${notice.image}" alt="" loading="lazy">
            </div>
          `).join('')}
        </div>
        <div class="notice-nav">
          <button class="nav-btn prev-notice" aria-label="Previous">â€¹</button>
          <button class="nav-btn next-notice" aria-label="Next">â€º</button>
        </div>
        <div class="notice-indicators"></div>
        <div class="pause-btn">â¸</div>
      </div>
    `;
    this.renderIndicators();
  }

  renderIndicators() {
    const indicators = this.container.querySelector('.notice-indicators');
    indicators.innerHTML = this.notices.map((_, index) => 
      `<button class="indicator ${index === 0 ? 'active' : ''}" data-index="${index}"></button>`
    ).join('');
  }

  showEmptyState() {
    this.container.innerHTML = '<p class="empty-notice">No notices available at the moment.</p>';
  }

  startAutoRotate() {
    this.timer = setInterval(() => {
      if (!this.isPaused && this.notices.length > 1) {
        this.next();
      }
    }, this.autoRotateInterval);
  }

  pause() {
    this.isPaused = true;
    if (this.timer) clearInterval(this.timer);
  }

  resume() {
    this.isPaused = false;
    this.startAutoRotate();
  }

  next() {
    this.currentIndex = (this.currentIndex + 1) % this.notices.length;
    this.transitionTo(this.currentIndex);
  }

  prev() {
    this.currentIndex = (this.currentIndex - 1 + this.notices.length) % this.notices.length;
    this.transitionTo(this.currentIndex);
  }

  goTo(index) {
    this.currentIndex = index;
    this.transitionTo(index);
  }

  transitionTo(index) {
    const activeImage = this.container.querySelector('.notice-image.active');
    const newImage = this.container.querySelector(`#notice-${index}`);
    
    if (activeImage) activeImage.classList.remove('active');
    if (newImage) newImage.classList.add('active');

    const activeIndicator = this.container.querySelector('.indicator.active');
    const newIndicator = this.container.querySelector(`[data-index="${index}"]`);
    
    if (activeIndicator) activeIndicator.classList.remove('active');
    if (newIndicator) newIndicator.classList.add('active');
  }

  bindEvents() {
    // Navigation buttons
    this.container.querySelector('.next-notice')?.addEventListener('click', () => this.next());
    this.container.querySelector('.prev-notice')?.addEventListener('click', () => this.prev());

    // Indicators
    this.container.querySelectorAll('.indicator').forEach(indicator => {
      indicator.addEventListener('click', () => {
        const index = parseInt(indicator.dataset.index);
        this.goTo(index);
      });
    });

    // Pause/Resume
    this.container.querySelector('.pause-btn')?.addEventListener('click', () => {
      if (this.isPaused) {
        this.resume();
        this.container.querySelector('.pause-btn').textContent = 'â¸';
      } else {
        this.pause();
        this.container.querySelector('.pause-btn').textContent = 'â–¶';
      }
    });

    // Pause on hover
    this.container.addEventListener('mouseenter', () => this.pause());
    this.container.addEventListener('mouseleave', () => this.resume());
  }
}

// Initialize 2x2 grid NoticeBoard
document.addEventListener('DOMContentLoaded', () => {
  new NoticeBoard('notice-board-grid');
});





