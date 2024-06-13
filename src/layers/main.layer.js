
const { generateTimer } = require("../utils/generateTimer")
const wpp = require("../utils/whatsapp")
const functions = require("../utils/functions")


module.exports = async (ctx, { state,  extensions, flowDynamic, provider }) => {


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
  