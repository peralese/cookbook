document.addEventListener('DOMContentLoaded', () => {
  const searchBox = document.getElementById('searchBox');
  const listItems = document.querySelectorAll('#categoriesList li');

  searchBox.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();

    listItems.forEach(li => {
      const text = li.textContent.toLowerCase();
      li.style.display = text.includes(query) ? '' : 'none';
    });
  });
});
