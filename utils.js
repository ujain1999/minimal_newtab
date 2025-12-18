function loadStylesheet(filename) {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = filename; // e.g., 'styles.css' or 'theme.css'
  document.head.appendChild(link);
}