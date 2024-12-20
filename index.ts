import meow from "meow";
import { VimeoPlaylistDownloader } from "./src/Downloader.js";

const program = meow(`
  Usage
    $ vimeo-playlist-downloader -p <playlist-url> -f <filename>

  Options
    --playlist-url, -p  URL of the Vimeo playlist
    --filename, -f      Filename to save the merged audio and video
`, {
  flags: {
    playlistUrl: {
      type: "string",
      shortFlag: "p",
      isRequired: true,
    },
    filename: {
      type: "string",
      shortFlag: "f",
      isRequired: true,
    }
  },
  importMeta: import.meta,
});

const downloader = new VimeoPlaylistDownloader(
  new URL(program.flags.playlistUrl),
  program.flags.filename
)

const fileName = await downloader.download()
console.log(`Downloaded: ${fileName}`)
