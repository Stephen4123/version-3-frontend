const SCREENSHOT_BLOCK_ID = 'screenshot-blocker-overlay';

function createScreenshotOverlay() {
  let overlay = document.getElementById(SCREENSHOT_BLOCK_ID);
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = SCREENSHOT_BLOCK_ID;
    Object.assign(overlay.style, {
      position: 'fixed',
      inset: '0',
      backgroundColor: 'rgba(0, 0, 0, 0.95)',
      pointerEvents: 'none',
      opacity: '0',
      transition: 'opacity 120ms ease',
      zIndex: '999999999',
    });
    document.body.appendChild(overlay);
  }
  return overlay;
}

function flashScreenshotOverlay() {
  const overlay = createScreenshotOverlay();
  overlay.style.opacity = '1';
  setTimeout(() => {
    overlay.style.opacity = '0';
  }, 150);
}

// Disable right-click context menu
document.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  return false;
});

// Disable copy, paste, cut keyboard shortcuts and screenshot keys
document.addEventListener('keydown', (e) => {
  // Disable Ctrl+C, Ctrl+X, Ctrl+V (Windows/Linux)
  if (e.ctrlKey && (e.key === 'c' || e.key === 'C' || e.key === 'x' || e.key === 'X' || e.key === 'v' || e.key === 'V')) {
    e.preventDefault();
    return false;
  }
  
  // Disable Cmd+C, Cmd+X, Cmd+V (Mac)
  if (e.metaKey && (e.key === 'c' || e.key === 'C' || e.key === 'x' || e.key === 'X' || e.key === 'v' || e.key === 'V')) {
    e.preventDefault();
    return false;
  }

  if (
    e.key === 'PrintScreen' ||
    e.key === 'PrintScr' ||
    e.keyCode === 44 ||
    (e.metaKey && e.shiftKey && (e.key === '4' || e.key === '5')) ||
    (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 's') ||
    (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'p')
  ) {
    e.preventDefault();
    flashScreenshotOverlay();
    return false;
  }
});

// Disable copy, cut, paste events
document.addEventListener('copy', (e) => {
  e.preventDefault();
  return false;
});

document.addEventListener('cut', (e) => {
  e.preventDefault();
  return false;
});

document.addEventListener('paste', (e) => {
  e.preventDefault();
  return false;
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    flashScreenshotOverlay();
  }
});

window.addEventListener('blur', () => {
  flashScreenshotOverlay();
});

// Disable drag and drop
document.addEventListener('dragstart', (e) => {
  e.preventDefault();
  return false;
});

document.addEventListener('drop', (e) => {
  e.preventDefault();
  return false;
});

// Disable text selection (optional - uncomment if needed)
// document.body.style.userSelect = 'none';
// document.body.style.webkitUserSelect = 'none';
// document.body.style.msUserSelect = 'none';

