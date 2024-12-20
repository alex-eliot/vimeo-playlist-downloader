import { z } from "zod";
import { AudioSchema, PlaylistSchema, SegmentSchema, VideoSchema } from "./Schema/Playlist.schema.js";
import path from "node:path"
import fs from "node:fs"
import { execSync } from "node:child_process"
import PQueue from "p-queue"

export class VimeoPlaylistDownloader {
  constructor(
    protected readonly playlistUrl: URL,
    protected readonly filename: string
  ) {}

  public async download() {
    // download the playlist
    const playlist = await this.downloadPlaylist();

    // find the audio and video
    // prefer highest quality audio and 1080p video
    const audio = playlist.audio.sort((a, b) => b.bitrate - a.bitrate).at(0)
    const video = playlist.video.find((video) => video.height === 1080);
    if (!audio || !video) {
      throw new Error("Audio or video not found");
    }

    // download the audio and video
    const audioFile = await this.downloadAudio(audio, playlist);
    const videoFile = await this.downloadVideo(video, playlist);

    // merge the audio and video
    const mergedFile = this.mergeAudioAndVideo(audioFile, videoFile);

    return mergedFile
  }

  protected async downloadPlaylist() {
    const response = await fetch(this.playlistUrl);
    const json = await response.json();
    const playlist = PlaylistSchema.parse(json);
    return playlist;
  }

  protected async downloadAudio(audio: z.infer<typeof AudioSchema>, playlist: z.infer<typeof PlaylistSchema>) {
    const audioBasePath = path.resolve(this.playlistUrl.pathname, '../', playlist.base_url, audio.base_url)
    const audioFileName = path.resolve('./', 'audio.tmp')
    await this.downloadSegments(audio.segments, audio.init_segment, audio.index_segment, audioBasePath, audioFileName)
    return audioFileName
  }

  protected async downloadVideo(video: z.infer<typeof VideoSchema>, playlist: z.infer<typeof PlaylistSchema>) {
    const videoBasePath = path.resolve(this.playlistUrl.pathname, '../', playlist.base_url, video.base_url)
    const videoFileName = path.resolve('./', 'video.tmp')
    await this.downloadSegments(video.segments, video.init_segment, video.index_segment, videoBasePath, videoFileName)
    return videoFileName
  }

  protected async downloadSegments(segments: z.infer<typeof SegmentSchema>[], init: string, indexPath: string, basePath: string, filename: string) {
    const downloadQueue = new PQueue({ concurrency: 2 });
    const fileHandleQueue = new PQueue({ concurrency: 1 });

    const baseUrl = new URL(this.playlistUrl.origin);

    const file = fs.openSync(filename, 'w')
    const initBytes = Buffer.from(init, 'base64')
    const indexSegmentUrl = new URL(path.resolve(basePath, indexPath), baseUrl);
    const indexSegmentResponse = await fetch(indexSegmentUrl);
    if (!indexSegmentResponse.ok) {
      throw new Error(`Failed to download index segment ${indexSegmentUrl}`);
    }
    const indexSegmentBuffer = await indexSegmentResponse.arrayBuffer()
    const totalSize = initBytes.byteLength + indexSegmentBuffer.byteLength + segments.reduce((acc, segment) => acc + segment.size, 0)
    fs.ftruncateSync(file, totalSize)

    fs.writeSync(file, initBytes, 0, initBytes.byteLength, 0)
    fs.writeSync(file, Buffer.from(indexSegmentBuffer), 0, indexSegmentBuffer.byteLength, initBytes.byteLength)

    await Promise.all(segments.map(async (segment, index) => {
      const segmentUrl = new URL(path.resolve(basePath, segment.url), baseUrl);
      await downloadQueue.add(async () => {
        const response = await fetch(segmentUrl);
        if (!response.ok) {
          throw new Error(`Failed to download segment ${segmentUrl} at index ${index}`);
        }
        const buffer = await response.arrayBuffer();
        const offset = initBytes.byteLength + indexSegmentBuffer.byteLength + getTotalSizeOfSegmentsUpToIndex(segments, index) + index
        console.log(`Writing segment ${index} at offset ${offset} with size ${buffer.byteLength}`)
        await fileHandleQueue.add(() => {
          fs.writeSync(file, Buffer.from(buffer), 0, buffer.byteLength, offset)
        })
      })
    }))

    fs.closeSync(file)
  }

  protected mergeAudioAndVideo(audioFile: string, videoFile: string) {
    execSync(`ffmpeg -i ${audioFile} -i ${videoFile} -c copy ${this.filename}`)
    fs.rmSync(audioFile)
    fs.rmSync(videoFile)
    return this.filename
  }
}

function getTotalSizeOfSegmentsUpToIndex(segments: z.infer<typeof SegmentSchema>[], index: number) {
  return segments.slice(0, index).reduce((acc, segment) => acc + segment.size, 0)
}
