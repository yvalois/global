import fs from 'fs'
import OpenAI from "openai"
// require('dotenv').config();

/**
 *
 * @param {*} path url mp3
 */
let apiKey = process.env.OPEN_API_KEY;
 let openai = new OpenAI({ apiKey, timeout: 15 * 1000 });

const voiceToText = async (path) => {
  if (!fs.existsSync(path)) {
    throw new Error("No se encuentra el archivo");
  }


  try {
    let resp =   await openai.audio.transcriptions.create({      
      file: fs.createReadStream(path),
      model: "whisper-1"})
    return resp.text;
  } catch (err) {
    return "ERROR";
  }
};

export  { voiceToText };
