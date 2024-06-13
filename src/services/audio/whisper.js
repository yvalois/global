const { path  } = require('@ffmpeg-installer/ffmpeg');
const ffmpeg = require('fluent-ffmpeg');

ffmpeg.setFfmpegPath(path);
/**
 *
 * @param {*} inputStream
 * @param {*} outStream
 * @returns
 */
const convertOggMp3 = async (inputStream, outStream) => {
  return new Promise((resolve, reject) => {
    ffmpeg(inputStream)
      .audioQuality(96)
      .toFormat("mp3")
      .save(outStream)
      .on("progress", (p) => null)
      .on("end", () => {
        resolve(true);
      });
  });
};

module.exports =  { convertOggMp3 };
