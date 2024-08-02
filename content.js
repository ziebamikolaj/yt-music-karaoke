let lyricsContainer;
let currentSong = "";
let currentArtist = "";
let lyrics = [];
let currentLyricIndex = 0;
let timeOffset = 0;
let lyricsCacheMap = new Map();

let fontSizeIndex = 1; // 0: small, 1: medium, 2: large
let autoScroll = true;
const fontSizes = ["18px", "24px", "32px"];

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "setFontSize") {
    fontSizeIndex = request.size;
    updateFontSize();
    chrome.storage.sync.set({ fontSizeIndex: fontSizeIndex });
  } else if (request.action === "setAutoScroll") {
    autoScroll = request.enabled;
    chrome.storage.sync.set({ autoScroll: autoScroll });
  }
});

function updateFontSize() {
  lyricsContainer.style.fontSize = fontSizes[fontSizeIndex];
}

function loadSettings() {
  chrome.storage.sync.get(["fontSizeIndex", "autoScroll"], (result) => {
    if (result.fontSizeIndex !== undefined) {
      fontSizeIndex = result.fontSizeIndex;
      updateFontSize();
    }
    if (result.autoScroll !== undefined) {
      autoScroll = result.autoScroll;
    }
  });
}

function initKaraokeMode() {
  createLyricsContainer();
  fetchAndDisplayLyrics();
  observeSongChange();
  updateKaraokePosition(); // This will now set up the event listeners
}

function createLyricsContainer() {
  lyricsContainer = document.createElement("div");
  lyricsContainer.id = "karaoke-lyrics";
  lyricsContainer.style.display = "none";
  lyricsContainer.setAttribute("aria-live", "polite");
  lyricsContainer.setAttribute("aria-label", "Karaoke lyrics");
  document.body.appendChild(lyricsContainer);

  setTimeout(updateKaraokePosition, 1000);
}

function updateKaraokePosition() {
  const covers = document.querySelectorAll("#song-media-window");
  const albumCoverMobile = covers[0];
  const albumCoverDesktop = covers[covers.length - 1];

  function updatePosition(albumCover) {
    if (albumCover && lyricsContainer && albumCover.offsetWidth > 0 && albumCover.offsetHeight > 0) {
      const rect = albumCover.getBoundingClientRect();
      lyricsContainer.style.left = `${rect.left}px`;
      lyricsContainer.style.top = `${rect.top}px`;
      lyricsContainer.style.width = `${rect.width}px`;
      lyricsContainer.style.height = `${rect.height}px`;
      lyricsContainer.style.maxHeight = `${rect.height}px`;
      lyricsContainer.style.display = "block";
    } else {
      lyricsContainer.style.display = "none";
    }
  }

  function addEventListeners(element) {
    if (element) {
      // Create a ResizeObserver for size changes
      const resizeObserver = new ResizeObserver(() => {
        updatePosition(element);
      });
      resizeObserver.observe(element);

      // Use MutationObserver for position changes
      const mutationObserver = new MutationObserver((mutations) => {
        for (let mutation of mutations) {
          if (mutation.type === "attributes" && (mutation.attributeName === "style" || mutation.attributeName === "class")) {
            updatePosition(element);
            break;
          }
        }
      });
      mutationObserver.observe(element, { attributes: true });

      // Add scroll event listener to window
      window.addEventListener("scroll", () => {
        updatePosition(element);
      });
    }
  }

  // Add event listeners to both album covers
  addEventListeners(albumCoverMobile);
  addEventListeners(albumCoverDesktop);

  // Initial update
  if (albumCoverDesktop.offsetWidth > 0 && albumCoverDesktop.offsetHeight > 0) {
    updatePosition(albumCoverDesktop);
  } else {
    updatePosition(albumCoverMobile);
  }
}

function observeSongChange() {
  const titleObserver = new MutationObserver(fetchAndDisplayLyrics);
  const titleElement = document.querySelector(".title.ytmusic-player-bar");
  titleObserver.observe(titleElement, { childList: true, characterData: true, subtree: true });
  const artistObserver = new MutationObserver(fetchAndDisplayLyrics);
  const artistElement = document.querySelector(".byline.ytmusic-player-bar");

  console.log("Artist element:", artistElement);
  artistObserver.observe(artistElement, { childList: true, characterData: true, subtree: true });
}

function fetchAndDisplayLyrics() {
  const newSong = getSongTitle();
  const newArtist = getArtistName();

  console.log("Song:", newSong, "Artist:", newArtist);

  if (newSong !== currentSong || newArtist !== currentArtist) {
    currentSong = newSong;
    currentArtist = newArtist;
    lyrics = [];
    currentLyricIndex = 0;
    showLoadingSpinner();
    const videoElement = document.querySelectorAll("video")[0];
    if (videoElement) {
      timeOffset = videoElement.currentTime;
    }
    fetchLyrics(currentSong, currentArtist);
  }
}

function showLoadingSpinner() {
  lyricsContainer.innerHTML = '<div class="loading-spinner"></div>';
}

function getSongTitle() {
  const titleElement = document.querySelector(".title.ytmusic-player-bar");
  return titleElement ? titleElement.textContent.trim() : "";
}

function getArtistName() {
  const artistElement = document.querySelector(".byline.ytmusic-player-bar");
  return artistElement ? artistElement.textContent.split("•")[0].trim() : "";
}

function fetchLyrics(song, artist) {
  const cacheKey = `${song}-${artist}`;
  if (lyricsCacheMap.has(cacheKey)) {
    lyrics = lyricsCacheMap.get(cacheKey);
    displayLyrics();
    syncLyrics();
    return;
  }

  chrome.runtime.sendMessage({ action: "fetchLyrics", song, artist }, (response) => {
    if (response.lyrics && response.lyrics.length > 0) {
      lyrics = response.lyrics;
      lyrics.forEach((line) => {
        line.seconds += timeOffset;
      });
      lyricsCacheMap.set(cacheKey, lyrics);
      displayLyrics();
      syncLyrics();
    } else {
      console.error("Error fetching lyrics:", response.error);
      lyricsContainer.textContent = `Couldn't fetch lyrics for ${song} by ${artist}`;
      // Add a retry mechanism
      setTimeout(() => {
        fetchAndDisplayLyrics();
      }, 2000); // Retry after 2 seconds
    }
  });
}

function displayLyrics() {
  lyricsContainer.innerHTML = "";
  lyrics.forEach((line, index) => {
    const lineElement = document.createElement("div");
    lineElement.textContent = line.lyrics;
    lineElement.classList.add("lyric-line");
    lineElement.dataset.index = index;
    lineElement.dataset.time = line.seconds;
    lineElement.addEventListener("click", handleLyricClick);
    lyricsContainer.appendChild(lineElement);
  });
}

function handleLyricClick(event) {
  const clickedTime = parseFloat(event.target.dataset.time);
  if (isNaN(clickedTime)) return;

  const videoElement = document.querySelectorAll("video")[0];
  if (!videoElement) {
    console.error("Could not find video element");
    return;
  }

  videoElement.currentTime = clickedTime - 0.05;
  videoElement.play();
}

function syncLyrics() {
  const videos = document.querySelectorAll("video");
  const videoElement = videos[videos.length - 1];
  if (!videoElement) return;

  function updateLyrics() {
    try {
      updateKaraokePosition();
      const currentTime = videoElement.currentTime;
      const currentLine = lyrics.findIndex((line) => line.seconds > currentTime) - 1;

      if (currentLine !== currentLyricIndex) {
        const prevLine = lyricsContainer.querySelector(`[data-index="${currentLyricIndex}"]`);
        const nextLine = lyricsContainer.querySelector(`[data-index="${currentLine}"]`);

        if (prevLine) prevLine.classList.remove("active");
        if (nextLine) {
          nextLine.classList.add("active");
          if (autoScroll) {
            nextLine.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }

        currentLyricIndex = currentLine;
      }
    } catch (error) {
      console.error("Error in syncLyrics:", error);
    }

    requestAnimationFrame(updateLyrics);
  }

  updateLyrics();
}

function cleanup() {
  // Any cleanup logic if needed
}

// Initialize on page load
if (document.readyState === "complete" || document.readyState === "interactive") {
  initKaraokeMode();
} else {
  document.addEventListener("DOMContentLoaded", initKaraokeMode);
}

// Reposition karaoke container when navigating between pages
const appContainer = document.querySelector("ytmusic-app");
if (appContainer) {
  const appObserver = new MutationObserver(() => {
    setTimeout(updateKaraokePosition, 1000);
  });
  appObserver.observe(appContainer, { childList: true, subtree: true });
}

// Call cleanup function when extension is disabled or page is unloaded
window.addEventListener("beforeunload", cleanup);
