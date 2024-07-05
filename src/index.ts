import * as path from "path";
import * as fs from "fs/promises";
import { Context, Logger, Schema, Session, h } from "koishi";
import { clipAudio, metadata } from "./ffmpeg";

export const name = "maimai-guess-chart";

export interface Config {
  audioPath: string;
  answers: string[];
  duration: number;
  timeout: number;
}

export const Config: Schema<Config> = Schema.object({
  audioPath: Schema.path({
    filters: ["directory"],
  }).required(),
  answers: Schema.tuple([
    Schema.string(),
    Schema.string(),
    Schema.string(),
    Schema.string(),
    Schema.string(),
  ]).default(["绿谱", "黄谱", "红谱", "紫谱", "白谱"]),
  duration: Schema.number().min(1).default(10),
  timeout: Schema.number().min(1).default(40),
}).i18n({
  "zh-CN": require("./locales/zh-CN")._config,
});

interface Song {
  id: number;
  title: string;
  count: number;
}

interface GameSession {
  song: Song;
  chart: number;
  timeout: NodeJS.Timeout;
}

export function apply(ctx: Context, config: Config) {
  ctx.i18n.define("zh-CN", require("./locales/zh-CN"));
  const logger = new Logger("maimai-guess-chart");

  const reverseAnswers = {};
  config.answers.forEach((value, index) => {
    reverseAnswers[value] = index + 1;
  });

  const songs: Song[] = [];

  ctx.on("ready", async () => {
    // Load audio data
    for (const folder of await fs.readdir(config.audioPath)) {
      const index = folder.indexOf("_");
      songs.push({
        id: parseInt(folder.substring(0, index)),
        title: folder.substring(index + 1),
        count: (await fs.readdir(path.join(config.audioPath, folder))).length,
      });
    }
  });

  const gameSessions = new Map<string, GameSession>();

  ctx.command("maiGuessChart [id:posint]").action(async ({ session }, id) => {
    const gameSessionId = session.guildId ? session.gid : session.uid;
    if (gameSessions.has(gameSessionId)) return session.text(".alreadyStarted");

    const song = id
      ? songs.find((song) => song.id === id)
      : songs[Math.floor(Math.random() * songs.length)];
    if (!song) return session.text(".songNotFound", [id]);
    logger.debug("Selected song: ", song);

    const chart = Math.floor(Math.random() * song.count);
    logger.debug("Selected chart: ", chart);
    const audioPath = path.join(
      config.audioPath,
      `${song.id}_${song.title}`,
      `${chart + 1}.mp3`
    );

    gameSessions.set(gameSessionId, {
      song,
      chart,
      timeout: setTimeout(async () => {
        await session.send(
          session.text("commands.maiguesschart.messages.timeout", [
            song.title,
            config.answers[chart],
          ])
        );
        gameSessions.delete(gameSessionId);
      }, config.timeout * 1000),
    });

    try {
      const audioLength = (await metadata(audioPath)).format.duration;
      const seekTime = Math.random() * (audioLength - config.duration);

      await session.send(session.text(".nowPlaying", song));
      return h.audio(
        "data:audio/mpeg;base64," +
          (await clipAudio(audioPath, seekTime, config.duration))
      );
    } catch (e) {
      logger.error(e);
      clearTimeout(gameSessions.get(gameSessionId).timeout);
      gameSessions.delete(gameSessionId);
      return session.text(".errorOccurred");
    }
  });

  ctx.middleware((session, next) => {
    const gameSessionId = session.guildId ? session.gid : session.uid;
    const gameSession = gameSessions.get(gameSessionId);
    if (!gameSession) return next();

    if (session.event.message?.content !== config.answers[gameSession.chart])
      return next();

    clearTimeout(gameSession.timeout);
    gameSessions.delete(gameSessionId);
    return (
      h("quote", { id: session.event.message?.id }) +
      session.text("commands.maiguesschart.messages.youWin", [
        gameSession.song.title,
        config.answers[gameSession.chart],
      ])
    );
  });
}
