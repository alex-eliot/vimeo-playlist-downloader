import meow from "meow";
import { VimeoPlaylistDownloader } from "./src/Downloader.js";

const program = meow(`
    Usage
      $ my-cli <input>
 
    Options
      --name  Your name
 
    Examples
      $ my-cli unicorns --name=ponies
      🦄 ponies
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
