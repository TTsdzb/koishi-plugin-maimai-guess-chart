import Ffmpeg from "fluent-ffmpeg";

/**
 * Probe a media file and get its metadata.
 * @param path Path of the input media file
 * @returns Metadata of the media
 */
export function metadata(path: string): Promise<Ffmpeg.FfprobeData> {
  return new Promise<Ffmpeg.FfprobeData>((resolve, reject) => {
    Ffmpeg(path).ffprobe((err, data) => {
      if (err) reject(err);
      resolve(data);
    });
  });
}

/**
 * Clip an audio file and return base64 encoded buffer.
 * @param path Path of input audio file
 * @param startTime Length to seek in the input
 * @param duration Duration of clipped audio
 * @returns Base64 encoded buffer of audio stream
 */
export function clipAudio(
  path: string,
  startTime: number,
  duration: number = 10
): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const chunks: Buffer[] = [];
    Ffmpeg(path)
      .seekInput(startTime)
      .audioCodec("copy")
      .duration(duration)
      .outputFormat("mp3")
      .on("error", (err) => reject(err))
      .pipe(undefined, { end: true })
      .on("data", (chunk) => chunks.push(chunk))
      .on("error", (err) => reject(err))
      .on("end", () => {
        resolve(Buffer.concat(chunks).toString("base64"));
      });
  });
}
