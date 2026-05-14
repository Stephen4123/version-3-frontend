// Bible Verse Display - Random Malayalam verse on each refresh
(function() {
  async function loadBibleVerses() {
    try {
      const response = await fetch('data/bible-verses.js?t=' + Date.now());
      const text = await response.text();
      // Parse the JS module text to extract bibleVerses array
      const scriptMatch = text.match(/const bibleVerses = (\[[\s\S]*?\]);/);
      if (scriptMatch) {
        const verses = eval(scriptMatch[1]); // Safe eval of array
        return Array.isArray(verses) ? verses : null;
      }
      return null;
    } catch (error) {
      console.warn('Bible verses load failed:', error);
      // Fallback verses
      return [
        { text: "ദൈവം സർവ്വലോകത്തെ താൻ സ്നേഹിച്ചു...", reference: "യോഹന്നാൻ 3:16" }
      ];
    }
  }

  function displayRandomVerse(verses) {
    if (!verses || !Array.isArray(verses) || verses.length === 0) return;

    const randomIndex = Math.floor(Math.random() * verses.length);
    const verse = verses[randomIndex];

    const verseTextEl = document.getElementById('verse-text');
    const verseRefEl = document.getElementById('verse-reference');

    if (verseTextEl && verseRefEl && verse.text) {
      verseTextEl.textContent = verse.text;
      verseRefEl.textContent = '— ' + (verse.reference || 'പരിശുദ്ധ ലിഖിതം');
    }
  }

  // Load and display on DOM ready
  function initBibleVerse() {
    loadBibleVerses().then(displayRandomVerse).catch(console.error);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBibleVerse);
  } else {
    initBibleVerse();
  }
})();

