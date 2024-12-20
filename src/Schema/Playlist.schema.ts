import z from "zod"

export const SegmentSchema = z.strictObject({
  start: z.number(),
  end: z.number(),
  size: z.number(),
  url: z.string(),
})

export const AudioSchema = z.strictObject({
  audio_primary: z.boolean(),
  avg_bitrate: z.number(),
  avg_id: z.string(),
  base_url: z.string(),
  bitrate: z.number(),
  channels: z.number(),
  codecs: z.string(),
  duration: z.number(),
  format: z.string(),
  id: z.string(),
  index_segment: z.string(),
  init_segment: z.string(),
  init_segment_url: z.string(),
  max_segment_duration: z.number(),
  mime_type: z.string(),
  sample_rate: z.number(),
  segments: z.array(SegmentSchema),
})

export const VideoSchema = z.strictObject({
  avg_bitrate: z.number(),
  avg_id: z.string(),
  base_url: z.string(),
  bitrate: z.number(),
  codecs: z.string(),
  duration: z.number(),
  format: z.string(),
  framerate: z.number(),
  height: z.number(),
  id: z.string(),
  index_segment: z.string(),
  init_segment: z.string(),
  init_segment_url: z.string(),
  max_segment_duration: z.number(),
  mime_type: z.string(),
  segments: z.array(SegmentSchema),
  width: z.number(),
})

export const PlaylistSchema = z.strictObject({
  audio: z.array(AudioSchema),
  base_url: z.string(),
  clip_id: z.string(),
  video: z.array(VideoSchema),
})
