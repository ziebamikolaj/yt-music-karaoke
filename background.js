chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "fetchLyrics") {
    fetchLyrics(request.song, request.artist)
      .then((lyrics) => sendResponse({ lyrics }))
      .catch((error) => {
        console.error("Lyrics fetch error:", error);
        sendResponse({ error: error.message });
      });
    return true; // Indicates that the response is asynchronous
  }
});

async function fetchLyrics(song, artist) {
  if (!song || !artist) {
    throw new Error("Song or artist is missing");
  }

  const query = encodeURIComponent(`${artist} ${song}`);
  const url = `API_URL/api/lyrics?q=${query}`;

  console.log("Fetching lyrics for:", song, "by", artist);
  console.log("API URL:", url);

  try {
    const response = await fetch(url, {
      cf: {
        ssl: false,
      },
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log("API response:", data);

    if (Array.isArray(data) && data.length > 0) {
      return data;
    } else {
      throw new Error("No lyrics available");
    }
  } catch (error) {
    console.error("Fetch error:", error);
    throw new Error("Failed to fetch lyrics. Please try again later.");
  }
}
