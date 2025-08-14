// FILE: src/assets/js/fuse-search.js

// Basic debouncer
const debounce = (fn, ms = 150) => {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
};

document.addEventListener('DOMContentLoaded', async () => {
  const input = document.getElementById('searchInput');
  const resultsEl = document.getElementById('results');

  if (!input || !resultsEl) return;

  // Resolve index URL (pathPrefix-safe)
  const indexUrl = (typeof window !== 'undefined' && window.SEARCH_INDEX_URL)
    ? window.SEARCH_INDEX_URL
    : '/search-index.json';

  // Load index
  let index = [];
  try {
    const res = await fetch(indexUrl, { credentials: 'same-origin' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    index = await res.json();
  } catch (err) {
    console.error('Failed to load search index:', err);
    resultsEl.innerHTML = '<p>Search is temporarily unavailable.</p>';
    return;
  }

  // Configure Fuse
  const fuse = new Fuse(index, {
    includeScore: true,
    shouldSort: true,
    minMatchCharLength: 2,
    threshold: 0.35,          // fuzziness: lower = stricter
    ignoreLocation: true,
    keys: [
      { name: 'title',    weight: 0.7 },
      { name: 'tags',     weight: 0.2 },
      { name: 'category', weight: 0.1 }
    ]
  });

  const render = (items) => {
    if (!items.length) {
      resultsEl.innerHTML = '<p>No matches.</p>';
      return;
    }
    resultsEl.innerHTML = items.slice(0, 50).map(({ item, score }) => `
      <article class="py-3 border-b">
        <a href="${item.url}">
          <h3 class="m-0">${item.title}</h3>
        </a>
        <p class="m-0">
          <small>${item.category || ''}${item.tags?.length ? ' • ' + item.tags.join(', ') : ''}</small>
          <small style="opacity:.6">${typeof score === 'number' ? ' (score ' + score.toFixed(2) + ')' : ''}</small>
        </p>
      </article>
    `).join('');
  };

  const search = debounce(q => {
    q = q.trim();
    if (!q) { resultsEl.innerHTML = ''; return; }
    const results = fuse.search(q);
    render(results);
  });

  input.addEventListener('input', e => search(e.target.value));
});

