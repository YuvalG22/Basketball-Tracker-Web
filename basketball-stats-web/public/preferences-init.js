(() => {
  let language = 'he', theme = 'light';
  try {
    const savedLanguage = localStorage.getItem('basketball-language');
    const savedTheme = localStorage.getItem('basketball-theme');
    if (['he', 'en'].includes(savedLanguage)) language = savedLanguage;
    if (['light', 'dark', 'system'].includes(savedTheme)) theme = savedTheme;
  } catch { /* Private browsing may disable storage. */ }
  document.documentElement.lang = language;
  document.documentElement.dir = language === 'he' ? 'rtl' : 'ltr';
  document.documentElement.dataset.theme = theme === 'system' ? window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light' : theme;
})();
