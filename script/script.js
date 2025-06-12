// script.js

// Chargement des données Spotify depuis le fichier JSON
fetch("data/data.json")
  .then((res) => res.json())
  .then((data) => {
    renderBarChart(data);         // Affiche le top 10 des artistes
    renderPieChart(data);         // Affiche la distribution des genres
    renderTrackTable(data);       // Affiche le tableau des 50 morceaux les plus populaires
    renderPopularAlbums(data);    // Affiche les albums les plus fréquents
  });

// === Graphique Barres - Top Artistes ===
function renderBarChart(data) {
  const artistCount = {};

  data.forEach((album) => {
    album.album.tracks.forEach((track) => {
      track.artists.forEach((artist) => {
        artistCount[artist.name] = (artistCount[artist.name] || 0) + 1;
      });
    });
  });

  const topArtists = Object.entries(artistCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const labels = topArtists.map(([name]) => name);
  const values = topArtists.map(([, count]) => count);

  new Chart(document.getElementById("barChart"), {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Nombre de morceaux",
          data: values,
          backgroundColor: "#4A90E2",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: "y",
      plugins: {
        title: {
          display: true,
          text: "Top 10 des artistes (nombre de morceaux)",
        },
        legend: { display: false },
      },
      scales: {
        x: {
          beginAtZero: true,
          title: {
            display: true,
            text: "Nombre de morceaux",
          },
        },
      },
    },
  });
}

// === Graphique Camembert - Genres ===
function renderPieChart(data) {
  const genreCount = {};

  data.forEach((album) => {
    album.artists.forEach((artist) => {
      (artist.genres || []).forEach((genre) => {
        genreCount[genre] = (genreCount[genre] || 0) + 1;
      });
    });
  });

  const sortedGenres = Object.entries(genreCount).sort((a, b) => b[1] - a[1]);
  const topGenres = sortedGenres.slice(0, 7);
  const otherCount = sortedGenres.slice(7).reduce((acc, [, count]) => acc + count, 0);

  const labels = topGenres.map(([genre]) => genre);
  const values = topGenres.map(([, count]) => count);

  if (otherCount > 0) {
    labels.push("Autres");
    values.push(otherCount);
  }

  if (values.length === 0) {
    document.getElementById("pieChart").parentElement.innerHTML +=
      "<p>Aucune donnée de genre trouvée.</p>";
    return;
  }

  const backgroundColors = labels.map((_, i) => `hsl(${(i * 360) / labels.length}, 70%, 60%)`);

  new Chart(document.getElementById("pieChart"), {
    type: "pie",
    data: {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: backgroundColors,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: "Distribution des genres musicaux",
        },
        legend: {
          position: "right",
        },
      },
    },
  });
}

// === Tableau des 50 morceaux les plus populaires ===
function renderTrackTable(tracks) {
  const tbody = document.querySelector("#trackTable tbody");
  const allTracks = [];

  tracks.forEach((track) => {
    allTracks.push({
      ...track,
      albumName: track.album?.name || "",
      albumImage: track.album?.images?.[0]?.url || "",
      albumRelease: track.album?.release_date || "",
      albumLink: track.album?.external_urls?.spotify || track.external_urls?.spotify || "",
      albumGenres: track.artists?.flatMap(a => a.genres || []) || [],
      preview_url: track.preview_url || null,
      external_urls: track.external_urls,
    });
  });

  allTracks.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
  const topTracks = allTracks.slice(0, 50);

  topTracks.forEach((track, index) => {
    const row = document.createElement("tr");

    const title = `<td>${track.name}</td>`;
    const artists = `<td>${track.artists?.map((a) => a.name).join(" / ") || ""}</td>`;
    const album = `<td>${track.albumName}</td>`;
    const action = `
      <td>
        <button class="btn btn-primary btn-sm" data-index="${index}" data-bs-toggle="modal" data-bs-target="#detailsModal">
          Détails
        </button>
      </td>`;

    row.innerHTML = title + artists + album + action;
    tbody.appendChild(row);
  });

  document.querySelectorAll("[data-bs-target='#detailsModal']").forEach((button) => {
    button.addEventListener("click", () => {
      const index = button.getAttribute("data-index");
      showTrackDetails(topTracks[index]);
    });
  });
}

// === Détails d'un morceau (modale) ===
function showTrackDetails(track) {
  const details = document.getElementById("detailsContent");

  const artists = track.artists.map((a) => `<strong>${a.name}</strong>`).join(", ");
  const genres = [...new Set(track.artists.flatMap(a => a.genres || []))]
    .map(g => `<span class="badge bg-secondary me-1">${g}</span>`)
    .join(" ");

  const duration = formatDuration(track.duration_ms);
  const explicit = track.explicit ? "Oui" : "Non";
  const popularity = track.popularity || 0;

  const audioPreview = track.preview_url
    ? `<audio controls src="${track.preview_url}" class="w-100 mb-3"></audio>`
    : "<p><em>Aucun aperçu audio disponible</em></p>";

  details.innerHTML = `
  <div class="row">
    <div class="col-md-4">
      <img src="${track.albumImage}" class="img-fluid rounded mb-3" alt="Album cover">
      <p><strong>Album :</strong> ${track.albumName}</p>
      <p><strong>Sortie :</strong> ${track.albumRelease}</p>
      <p><a href="${track.external_urls ? track.external_urls.spotify : track.albumLink}" target="_blank">Écouter sur Spotify</a></p>
      <p><strong>Popularité :</strong> ${popularity}/100</p>
    </div>
    <div class="col-md-8">
      <h5>${track.name}</h5>
      <p><strong>Extrait :</strong></p>
      ${audioPreview}
      <p><strong>Artiste(s) :</strong> ${artists}</p>
      <p><strong>Genres :</strong><br>${genres}</p>
      <p><strong>Durée :</strong> ${duration}</p>
      <p><strong>Numéro de piste :</strong> ${track.track_number}</p>
      <p><strong>Explicite :</strong> ${explicit}</p>
    </div>
  </div>`;
}

// === Section Albums Populaires (12 plus fréquents) ===
function renderPopularAlbums(albums) {
  const container = document.createElement("div");
  container.className = "mt-5";

  const albumCount = {};
  albums.forEach((album) => {
    const name = album.album.name;
    albumCount[name] = (albumCount[name] || 0) + album.album.tracks.length;
  });

  const sortedAlbums = Object.entries(albumCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12);

  const albumMap = {};
  albums.forEach((album) => {
    if (sortedAlbums.find(([name]) => name === album.album.name)) {
      albumMap[album.album.name] = album.album;
    }
  });

  container.innerHTML = '<h2 class="mb-4">Albums populaires</h2>';

  for (let i = 0; i < 2; i++) {
    const row = document.createElement("div");
    row.className = "row mb-4";
    for (let j = 0; j < 6; j++) {
      const [albumName] = sortedAlbums[i * 6 + j] || [];
      const album = albumMap[albumName];
      if (album) {
        const col = document.createElement("div");
        col.className = "col-md-2 text-center";
        col.innerHTML = `
          <img src="${album.images?.[0]?.url}" alt="${album.name}" class="img-fluid rounded mb-2">
          <p class="mb-0"><strong>${album.name}</strong></p>
          <p class="text-muted small">${album.artists.map(a => a.name).join(" / ")}</p>
        `;
        row.appendChild(col);
      }
    }
    container.appendChild(row);
  }

  document.querySelector("main").appendChild(container);
}

// Formatage de la durée (millisecondes -> mm:ss)
function formatDuration(ms) {
  const min = Math.floor(ms / 60000);
  const sec = Math.floor((ms % 60000) / 1000).toString().padStart(2, "0");
  return `${min}:${sec}`;
}
