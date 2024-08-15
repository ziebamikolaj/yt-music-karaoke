# YouTube Music Karaoke Extension

## Description

Enhance your YouTube Music experience with real-time karaoke lyrics! This Chrome extension seamlessly integrates with YouTube Music, displaying synchronized lyrics for the currently playing song. Perfect for sing-alongs or for those who want to follow along with their favorite tracks.

## Features

- Real-time lyrics synchronization with the current playing song
- Adjustable font size for better readability
- Auto-scroll option to follow the current lyric
- Click on any lyric line to jump to that part of the song
- Sleek, non-intrusive design that overlays on the album art

## Installation

1. Clone this repository or download the ZIP file.
2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable "Developer mode" in the top right corner.
4. Click "Load unpacked" and select the directory containing the extension files.

## Usage

1. Navigate to YouTube Music (<https://music.youtube.com>).
2. Play any song.
3. The karaoke lyrics will automatically appear over the album art.
4. Use the extension popup to adjust font size and toggle auto-scroll.

## Configuration

Before using the extension, you need to set up your own lyrics API. Replace the `API_URL` in `background.js` with your preferred lyrics API endpoint.
javascript const url = API_URL?q=${query};

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## Disclaimer

This extension is not affiliated with or endorsed by YouTube or Google. Use at your own discretion and ensure you comply with YouTube's terms of service.
