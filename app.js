// =========================================
// MY SONGBOOK - CORE LOGIC V4 (Editor & Translator)
// =========================================

const defaultSongs = [
    { id: "me-esta-doliendo", title: "Me Está Doliendo", artist: "Carin León", type: "cover", isFavorite: false, playCount: 0, lyrics: "G\nC  F\n  No quiero escribirle así que quítenme mi celular\nG  C                        G                Am\n Si saben bien cómo me pongo y me vuelven a invitar" }
];

let songDatabase = JSON.parse(localStorage.getItem('mySongbookDB')) || defaultSongs;
let currentSongId = null; 
let editingSongId = null;
let currentTypeFilter = 'all';
let currentFontSize = 20;

// SPA NAVIGATION
function navigateTo(viewId, songId = null) {
    document.querySelectorAll('.view-section').forEach(v => v.classList.add('hidden'));
    document.getElementById(viewId).classList.remove('hidden');
    window.scrollTo(0, 0);

    if (viewId !== 'song-view' && isScrolling) toggleScroll();
    
    // Limpiar Admin si no estamos editando
    if (viewId === 'admin-view' && !editingSongId) {
        document.getElementById('admin-view-title').innerText = "🛠 Admin Panel";
        document.getElementById('form-subtitle').innerText = "Add New Song";
        document.querySelector('.btn-save').innerText = "Save Song to My Songbook";
        document.getElementById('admin-title').value = '';
        document.getElementById('admin-artist').value = '';
        document.getElementById('admin-lyrics').value = '';
    }

    if (viewId === 'menu-view') { editingSongId = null; renderMenu(); }
    else if (viewId === 'song-view' && songId) loadSong(songId);
}

// LÓGICA DE TRADUCCIÓN INTELIGENTE (SOL -> G)
function safeTranslateLatinChords(text) {
    const latinRegexStr = "(DO|RE|MI|FA|SOL|LA|SI|Do|Re|Mi|Fa|Sol|La|Si)(#|b)?(m|M|maj|maj7|dim|dis|fadis|sus|sus4|4|7|74|-7|maj7)?(?:\\/[A-G][#b]?)?";
    const latinTest = new RegExp("^" + latinRegexStr + "$", "i");
    const dicc = {'do':'C', 're':'D', 'mi':'E', 'fa':'F', 'sol':'G', 'la':'A', 'si':'B'};

    return text.split('\n').map(line => {
        let words = line.trim().split(/\s+/);
        if (words.length === 0) return line;
        let possibleChords = 0;
        words.forEach(w => {
            let cleanW = w.replace(/[\(\)\[\],]/g, '');
            if (/^([A-G][#b]?.*)$/i.test(cleanW) || latinTest.test(cleanW)) possibleChords++;
        });
        // Si la línea es musical, reemplazamos notas latinas por anglas
        if ((possibleChords / words.length) >= 0.3) {
            return line.replace(new RegExp(latinRegexStr, "gi"), (match, nota) => {
                let suffix = match.substring(nota.length);
                return dicc[nota.toLowerCase()] + suffix;
            });
        }
        return line;
    }).join('\n');
}

// ADMIN PANEL: SAVE & UPDATE
function saveNewSong() {
    const title = document.getElementById('admin-title').value.trim();
    const artist = document.getElementById('admin-artist').value.trim();
    let lyrics = document.getElementById('admin-lyrics').value;
    const type = document.querySelector('input[name="song-type"]:checked').value;

    if (!title || !artist || !lyrics) { alert("Please fill all fields"); return; }

    // Traducir acordes antes de guardar
    lyrics = safeTranslateLatinChords(lyrics);

    if (editingSongId) {
        let index = songDatabase.findIndex(s => s.id === editingSongId);
        if(index !== -1) {
            songDatabase[index] = { ...songDatabase[index], title, artist, lyrics, type };
        }
    } else {
        const id = title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '') + '-' + Date.now();
        songDatabase.push({ id, title, artist, lyrics, type, isFavorite: false, playCount: 0 });
    }

    localStorage.setItem('mySongbookDB', JSON.stringify(songDatabase));
    alert("✨ Success!");
    navigateTo('menu-view');
}

function editCurrentSong() {
    const song = songDatabase.find(s => s.id === currentSongId);
    if (!song) return;
    editingSongId = currentSongId;
    document.getElementById('admin-view-title').innerText = "✏️ Edit Song";
    document.getElementById('form-subtitle').innerText = "Modify your lyrics or chords";
    document.querySelector('.btn-save').innerText = "Update Song";
    document.getElementById('admin-title').value = song.title;
    document.getElementById('admin-artist').value = song.artist;
    document.getElementById('admin-lyrics').value = song.lyrics;
    document.querySelector(`input[name="song-type"][value="${song.type}"]`).checked = true;
    navigateTo('admin-view');
}

// MENU & FILTERS
function renderMenu() {
    const container = document.getElementById('songs-list-container');
    container.innerHTML = '';
    let filtered = songDatabase;
    if (currentTypeFilter === 'favorite') filtered = songDatabase.filter(s => s.isFavorite);
    else if (currentTypeFilter !== 'all') filtered = songDatabase.filter(s => s.type === currentTypeFilter);
    
    filtered.forEach(song => {
        const a = document.createElement('a'); a.className = 'card'; a.href = "#";
        a.setAttribute('data-playcount', song.playCount || 0);
        a.onclick = (e) => { e.preventDefault(); navigateTo('song-view', song.id); };
        let badge = `<span class="badge badge-${song.type}">${song.type}</span>`;
        a.innerHTML = `<div class="card-header"><div><h2>${song.title}${badge}</h2><p>${song.artist}</p></div><button class="fav-btn" onclick="toggleFavorite('${song.id}', event)">${song.isFavorite?'❤️':'🤍'}</button></div>`;
        container.appendChild(a);
    });
    sortSongs();
}

function toggleFavorite(id, e) {
    e.stopPropagation();
    let s = songDatabase.find(x => x.id === id);
    if(s) { s.isFavorite = !s.isFavorite; localStorage.setItem('mySongbookDB', JSON.stringify(songDatabase)); renderMenu(); }
}

function sortSongs() {
    const container = document.getElementById('songs-list-container');
    const cards = Array.from(container.getElementsByClassName('card'));
    const criteria = document.getElementById('sort-select').value;
    cards.sort((a,b) => {
        if(criteria==='popular') return b.getAttribute('data-playcount') - a.getAttribute('data-playcount');
        let tA = a.innerText.toLowerCase(), tB = b.innerText.toLowerCase();
        return tA.localeCompare(tB);
    });
    cards.forEach(c => container.appendChild(c));
}

// SONG VIEWER
function loadSong(id) {
    const song = songDatabase.find(s => s.id === id);
    if (!song) return;
    song.playCount = (song.playCount || 0) + 1;
    localStorage.setItem('mySongbookDB', JSON.stringify(songDatabase));
    currentSongId = id;
    document.getElementById('display-title').innerText = `${song.title} - ${song.artist}`;
    const lyricsBox = document.getElementById('lyrics-container');
    lyricsBox.style.fontSize = currentFontSize + "px";

    const chordRegex = /(^|\s|\(|\[)([A-G][#b]?(?:m|M|maj|maj7|dim|dis|fadis|sus|sus4|4|7|74|-7|maj7)?(?:\/[A-G][#b]?)?)(?=\s|$|\)|\]|,)/gi;
    lyricsBox.innerHTML = song.lyrics.split('\n').map(line => {
        if (line.trim().split(/\s+/).filter(w => /^([A-G][#b]?.*)$/i.test(w.replace(/[\(\)\[\],]/g,''))).length / line.trim().split(/\s+/).length >= 0.3) {
            return line.replace(chordRegex, '$1<span class="chord">$2</span>');
        }
        return line;
    }).join('\n');

    document.querySelectorAll('.chord').forEach(s => s.onclick = function() { showDiagram(this.innerText); });
}

// HELPERS (Font, Theme, Scroll, Transpose, Modal)
function changeFontSize(d) { currentFontSize = Math.min(40, Math.max(14, currentFontSize + d)); document.getElementById('lyrics-container').style.fontSize = currentFontSize + "px"; }
function toggleTheme() { document.body.classList.toggle('dark-mode'); localStorage.setItem('theme', document.body.classList.contains('dark-mode')?'dark':'light'); }
function searchFilter() { let q = document.getElementById('search-bar').value.toLowerCase(); document.querySelectorAll('.card').forEach(c => c.style.display = c.innerText.toLowerCase().includes(q)?"":"none"); }
function filterByType(t, b) { currentTypeFilter = t; document.querySelectorAll('.filter-tab').forEach(x => x.classList.remove('active')); b.classList.add('active'); renderMenu(); }
function changeView(v) { document.getElementById('songs-list-container').className = v==='list'?'songs-list':'songs-grid'; document.getElementById('btn-list').classList.toggle('active', v==='list'); document.getElementById('btn-grid').classList.toggle('active', v==='grid'); }
function deleteCurrentSong() { if(confirm("Delete?")) { songDatabase = songDatabase.filter(s=>s.id!==currentSongId); localStorage.setItem('mySongbookDB', JSON.stringify(songDatabase)); navigateTo('menu-view'); } }

let isScrolling = false, speedLevel = 3, scrollSpeed = 0.45, animationId, positionY = 0;
function animateScroll() { if(isScrolling) { positionY += speedLevel * 0.15; window.scrollTo(0, positionY); animationId = requestAnimationFrame(animateScroll); } }
function toggleScroll() { isScrolling = !isScrolling; document.getElementById('btn-play').innerText = isScrolling?"Pause":"Start"; document.getElementById('btn-play').classList.toggle('paused', isScrolling); if(isScrolling) { positionY = window.scrollY; animateScroll(); } else cancelAnimationFrame(animationId); }
function changeSpeed(d) { speedLevel = Math.min(10, Math.max(1, speedLevel + d)); document.getElementById('speed-text').innerText = speedLevel; }

const scale = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
function transposeChords(s) { document.querySelectorAll('.chord').forEach(span => { let m = span.innerText.match(/^([CDEFGAB][#b]?)(.*)$/i); if(m) { let idx = scale.indexOf(m[1].toUpperCase().replace('DB','C#').replace('EB','D#').replace('GB','F#').replace('AB','G#').replace('BB','A#')); if(idx!==-1) span.innerText = scale[(idx+s+12)%12] + m[2]; } }); }

const chordDictionary = { 'C':[-1,3,2,0,1,0], 'Cm':[-1,3,5,5,4,3], 'D':[-1,-1,0,2,3,2], 'Dm':[-1,-1,0,2,3,1], 'E':[0,2,2,1,0,0], 'Em':[0,2,2,0,0,0], 'F':[1,3,3,2,1,1], 'G':[3,2,0,0,0,3], 'A':[-1,0,2,2,2,0], 'Am':[-1,0,2,2,1,0], 'B':[-1,2,4,4,4,2], 'Bm':[-1,2,4,4,3,2] };
function showDiagram(c) {
    let clean = c.trim(); document.getElementById('modal-title').innerText = clean;
    const cont = document.getElementById('diagram-container');
    let p = chordDictionary[clean];
    if(!p) cont.innerHTML = "Diagram N/A";
    else {
        let html = '<div class="open-strings">' + p.map(x => x===-1?'X':x===0?'O':'&nbsp;').join('') + '</div><div class="fretboard">';
        for(let i=0; i<4; i++) html += '<div class="fret"></div>';
        p.forEach((v,i) => { if(v>0) html += `<div class="dot" style="top:${(v-0.5)*25}%; left:${i*20}%"></div>`; });
        cont.innerHTML = html + '</div>';
    }
    document.getElementById('chord-modal').style.display = 'flex';
}
function closeModal() { document.getElementById('chord-modal').style.display = 'none'; }
document.addEventListener('DOMContentLoaded', () => { if(localStorage.getItem('theme')==='dark') toggleTheme(); navigateTo('menu-view'); });
