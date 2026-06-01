document.addEventListener('DOMContentLoaded', () => {
  
  // ELEMENTOS DEL DOM
  const themeToggleBtn = document.querySelector('.id-theme-toggle');
  const themeIcon = themeToggleBtn.querySelector('i');
  
  const settingsPanel = document.getElementById('settingsPanel');
  const openPanelBtn = document.getElementById('openPanelBtn');
  const closePanelBtn = document.getElementById('closePanelBtn');
  
  const lyricsContainer = document.querySelector('.lyrics-container');
  const textIncreaseBtn = document.getElementById('textIncrease');
  const textDecreaseBtn = document.getElementById('textDecrease');

  /* ==========================================================================
     1. SWITCH MANUAL DEL DARK MODE 🌙/☀️
     ========================================================================== */
  themeToggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark-theme');
    
    // Cambiamos el icono del botón para dar feedback visual
    if (document.body.classList.contains('dark-theme')) {
      themeIcon.classList.remove('fa-moon');
      themeIcon.classList.add('fa-sun');
    } else {
      themeIcon.classList.remove('fa-sun');
      themeIcon.classList.add('fa-moon');
    }
  });

  /* ==========================================================================
     2. CONTROL DEL ACTION PANEL FLOTANTE (Settings)
     ========================================================================== */
  openPanelBtn.addEventListener('click', () => {
    settingsPanel.classList.add('open');
  });

  closePanelBtn.addEventListener('click', () => {
    settingsPanel.classList.remove('open');
  });

  /* ==========================================================================
     3. FUNCIONALIDAD DEL TAMAÑO DE LETRA (Micro Interacción de ejemplo)
     ========================================================================== */
  let currentFontSize = 15; // Tamaño base en píxeles

  textIncreaseBtn.addEventListener('click', () => {
    if (currentFontSize < 24) { // Límite máximo para no romper layout
      currentFontSize += 2;
      lyricsContainer.style.fontSize = `${currentFontSize}px`;
      // Ajustamos también el tamaño de los acordes proporcionalmente
      document.querySelectorAll('.chord').forEach(chord => {
        chord.style.fontSize = `${currentFontSize}px`;
      });
    }
  });

  textDecreaseBtn.addEventListener('click', () => {
    if (currentFontSize > 11) { // Límite mínimo legible
      currentFontSize -= 2;
      lyricsContainer.style.fontSize = `${currentFontSize}px`;
      document.querySelectorAll('.chord').forEach(chord => {
        chord.style.fontSize = `${currentFontSize}px`;
      });
    }
  });

});
