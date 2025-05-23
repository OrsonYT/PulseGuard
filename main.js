const sites = [];
const sitesList = document.getElementById('sitesList');
const form = document.getElementById('addSiteForm');
const input = document.getElementById('siteUrl');
const alertSound = document.getElementById('alertSound');

const settingsBtn = document.getElementById('settingsBtn');
const settingsModal = document.getElementById('settingsModal');
const closeSettings = document.getElementById('closeSettings');
const soundAlertCheckbox = document.getElementById('soundAlert');
const refreshSlider = document.getElementById('refreshSlider');
const refreshValue = document.getElementById('refreshValue');

let downSites = new Set();
let refreshInterval = parseInt(refreshSlider.value, 10) * 1000 || 60000;
let intervalId = null;

// Fonction pour afficher la valeur du slider de façon "humaine"
function displayRefreshValue(val) {
    val = parseInt(val, 10);
    if (val < 60) return `${val} seconde${val > 1 ? 's' : ''}`;
    if (val % 60 === 0) return `${val / 60} minute${val >= 120 ? 's' : ''}`;
    return `${Math.floor(val/60)}min ${val%60}s`;
}
refreshValue.textContent = displayRefreshValue(refreshSlider.value);

// Slider dynamique
refreshSlider.addEventListener('input', () => {
    refreshValue.textContent = displayRefreshValue(refreshSlider.value);
});
refreshSlider.addEventListener('change', () => {
    refreshInterval = parseInt(refreshSlider.value, 10) * 1000;
    startInterval();
});

// Gestion modale paramètres
settingsBtn.onclick = () => settingsModal.style.display = "flex";
closeSettings.onclick = () => settingsModal.style.display = "none";
window.onclick = (e) => {
    if (e.target === settingsModal) settingsModal.style.display = "none";
};

// Ajout site
form.addEventListener('submit', (e) => {
    e.preventDefault();
    const url = input.value.trim();
    if (url && !sites.includes(url)) {
        sites.push(url);
        input.value = '';
        renderSites();
        checkSite(url);
    }
});

// Supprimer site
function removeSite(url) {
    const index = sites.indexOf(url);
    if (index > -1) {
        sites.splice(index, 1);
        downSites.delete(url);
        renderSites();
    }
}

// Vérifier statut avec badge animé et délai d'une seconde en jaune
async function checkSite(url) {
    const row = document.getElementById(`row-${btoa(url)}`);
    if (!row) return;
    const statusEl = row.querySelector('.status');
    // Icône jaune "attente"
    statusEl.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" style="vertical-align:middle;">
            <circle cx="12" cy="12" r="9" fill="#ffcc00" opacity="0.22"/>
            <circle cx="12" cy="12" r="5" fill="#ffcc00"/>
        </svg>
        <span>Vérif...</span>
    `;
    statusEl.className = 'status status-wait';

    setTimeout(async () => {
        try {
            await fetch(url, { method: 'HEAD', mode: 'no-cors' });
            statusEl.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" style="vertical-align:middle;">
                    <circle cx="12" cy="12" r="9" fill="#38d34a" opacity="0.22"/>
                    <circle cx="12" cy="12" r="5" fill="#38d34a"/>
                </svg>
                <span>UP</span>
            `;
            statusEl.className = 'status status-up';
            downSites.delete(url);
        } catch (err) {
            statusEl.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" style="vertical-align:middle;">
                    <circle cx="12" cy="12" r="9" fill="#e74c3c" opacity="0.22"/>
                    <circle cx="12" cy="12" r="5" fill="#e74c3c"/>
                </svg>
                <span>DOWN</span>
            `;
            statusEl.className = 'status status-down';
            if (!downSites.has(url) && soundAlertCheckbox.checked) {
                alertSound.currentTime = 0;
                alertSound.play();
            }
            downSites.add(url);
        }
    }, 1000);
}

// Affichage avec id unique
function renderSites() {
    sitesList.innerHTML = '';
    for (const url of sites) {
        const row = document.createElement('div');
        row.className = 'site-row';
        row.id = `row-${btoa(url)}`;
        row.innerHTML = `
            <span>${url}</span>
            <span class="status"></span>
            <button class="remove-btn" title="Supprimer" onclick="removeSite('${url}')">X</button>
        `;
        sitesList.appendChild(row);
    }
    sites.forEach(checkSite);
}

// Gestion rafraîchissement dynamique
function startInterval() {
    if (intervalId) clearInterval(intervalId);
    intervalId = setInterval(() => {
        sites.forEach(checkSite);
    }, refreshInterval);
}
// Premier lancement
startInterval();

window.removeSite = removeSite;