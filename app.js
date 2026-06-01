// =========================================
// MY SONGBOOK - CORE LOGIC V4 (Smart Dark Mode Edition)
// =========================================

const defaultSongs = [
    {
        id: "me-esta-doliendo", title: "Me Está Doliendo", artist: "Carin León", type: "cover",
        isFavorite: false, playCount: 0,
        lyrics: `G\nC  F\n  No quiero escribirle así que quítenme mi celular\nG  C                         G                Am\n Si saben bien cómo me pongo y me vuelven a invitar`
    }
];

let songDatabase = JSON.parse(localStorage.getItem('mySongbookDB'));
if (!songDatabase) {
    songDatabase = defaultSongs;
} else {
    songDatabase = songDatabase.map(song => ({
        ...song,
        isFavorite: song.isFavorite !== undefined ? song.isFavorite : false,
        songType: song.songType !== undefined ? song.songType : song.type, // Fallback de herencia
        playCount: song.playCount !== undefined ? song.playCount : 0,
        type: song.type || 'cover'
    }));
}
localStorage.setItem('mySongbookDB', JSON.stringify(songDatabase));

let currentSongId = null; 
let currentTypeFilter = 'all';
let currentFontSize = 20; 

// SPA NAVIGATION
function navigateTo(viewId, songId = null) {
    document.getElementById('menu-view').classList.add('hidden');
    document.getElementById('song-view').classList.add('hidden');
    document.getElementById('admin-view').classList.add('hidden');
    document.getElementById(viewId).classList.remove('hidden');
    window.scrollTo(0, 0);
    
    // UX Fix: Asegurar que el panel de ajustes se cierre al salir de la canción
    const settingsPanel = document.getElementById('settings-panel');
    if (settingsPanel) settingsPanel.classList.remove('open');

    if (viewId !== 'song-view' && isScrolling) toggleScroll();
    if (viewId === 'menu-view') renderMenu();
    else if (viewId === 'song-view' && songId) loadSong(songId);
}

// MENU & FILTERS
function filterByType(type, btnElement) {
    currentTypeFilter = type;
    document.querySelectorAll('.filter-tab').forEach(btn => btn.classList.remove('active'));
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
    const container = document.getElementById('songs-list-container');
    container.innerHTML = '';
    let songsToRender = songDatabase;
    if (currentTypeFilter === 'favorite') songsToRender = songDatabase.filter(song => song.isFavorite);
    else if (currentTypeFilter !== 'all') songsToRender = songDatabase.filter(song => song.type === currentTypeFilter);
    
    songsToRender.forEach(song => {
        const a = document.createElement('a');
        a.href = "#"; a.className = 'card';
        a.setAttribute('data-playcount', song.playCount || 0);
        a.onclick = (e) => { e.preventDefault(); navigateTo('song-view', song.id); };
        let badge = song.type === 'original' ? '<span class="badge badge-original">Original</span>' : '<span class="badge badge-cover">Cover</span>';
        let heartIcon = song.isFavorite ? '❤️' : '🤍';
        a.innerHTML = `<div class="card-header"><div><h2 class="song-title">${song.title} ${badge}</h2><p class="song-artist">${song.artist}</p></div><button class="fav-btn" onclick="toggleFavorite('${song.id}', event)">${heartIcon}</button></div>`;
        container.appendChild(a);
    });
    sortSongs();
    searchFilter();
}

function searchFilter() {
    let input = document.getElementById('search-bar').value.toLowerCase();
    let cards = document.getElementsByClassName('card');
    for (let i = 0; i < cards.length; i++) cards[i].style.display = cards[i].innerText.toLowerCase().includes(input) ? "" : "none";
}

function changeView(viewType) {
    const container = document.getElementById('songs-list-container');
    if (viewType === 'list') { container.className = 'songs-list'; document.getElementById('btn-list').classList.add('active'); document.getElementById('btn-grid').classList.remove('active'); }
    else { container.className = 'songs-grid'; document.getElementById('btn-grid').classList.add('active'); document.getElementById('btn-list').classList.remove('active'); }
}

function sortSongs() {
    const container = document.getElementById('songs-list-container');
    const cards = Array.from(container.getElementsByClassName('card'));
    const criteria = document.getElementById('sort-select').value;
    cards.sort((a, b) => {
        if (criteria === 'popular') return b.getAttribute('data-playcount') - a.getAttribute('data-playcount');
        const valA = a.querySelector(criteria === 'title' ? '.song-title' : '.song-artist').innerText.toLowerCase();
        const valB = b.querySelector(criteria === 'title' ? '.song-title' : '.song-artist').innerText.toLowerCase();
        return valA.localeCompare(valB);
    });
    container.innerHTML = '';
    cards.forEach(c => container.appendChild(c));
}

// ADMIN PANEL: TRADUCTOR INTELIGENTE
function normalizeLyrics(text) {
    const latinToAmerican = {
        'DO': 'C', 'RE': 'D', 'MI': 'E', 'FA': 'F', 
        'SOL': 'G', 'LA': 'A', 'SI': 'B'
    };

    let lines = text.split('\n');
    let processedLines = lines.map(line => {
        let words = line.trim().split(/\s+/);
        if(words.length === 0) return line;
        
        let chordCount = 0;
        const chordTestRegex = /^(DO|RE|MI|FA|SOL|LA|SI|C|D|E|F|G|A|B)[#b]?(m|min|maj|dim|aug|sus|add|[\d\/\w]*)*$/i;
        
        words.forEach(w => {
            let cleanW = w.replace(/[\(\)\[\],]/g, '');
            if (chordTestRegex.test(cleanW)) chordCount++;
        });

        if ((chordCount / words.length) >= 0.3) {
            let parts = line.split(/(\s+)/); 
            let translatedParts = parts.map(part => {
                if (!part.trim()) return part; 
                return part.replace(/(^|\/)(DO|RE|MI|FA|SOL|LA|SI)/gi, (match, prefix, note) => {
                    return prefix + latinToAmerican[note.toUpperCase()];
                });
            });
            return translatedParts.join('');
        }
        return line;
    });
    return processedLines.join('\n');
}

function saveNewSong() {
    const title = document.getElementById('admin-title').value.trim();
    const artist = document.getElementById('admin-artist').value.trim();
    let lyrics = document.getElementById('admin-lyrics').value; 
    const type = document.querySelector('input[name="song-type"]:checked').value;
    
    if (!title || !artist || !lyrics) { alert("Please fill all fields"); return; }
    
    lyrics = normalizeLyrics(lyrics);
    const id = title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '') + '-' + Date.now();
    const newSong = { id, title, artist, lyrics, type, isFavorite: false, playCount: 0 };
    
    songDatabase.push(newSong);
    localStorage.setItem('mySongbookDB', JSON.stringify(songDatabase));
    
    document.getElementById('admin-title').value = '';
    document.getElementById('admin-artist').value = '';
    document.getElementById('admin-lyrics').value = '';
    document.querySelector('input[value="cover"]').checked = true; 
    
    alert("✨ " + type.toUpperCase() + " saved successfully!");
    navigateTo('menu-view');
}

// SONG VIEWER
function loadSong(songId) {
    const song = songDatabase.find(s => s.id === songId);
    if (!song) return;
    song.playCount = (song.playCount || 0) + 1;
    localStorage.setItem('mySongbookDB', JSON.stringify(songDatabase));
    currentSongId = songId;
    
    // Inyección de título y artista estructurado
    document.getElementById('display-title').innerText = song.title;
    document.getElementById('display-artist').innerText = song.artist;
    
    const lyricsContainer = document.getElementById('lyrics-container');
    lyricsContainer.style.fontSize = currentFontSize + "px";

    // UX FIX: Inyectar dinámicamente la clase correspondiente al tipo de canción
    // Esto es lo que activa la magia de colores lila/melocotón en CSS exclusivamente en Dark Mode
    lyricsContainer.className = ''; // Resetear clases previas
    if (song.type === 'original') {
        lyricsContainer.classList.add('song-original');
    } else {
        lyricsContainer.classList.add('song-cover');
    }

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

    lyricsContainer.innerHTML = formattedLyrics;
    document.querySelectorAll('.chord').forEach(span => { span.onclick = function() { showDiagram(this.innerText); }; });
}

function deleteCurrentSong() {
    if (!currentSongId) return;
    if (confirm("Delete this song?")) { songDatabase = songDatabase.filter(s => s.id !== currentSongId); localStorage.setItem('mySongbookDB', JSON.stringify(songDatabase)); navigateTo('menu-view'); }
}

// INLINE EDITOR
function toggleEditMode() {
    const song = songDatabase.find(s => s.id === currentSongId);
    if (!song) return;
    
    document.getElementById('lyrics-container').classList.add('hidden');
    document.getElementById('edit-container').classList.remove('hidden');
    document.getElementById('edit-lyrics').value = song.lyrics;
}

function cancelEdit() {
    document.getElementById('edit-container').classList.add('hidden');
    document.getElementById('lyrics-container').classList.remove('hidden');
}

function saveEdit() {
    const newLyrics = document.getElementById('edit-lyrics').value;
    const song = songDatabase.find(s => s.id === currentSongId);
    
    if (song) {
        song.lyrics = normalizeLyrics(newLyrics);
        localStorage.setItem('mySongbookDB', JSON.stringify(songDatabase));
        cancelEdit();
        loadSong(song.id);
    }
}

// ACCESSIBILITY & HELPERS
function changeFontSize(delta) {
    currentFontSize += delta;
    if (currentFontSize < 14) currentFontSize = 14;
    if (currentFontSize > 40) currentFontSize = 40;
    const lyricsContainer = document.getElementById('lyrics-container');
    if (lyricsContainer) lyricsContainer.style.fontSize = currentFontSize + "px";
}

function loadTheme() {
    if (localStorage.getItem('theme') === 'dark') { 
        document.body.classList.add('dark-mode'); 
        document.querySelectorAll('button[onclick="toggleTheme()"]').forEach(btn => btn.innerHTML = '<i class="fa-solid fa-sun"></i>'); 
    }
}

function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    
    // Sincroniza los íconos globales con las fuentes de FontAwesome instaladas
    document.querySelectorAll('button[onclick="toggleTheme()"]').forEach(btn => {
        btn.innerHTML = isDark ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
    });
}

// AUTOSCROLL SYSTEM
let isScrolling = false; let speedLevel = 3; let scrollSpeed = speedLevel * 0.15; let animationId; let positionY = 0; 
function animateScroll() { if (isScrolling) { positionY += scrollSpeed; window.scrollTo(0, positionY); if (Math.abs(window.scrollY - positionY) > 5) positionY = window.scrollY; animationId = requestAnimationFrame(animateScroll); } }

function toggleScroll() { 
    isScrolling = !isScrolling; 
    const playBtn = document.getElementById('btn-play'); 
    if (isScrolling) { 
        playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>'; 
        playBtn.classList.add("paused"); 
        positionY = window.scrollY; 
        animateScroll(); 
    } else { 
        playBtn.innerHTML = '<i class="fa-solid fa-play"></i>'; 
        playBtn.classList.remove("paused"); 
        cancelAnimationFrame(animationId); 
    } 
}

function changeSpeed(change) { 
    speedLevel += change; 
    if (speedLevel < 1) speedLevel = 1; 
    if (speedLevel > 10) speedLevel = 10; 
    document.getElementById('speed-text').innerText = speedLevel; 
    scrollSpeed = speedLevel * 0.15; 
}

const scale = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
function transposeChords(steps) { document.querySelectorAll('.chord').forEach(span => { let match = span.innerText.match(/^([CDEFGAB][#b]?)(.*)$/i); if (match) { let note = match[1].toUpperCase().replace('DB','C#').replace('EB','D#').replace('GB','F#').replace('AB','G#').replace('BB','A#'); let idx = scale.indexOf(note); if (idx !== -1) span.innerText = scale[(idx + steps + 12) % 12] + match[2]; } }); }

// FRETS DICTIONARY & MODAL DIAGRAMS
const chordDictionary = {
    'C': [-1,3,2,0,1,0], 'Cm': [-1,3,5,5,4,3], 'C7': [-1,3,2,3,1,0], 'C#': [-1,4,6,6,6,4], 'C#m': [-1,4,6,6,5,4], 'C#m7': [-1,4,6,4,5,4],
    'D': [-1,-1,0,2,3,2], 'Dm': [-1,-1,0,2,3,1], 'D7': [-1,-1,0,2,1,2], 'D#': [-1,6,8,8,8,6], 'D#m': [-1,6,8,8,7,6], 'D/F#': [2,0,0,2,3,2],
    'E': [0,2,2,1,0,0], 'Em': [0,2,2,0,0,0], 'E7': [0,2,0,1,0,0], 'Em7': [0,2,2,0,3,0], 'E74': [0,2,0,2,0,0],
    'F': [1,3,3,2,1,1], 'Fm': [1,3,3,1,1,1], 'F#': [2,4,4,3,2,2], 'F#m': [2,4,4,2,2,2], 'F#7': [2,4,2,3,2,2], 'F#m7': [2,4,2,2,2,2], 'Fdim': [-1,-1,4,5,4,5], 'Fadis': [-1,-1,4,5,4,5],
    'G': [3,2,0,0,0,3], 'Gm': [3,5,5,3,3,3], 'G7': [3,2,0,0,0,1], 'G#': [4,6,6,5,4,4], 'G#m': [4,6,6,4,4,4], 'G#7': [4,6,4,5,4,4], 'G74': [3,5,3,5,3,3],
    'A': [-1,0,2,2,2,0], 'Am': [-1,0,2,2,1,0], 'A7': [-1,0,2,0,2,0], 'Asus4': [-1,0,2,2,3,0], 'A4': [-1,0,2,2,3,0], 'Am7': [-1,0,2,0,1,0], 'Amaj7': [-1,0,2,1,2,0], 'A7M': [-1,0,2,1,2,0], 'A#': [-1,1,3,3,3,1], 'A#m': [-1,1,3,3,2,1],
    'B': [-1,2,4,4,4,2], 'Bm': [-1,2,4,4,3,2], 'B7': [-1,2,1,2,0,2], 'B-7': [-1,2,4,2,3,2], 'Bm7': [-1,2,4,2,3,2], 'B4': [-1,2,4,4,5,2]
};

function showDiagram(chordText) {
    let cleanChord = chordText.trim(); document.getElementById('modal-title').innerText = cleanChord; const container = document.getElementById('diagram-container'); let positions = chordDictionary[cleanChord];
    if(!positions) { container.innerHTML = "<p>Diagram not available.</p>"; } 
    else {
        let fretted = positions.filter(p => p > 0); let minFret = fretted.length > 0 ? Math.min(...fretted) : 0; let offset = (minFret > 3) ? minFret - 1 : 0;
        let html = '<div class="open-strings">'; positions.forEach(p => { if (p === -1) html += '<span>X</span>'; else if (p === 0) html += '<span>O</span>'; else html += '<span>&nbsp;</span>'; });
        html += '</div><div class="fretboard-wrap"><div class="fretboard"><div class="string-lines">'; for(let i=0; i<6; i++) html += '<div class="string-line"></div>'; html += '</div>'; for(let i=0; i<4; i++) html += '<div class="fret"></div>';
        positions.forEach((p, index) => { if(p > 0) { let relativeFret = p - offset; let y = (relativeFret - 0.5) * 25; let x = index * 20; html += `<div class="dot" style="top:${y}%; left:${x}%;"></div>`; } });
        html += '</div>'; if(offset > 0) html += `<div class="fret-number">${minFret}fr</div>`; html += '</div>'; container.innerHTML = html;
    }
    document.getElementById('chord-modal').style.display = 'flex';
}
function closeModal() { document.getElementById('chord-modal').style.display = 'none'; }
document.addEventListener('DOMContentLoaded', () => { loadTheme(); navigateTo('menu-view'); });
