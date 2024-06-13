const { EVENTS, addKeyword, createFlow } = require("@bot-whatsapp/bot");
const welcomeFlow = require("./welcome.flow");
const functions = require("../utils/functions")
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const { convertOggMp3 } = require("../services/audio/whisper");
const { voiceToText } = require("../services/audio/convert");
const fs = require('fs');
const wpp = require("../utils/whatsapp")
const bd = require("../utils/bd")
const { generateTimer } = require("../utils/generateTimer")


const handlerAI = async (ctx) => {
    const buffer = await downloadMediaMessage(ctx, "buffer");
    const pathTmpOgg = `${process.cwd()}/tmp/voice-note-${Date.now()}.ogg`;
    const pathTmpMp3 = `${process.cwd()}/tmp/voice-note-${Date.now()}.mp3`;
    await await fs.promises.writeFile(pathTmpOgg, buffer);
    await convertOggMp3(pathTmpOgg, pathTmpMp3);
    const text = await voiceToText(pathTmpMp3);
    fs.rmSync(pathTmpOgg, { recursive: true, force: true })
    fs.rmSync(pathTmpMp3, { recursive: true, force: true })
    return text; 
  };
  
  const flowAudio = addKeyword(EVENTS.VOICE_NOTE).addAction(async (ctx, { flowDynamic, extensions, state, gotoFlow }) => {
    const text = await handlerAI(ctx);
    let mensaje

    let time = new Date();
    wpp.first[ctx.from] = time.getTime();
    mensaje = await functions.create_message(ctx.from, text)
    if(mensaje == "Viaje")  return("All ok")
      else{

          if (mensaje !== null && mensaje != undefined && !mensaje.includes("function")){
          await flowDynamic([{ body: mensaje, delay: generateTimer(150, 250) }]);
        }

      }

  })

  function convertCoordinates(decimalCoordinates, isLatitude) {
    const absoluteValue = Math.abs(decimalCoordinates);
    const degrees = Math.floor(absoluteValue);
    const minutes = Math.floor((absoluteValue - degrees) * 60);
    const seconds = Math.round(((absoluteValue - degrees) * 60 - minutes) * 600) / 10;
  
    const direction = decimalCoordinates >= 0 ? (isLatitude ? "N" : "E") : (isLatitude ? "S" : "W");
  
    return `${degrees}°${minutes}'${seconds}${direction}`;
}

const flowUbicacion = addKeyword(EVENTS.LOCATION).addAction(async (ctx, { state,flowDynamic, extensions, gotoFlow }) => {
  const location = ctx.message.locationMessage;
  let direction = {
    lat: location.degreesLatitude,
    long: location.degreesLongitude
  }
  let direccion = await functions.enviar_precio(direction, "Unicentro, Pereira")
  let mensaje
  let time = new Date();
  wpp.first[ctx.from] = time.getTime();
  mensaje = await functions.create_message(ctx.from, direccion)
  if(mensaje == "Viaje")  return("All ok")
    else{

        if (mensaje !== null && mensaje != undefined && !mensaje.includes("function")){
        await flowDynamic([{ body: mensaje, delay: generateTimer(150, 250) }]);
      }

    }

}
)
const flowViaje = addKeyword("Confirmar viaje").addAction( async (ctx, { state, flowDynamic, extensions, gotoFlow }) => {
  let mensaje
  let time = new Date();
  wpp.first[ctx.from] = time.getTime();
  mensaje = await functions.create_message(ctx.from, "Quiero confirmar el viaje con la ultima informacion entregada por favor crea el viaje con su respectiva funcion")
  if(mensaje == "Viaje")  return("All ok")
    else{

        if (mensaje !== null && mensaje != undefined && !mensaje.includes("function")){
          deleteThread(ctx.from);

        await flowDynamic([{ body: mensaje, delay: generateTimer(150, 250) }]);
      }

    }
});

let viajes
  

const flowCancel = addKeyword("Cancelar").addAction( async (ctx, { state, flowDynamic, extensions, gotoFlow, endFlow }) => {
  let user = await bd.getUser(ctx.from)
  if(user.admin){
    viajes = await bd.getRidesU(ctx.from)
    if(viajes.length > 0){
      let texto = `del 1 al ${viajes.length} ("Solo escribir el numero")`
      await flowDynamic([{ body: `Por favor selecciona que viaje quieres eliminar ${texto}`, delay: generateTimer(150, 250) }]);}
      else{
        return endFlow({body: 'No te encuentras en viaje.' })  
      }
  }else{
    functions.cancelar(ctx.from)
  }
}).addAction({ capture: true }, async (ctx, { flowDynamic, endFlow }) => {
  const opcion = parseInt(ctx.body);
  if(typeof opcion == "number" && !Number.isNaN(opcion) && viajes[opcion - 1] != undefined){
    functions.cancelarAdmin(ctx.from,viajes[opcion - 1]._id, opcion - 1, viajes[opcion - 1])
  }else{
    return endFlow({body: 'Valor incorrecto, vuelve a intentarlo.' })  
  }
});


module.exports = createFlow([welcomeFlow, flowCancel,  flowAudio, flowUbicacion, flowViaje])