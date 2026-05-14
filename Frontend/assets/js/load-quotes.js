(async function() {
  if (window.quotesLoaded) return;
  window.quotesLoaded = true;
  try {
    let quotes = [];
    if (window.WorkerData && window.WorkerData.fetchWorkerJson) {
      quotes = await window.WorkerData.fetchWorkerJson('quotes', []);
    }
    if (!Array.isArray(quotes) || !quotes.length) {
      const response = await fetch('http://localhost:3000/api/public/quotes');
      if (!response.ok) throw new Error('Failed to load quotes data');
      const json = await response.json();
      quotes = Array.isArray(json?.data) ? json.data : json;
    }

    const quotesContainer = document.getElementById('quotesBlocks');
    if (!quotesContainer) return;

    quotesContainer.innerHTML = ''; // Clear existing content

    quotes.forEach(quote => {
      const div = document.createElement('div');
      div.className = 'quote-card';

      const quoteTitle = document.createElement('h3');
      quoteTitle.className = 'quote-title';
      quoteTitle.textContent = quote.title;

      const quoteText = document.createElement('p');
      quoteText.className = 'quote-text';
      quoteText.textContent = `"${quote.text}"`;

      div.appendChild(quoteTitle);
      div.appendChild(quoteText);
      quotesContainer.appendChild(div);
    });

  } catch (error) {
    console.warn('Quotes loader failed:', error);
  }
})();
