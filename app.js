// ==========================================================================
// MY SONGBOOK - CORE LOGIC V5 (Desktop & Mobile Unified Production)
// ==========================================================================

const defaultSongs = [
    {
        id: "quince-vueltas-al-sol", 
        title: "Quince Vueltas al Sol", 
        artist: "Armando Manzanero", 
        type: "original",
        style: "Bolerazo",
        isFavorite: true, 
        playCount: 5,
        lyrics: `Intro\nD\nG A F#m Bm Bm/A\nG A Bm\n\n      G          A\nLe bajé las estrellas tal cual\n                 F#m        Bm\nMe entregué como dice el manual, ah-ah\n      Bm/A   G          A\nCometió la osadía, decir que me quería\n            Bm\nMe hizo sentir especial.`
    },
    {
        id: "me-esta-doliendo", 
        title: "Me Está Doliendo", 
        artist: "Carin León", 
        type: "cover",
        style: "Regional",
        isFavorite: false, 
        playCount: 12,
        lyrics: `G\nC  F\n  No quiero escribirle así que quítenme mi celular\nG  C                         G                Am\n Si saben bien cómo me pongo y me vuelven a invitar`
    }
];

let songDatabase = JSON.parse(localStorage.getItem('mySongbookDB'));
if (!songDatabase) {
    songDatabase = defaultSongs;
}
localStorage.setItem('mySongbookDB', JSON.stringify(songDatabase));

let currentSongId = null; 
let currentTypeFilter = 'all';
let currentFontSize = 18; 
let currentViewType = 'grid'; // Control de vista base

// ==========================================================================
// 1. SPA NAVIGATION (Control de Vistas)
// ==========================================================================
function navigateTo(viewId, songId = null) {
    document.getElementById('menu-view').classList.add('hidden');
    document.getElementById('song-view').classList.add('hidden');
    document.getElementById('admin-view').classList.add('hidden');
    
    const targetView = document.getElementById(viewId);
    if (targetView) targetView.classList.remove('hidden');
    
    window.scrollTo(0, 0);
    if (viewId !== 'song-view' && isScrolling) toggleScroll();
    
    if (viewId === 'menu-view') renderMenu();
    else if (viewId === 'song-view' && songId) loadSong(songId);
}

// ==========================================================================
// 2. HOMEPAGE: RENDER, FILTROS Y DROPDOWN
// ==========================================================================
function filterByType(type, btnElement) {
    currentTypeFilter = type;
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    btnElement.classList.add('active');
    renderMenu();
}

function toggleFavorite(songId, event) {
    event.stopPropagation();
    const song = songDatabase.find(s => s.id === songId);
    if (song) {
        song.isFavorite = !song.isFavorite;
        localStorage.setItem('mySongbookDB', JSON.stringify(songDatabase));
        renderMenu();
    }
}

function renderMenu() {
    const container = document.querySelector('.songs-container');
    if (!container) return;
    container.innerHTML = '';
    
    let songsToRender = songDatabase;
    if (currentTypeFilter === 'favorite') songsToRender = songDatabase.filter(song => song.isFavorite);
    else if (currentTypeFilter !== 'all') songsToRender = songDatabase.filter(song => song.type === currentTypeFilter);
    
    songsToRender.forEach(song => {
        const card = document.createElement('div');
        card.className = 'song-card';
        card.onclick = () => navigateTo('song-view', song.id);
        
        const themeClass = song.type === 'original' ? 'original-bg' : 'cover-bg';
        const badgeClass = song.type === 'original' ? 'original-badge' : 'cover-badge';
        const heartIcon = song.isFavorite ? 'fa-solid fa-heart' : 'fa-regular fa-heart';
        const iconType = song.type === 'original' ? 'fa-sun' : 'fa-bolt'; // Iconos dinámicos de Figma
        
        card.innerHTML = `
            <div class="card-body">
              <div class="card-artwork ${themeClass}">
                <i class="fa-solid ${iconType} artwork-icon"></i>
              </div>
              <div class="card-details">
                <div class="meta-row">
                  <span class="genre-badge ${badgeClass}">${song.type.toUpperCase()}</span>
                  <span class="style-label">${song.style || 'Song Style'}</span>
                  <button class="heart-btn" onclick="toggleFavorite('${song.id}', event)">
                    <i class="${heartIcon}"></i>
                  </button>
                </div>
                <h2 class="card-title">${song.title}</h2>
                <p class="card-artist">${song.artist}</p>
              </div>
            </div>
        `;
        container.appendChild(card);
    });
    
    applyViewStyle(); // Asegurar que use Grid o List según la selección
}

// Control del Dropdown Brutalista (Sort By)
document.addEventListener('click', (e) => {
    const dropdown = document.querySelector('.dropdown-container');
    const trigger = document.querySelector('.dropdown-trigger');
    if (!dropdown) return;
    
    if (trigger && trigger.contains(e.target)) {
        dropdown.classList.toggle('open');
    } else if (!dropdown.contains(e.target)) {
        dropdown.classList.remove('open');
    }
});

function sortSongs(criteria) {
    if (criteria === 'popular') {
        songDatabase.sort((a, b) => (b.playCount || 0) - (a.playCount || 0));
    } else if (criteria === 'title') {
        songDatabase.sort((a, b) => a.title.localeCompare(b.title));
    }
    renderMenu();
}

function changeView(viewType) {
    currentViewType = viewType;
    applyViewStyle();
}

function applyViewStyle() {
    const container = document.querySelector('.songs-container');
    const gridBtn = document.getElementById('btn-grid');
    const listBtn = document.getElementById('btn-list');
    if (!container) return;

    if (currentViewType === 'list') {
        container.className = 'songs-container songs-list';
        if (listBtn) listBtn.classList.add('active');
        if (gridBtn) gridBtn.classList.remove('active');
    } else {
        container.className = 'songs-container songs-grid';
        if (gridBtn) gridBtn.classList.add('active');
        if (listBtn) listBtn.classList.remove('active');
    }
}

// ==========================================================================
// 3. SONG VISOR (Letra y Formato Adaptable)
// ==========================================================================
function loadSong(songId) {
    const song = songDatabase.find(s => s.id === songId);
    if (!song) return;
    
    song.playCount = (song.playCount || 0) + 1;
    localStorage.setItem('mySongbookDB', JSON.stringify(songDatabase));
    currentSongId = songId;
    
    // Inyección de textos a la barra superior e interna
    document.querySelector('.header-song-meta h2').innerText = song.title;
    document.querySelector('.header-song-meta p').innerText = song.artist;
    
    const banner = document.querySelector('.song-banner-card');
    const themeClass = song.type === 'original' ? 'original-bg' : 'cover-bg';
    const badgeClass = song.type === 'original' ? 'original-badge' : 'cover-badge';
    const iconType = song.type === 'original' ? 'fa-sun' : 'fa-bolt';

    banner.innerHTML = `
      <div class="banner-artwork ${themeClass}">
        <i class="fa-solid ${iconType} banner-icon"></i>
      </div>
      <div class="banner-info">
        <span class="genre-badge ${badgeClass}">${song.type.toUpperCase()}</span>
        <span class="style-label">${song.style || 'Song Style'}</span>
        <h3>${song.title}</h3>
        <p>${song.artist}</p>
      </div>
    `;
    
    const canvas = document.querySelector('.lyrics-canvas');
    canvas.style.fontSize = currentFontSize + "px";
    canvas.className = `lyrics-canvas song-${song.type}`; // Activa la lógica Camaleón por CSS

    // Regex de formateo e inyección de acordes
    const chordRegexStr = "^([A-G][#b]?(?:m|M|maj|maj7|dim|dis|fadis|sus|sus4|4|7|74|-7|maj7)?(?:\\/[A-G][#b]?)?)$";
    const exactChordRegex = new RegExp(chordRegexStr, "i");
    const replaceRegex = /(^|\s|\(|\[)([A-G][#b]?(?:m|M|maj|maj7|dim|dis|fadis|sus|sus4|4|7|74|-7|maj7)?(?:\/[A-G][#b]?)?)(?=\s|$|\)|\]|,)/gi;

    let lines = song.lyrics.split('\n');
    let formattedLyrics = lines.map(line => {
        let words = line.trim().split(/\s+/);
        if(words.length === 0) return line;
        let chordCount = 0;
        words.forEach(w => { let cleanW = w.replace(/[\(\)\[\],]/g, ''); if (exactChordRegex.test(cleanW)) chordCount++; });
        if ((chordCount / words.length) >= 0.3) return line.replace(replaceRegex, '$1<span class="chord">$2</span>');
        return line;
    }).join('\n');

    canvas.innerHTML = formattedLyrics;
}

// ==========================================================================
// 4. SISTEMA DE AUTOSCROLL, AFINACIÓN Y TAMAÑO
// ==========================================================================
let isScrolling = false; let speedLevel = 3; let scrollSpeed = speedLevel * 0.15; let animationId; let positionY = 0; 
function animateScroll() { if (isScrolling) { positionY += scrollSpeed; window.scrollTo(0, positionY); if (Math.abs(window.scrollY - positionY) > 5) positionY = window.scrollY; animationId = requestAnimationFrame(animateScroll); } }

function toggleScroll() { 
    isScrolling = !isScrolling; 
    const playBtn = document.querySelector('.console-play-btn'); 
    if (!playBtn) return;
    if (isScrolling) { 
        playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>'; 
        positionY = window.scrollY; 
        animateScroll(); 
    } else { 
        playBtn.innerHTML = '<i class="fa-solid fa-play"></i>'; 
        cancelAnimationFrame(animationId); 
    } 
}

function changeFontSize(delta) {
    currentFontSize += delta;
    if (currentFontSize < 12) currentFontSize = 12;
    if (currentFontSize > 36) currentFontSize = 36;
    const canvas = document.querySelector('.lyrics-canvas');
    if (canvas) canvas.style.fontSize = currentFontSize + "px";
}

const scale = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
function transposeChords(steps) { 
    document.querySelectorAll('.chord').forEach(span => { 
        let match = span.innerText.match(/^([CDEFGAB][#b]?)(.*)$/i); 
        if (match) { 
            let note = match[1].toUpperCase().replace('DB','C#').replace('EB','D#').replace('GB','F#').replace('AB','G#').replace('BB','A#'); 
            let idx = scale.indexOf(note); 
            if (idx !== -1) span.innerText = scale[(idx + steps + 12) % 12] + match[2]; 
        } 
    }); 
}

function changeSpeed(change) { 
    speedLevel += change; 
    if (speedLevel < 1) speedLevel = 1; 
    if (speedLevel > 10) speedLevel = 10; 
    const txt = document.querySelector('.speed-value');
    if (txt) txt.innerText = speedLevel; 
    scrollSpeed = speedLevel * 0.15; 
}

// ==========================================================================
// 5. THEME SWITCHER (Light / Dark Mode)
// ==========================================================================
function loadTheme() {
    if (localStorage.getItem('theme') === 'dark') { 
        document.body.classList.add('dark-mode'); 
        document.querySelectorAll('.theme-btn').forEach(btn => btn.innerHTML = '<i class="fa-solid fa-sun"></i>'); 
    }
}
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.innerHTML = isDark ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
    });
}

// ==========================================================================
// 6. INITIALIZATION & INLINE TRIGGERS
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => { 
    loadTheme();
    
    // Conexión manual de botones estructurales para evitar el uso inline antiguo
    document.querySelectorAll('.theme-btn').forEach(btn => btn.onclick = toggleTheme);
    
    const gridBtn = document.getElementById('btn-grid');
    const listBtn = document.getElementById('btn-list');
    if (gridBtn) gridBtn.onclick = () => changeView('grid');
    if (listBtn) listBtn.onclick = () => changeView('list');
    
    // Acciones de consola
    const playBtn = document.querySelector('.console-play-btn');
    if (playBtn) playBtn.onclick = toggleScroll;
    
    const micros = document.querySelectorAll('.btn-micro');
    if (micros.length >= 6) {
        micros[0].onclick = () => changeFontSize(-2); // Text Size -
        micros[1].onclick = () => changeFontSize(2);  // Text Size +
        micros[2].onclick = () => transposeChords(-1); // Key -
        micros[3].onclick = () => transposeChords(1);  // Key +
        micros[4].onclick = () => changeSpeed(-1);     // Speed -
        micros[5].onclick = () => changeSpeed(1);      // Speed +
    }

    // Navegación manual temporal para pruebas de tus botones superiores
    document.querySelector('.app-header .icon-button').onclick = () => navigateTo('admin-view');
    document.querySelector('.mobile-fab').onclick = () => navigateTo('admin-view');
    
    const backButtons = document.querySelectorAll('.icon-button .fa-chevron-left');
    backButtons.forEach(icon => {
        icon.parentElement.onclick = () => navigateTo('menu-view');
    });

    renderMenu(); 
});
