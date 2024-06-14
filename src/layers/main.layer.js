
import { generateTimer } from "../utils/generateTimer.js"
import * as wpp from "../utils/whatsapp.js"
import * as functions from "../utils/functions.js"


export default async (ctx, { state,  extensions, flowDynamic, provider }) => {

    let mensaje
    wpp.first[ctx.from] = Date.now();
    mensaje = await functions.create_message(ctx.from, ctx.body)
    if(mensaje == "Viaje")  return("All ok")
      else{
          if (mensaje !== null && mensaje != undefined && !mensaje.includes("function")){
          await flowDynamic([{ body: mensaje, delay: generateTimer(150, 250) }]);
        }
      }
}
  