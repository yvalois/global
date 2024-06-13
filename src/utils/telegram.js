const { Telegraf } = require('telegraf')
const { message } = require('telegraf/filters')
const db = require("./bd")
const { ObjectId } = require('mongodb')
const { viaje_aceptado_message } = require('./whatsapp')
const AI_functions = require("./AI_functions")
const functions = require("./functions")
require('dotenv').config();
const bot = new Telegraf(process.env.TELEGRAM_API)
const channel_id = process.env.CHANEL_ID

let whatsappUriBase = "https://api.whatsapp.com/send?phone="
let chat_historiesT = {}
let chat_historiesW = {}
let admin = {}


const borrarTelegram = async(user, contador) => {
    try {
        if (contador) {
            setTimeout(() => {
              chat_historiesT[user].forEach(async(mensaje) => {
                      await  bot.telegram.deleteMessage(user, mensaje)
              });
            }, 10000); // 10 seconds
          } else {
            chat_historiesT[user].forEach(async(mensaje) => {
                  await  bot.telegram.sendMessage(user, mensaje)
            });
          }
    } catch (error) {
        console.log(error)
    }

  }

  const inicioMessage =async(direccion1, direccion2,descripcion,  _id, user, usuario)=>{ 
        try {
            let new_id = _id["insertedId"].toString()
            let action = `iniciar,${new_id}` 
            let telegram_mensaje = `Nuevo Pedido\nInicio del viaje: ${direccion1}\nFinalizacion del viaje: ${direccion2}\nDetalles: ${descripcion}\nTarifa del viaje: A convenir`
            let mensaje = await bot.telegram.sendMessage(channel_id, telegram_mensaje, {
                    reply_markup: {
                        inline_keyboard: [
                            /* Inline buttons. 2 side-by-side */
                            [ { text: "Aceptar", callback_data: action }],
        
                        ]
                    }
                })

            if(usuario.admin){
                if(admin["viaje"] == undefined){
                    admin["viaje"] = []
                    admin["viaje"].push(mensaje.message_id)
                }else{
                    admin["viaje"].push(mensaje.message_id)
                }
            }else{
                chat_historiesW[user] = mensaje.message_id
            }
    } catch (error) {
        console.log(error)
    }
}



const handle_service = async(_id, driver) =>{
    try {
        let ride_info = await db.findRideById(new ObjectId(_id))

    
    
        if(ride_info){
            let driver_info = await db.getDriver(driver)
    
            let action = `finalizar,${_id}`
            let celular = ride_info['telefono']
            let redirect = whatsappUriBase + celular
            let price = ride_info["tarifaSugerida"].replace(/[^0-9.$]/g, '');
            let telegram_mensaje = `Haz aceptado un viaje\nPasajero: ${ride_info['pasajero']} \nInicio del viaje: ${ride_info['desde']} \nFinalizacion del viaje: ${ride_info['hasta']}\nDetalles: ${ride_info['descripcion']}\ntelefono: ${celular} \nOferta del cliente: ${price.split(".")[0]}\nLink whatsapp: ${redirect}`
    
            let mensaje = await bot.telegram.sendMessage(driver_info["chat_id"] ,telegram_mensaje, {
                reply_markup: {
                    inline_keyboard: [
                        /* Inline buttons. 2 side-by-side */
                        [ { text: "Terminar", callback_data: action }],
                    ]
                }
            })
            chat_historiesT[driver.id] = []
            let auxArrayT = chat_historiesT[driver.id]
            auxArrayT.push(mensaje.message_id)
            chat_historiesT[driver.id] = auxArrayT
            viaje_aceptado_message(ride_info['conductor'], ride_info['d_telefono'], ride_info['placa'], ride_info['vehiculo'], ride_info["telefono"])
            // threading.Thread(target=functions.closeByTime, args=(ride_info["telefono"],)).start() // veremos
            setTimeout(() => {
                functions.closeByTime(ride_info["telefono"])
              }, 0);
        }
        else{
            bot.on(message('text'), async (ctx) => {
                // Explicit usage
                const msg = await ctx.telegram.sendMessage(driver["id"], "Hubo un error pueda que el servicio se haya cancelado")
                let auxArrayT = chat_historiesT[driver["id"]]
                auxArrayT.push(msg.message_id)
                chat_historiesT[driver["id"]] = auxArrayT
                // threading.Thread(target=borrar_telegram, args=(driver["id"],True,)).start()

              })
    
        }   
    } catch (error) {
        console.log(error)
    }

}


const eliminarViaje = async(user)=>{
    try {
        await bot.telegram.deleteMessage(channel_id, chat_historiesW[user])
    } catch (error) {
    }
}

const eliminarViajeA = async(id)=>{
    try {
        await bot.telegram.deleteMessage(channel_id, id)
    } catch (error) {
    }
}

bot.command('start', async(ctx) =>    { 
    try {
        let chat_id = ctx.message.chat.id
        let driver = ctx.message.chat.username
        let isCreated = await db.checkDriver(chat_id)
        let msg
        
        if(isCreated){
            let isVerified = await db.checkVerifiedD(chat_id)
            let isBlock = await db.checkDBlock(chat_id)
    
            if(!isVerified){
                let mensaje = "Aun no haz sido verificado enviaremos un mensaje avisando cuando te verifiquemos"
                 msg = ctx.reply(mensaje)
            }else if(isBlock){
                msg = ctx.reply("Tu cuenta esta bloqueada, no puedes interactuar con este bot.")
            }
            else{
                 msg = ctx.reply("Aqui recibiras todas la informacion sobre los viajes que aceptes")  
            }
        }
        else if(isCreated == false){
            AI_functions.startAssistant(chat_id, "driver_r")
            let aux = AI_functions.historialUser[chat_id]
            let _new = {"role":"user", "content": "Hola"}
            aux.push(_new)
            AI_functions.historialUser[chat_id] = aux
            let mensaje = await AI_functions.driverChat(chat_id, driver)
             msg = await ctx.reply(mensaje)  
        }
    
        // let auxArrayT = chat_historiesT[ctx.message.chat.id]
        // auxArrayT.push(msg.message_id)
        // chat_historiesT[ctx.message.chat.id] = auxArrayT
    } catch (error) {
        console.log(error)
        ctx.reply("Lo sentimos estamos teniendo problemas internos por favor intentalo mas tarde.")  

    }

}
)

//Logica query
bot.on('callback_query', async (ctx) => {
    try {
        let message_id = ctx.callbackQuery.message.message_id
        let query = ctx.callbackQuery.data
    
        let aux = query.split(",")
        let objInstance = {}
        let driver
        let chat_id
        let msg


        if(aux[1].startsWith("57")){
            objInstance = ""
        }
        else{
            objInstance = new ObjectId(aux[1])
            driver = ctx.callbackQuery.from.username
            chat_id = ctx.callbackQuery.from.id
        }
        let isCreated = await db.checkDriver(chat_id)
        if (isCreated == false){
            return
        }
        if(aux[0].toLowerCase() == "iniciar"){    
            let driver_info = await db.getDriver(chat_id)
            let items = await db.findRideById(objInstance)
            let isBlock = await db.checkDBlock(chat_id)
    
    
            if (isBlock) {
                bot.telegram.sendMessage(driver_info["chat_id"], "Estas bloqueado no puedes aceptar viajes.")
                return
            }
            if(items && items["estado"] == "Esperando" && driver_info["estado"] == "libre"){
                await db.accept_ride(driver_info["nombre"],driver_info["usuario_t"], driver_info["placa"],driver_info["telefono"],driver_info["cedula"], driver_info["vehiculo"],chat_id, objInstance) 
                await db.update_driver_status("viajando", chat_id)
    
                handle_service(objInstance, chat_id)
                ctx.deleteMessage(message_id, channel_id)
            }
            else if(driver_info["estado"] != "libre"){
                bot.telegram.sendMessage(chat_id, 'Debes terminar el viaje actual para continuar.\nNo olvides presionar el boton "Finalizar" ')

                // auxArrayT = chat_historiesT[chat_id]
                // auxArrayT.push(mensaje.message_id)
                // chat_historiesT[chat_id] = auxArrayT
            }
            else{
                bot.telegram.sendMessage(chat_id, "Este viaje no se encuentra disponible")
                // threading.Thread(target=borrar_telegram, args=(chat_id,True,)).start()
            }
            }
        else if(aux[0].toLowerCase() == "finalizar"){
            // let viaje = await db.findRideById(new ObjectId(aux[1]))
            // functions.finalizar(viaje["telefono"], "driver")
            let viaje = await db.findRideById(objInstance)
            if(viaje){
                try {
                    // let viaje = await db.findRideById(new ObjectId(aux[1]))
                    // functions.finalizar(viaje["telefono"], "driver")
                    await functions.finalizar(viaje["telefono"], "driver")
                } catch (error) {
                    console.log(error)
                    msg = await ctx.reply("Este viaje ya ha sido finalizado.")
                }
            }else{
                msg = await ctx.reply("Este viaje ya ha sido finalizado.")
            }

    
        }
        
        else if(aux[0].toLowerCase() == "confirmar"){
            functions.finalizar(aux[1], "driver")  
        }
        if(msg){
            if(!(chat_id in chat_historiesT)){
                chat_historiesT[chat_id] = []
                let auxArrayT = chat_historiesT[chat_id]
                auxArrayT.push(msg.message_id)
                chat_historiesT[chat_id] = auxArrayT
            }else{
                let auxArrayT = chat_historiesT[chat_id]
                auxArrayT.push(msg.message_id)
                chat_historiesT[chat_id] = auxArrayT
            }
        }
    
    } catch (error) {
        console.log(error)
    }

  })

const end_message = async(viaje)=> {
    try {
        let action = `confirmar,${viaje['telefono']}`
        let msg
    
            msg = await bot.telegram.sendMessage(viaje["id_Conductor"] ,"El usuario finalizo el viaje, ¿Confirmas esta accion?", {
                reply_markup: {
                    inline_keyboard: [
                        /* Inline buttons. 2 side-by-side */
                        [ { text: "Confirmar", callback_data: action }],
    
                    ]
                }
            })
    
            if(!(viaje["id_Conductor"] in chat_historiesT)){
                chat_historiesT[viaje["id_Conductor"]] = []
                let auxArrayT = chat_historiesT[viaje["id_Conductor"]]
                auxArrayT.push(msg.message_id)
                chat_historiesT[viaje["id_Conductor"]] = auxArrayT
            }else{
                let auxArrayT = chat_historiesT[viaje["id_Conductor"]]
                auxArrayT.push(msg.message_id)
                chat_historiesT[viaje["id_Conductor"]] = auxArrayT
            }
    } catch (error) {
        console.log(error)
    }



}


  
const end_message_information = async(viaje) =>{ 
    try {
        let msg
        msg = await bot.telegram.sendMessage(viaje["id_Conductor"],"Se ha finalizado el viaje")
    
        if(!(viaje["id_Conductor"] in chat_historiesT)){
            chat_historiesT[viaje["id_Conductor"]] = []
            let auxArrayT = chat_historiesT[viaje["id_Conductor"]]
            auxArrayT.push(msg.message_id)
            chat_historiesT[viaje["id_Conductor"]] = auxArrayT
        }else{
            let auxArrayT = chat_historiesT[viaje["id_Conductor"]]
            auxArrayT.push(msg.message_id)
            chat_historiesT[viaje["id_Conductor"]] = auxArrayT
        }
        //threading.Thread(target=borrar_telegram, args=(viaje["id_Conductor"],True,)).start()
    } catch (error) {
        console.log(error)
    }

}
  
const end_time_message = async(id_conductor) => {
    try {
        let mensaje = `Por temas de protocolo, hemos finalizado su viaje esto con el fin de mantener un sistema funcional. Si aun se encuentra en el servicio no hay ningun problema podra culminarlo. Este mensaje solo es informativo.`

        await bot.telegram.sendMessage(id_conductor,mensaje)
    } catch (error) {
        console.log(error)
    }

}

  
const verified_message = async(chat_id) =>{
    try {
    await bot.telegram.sendMessage(chat_id, "haz sido verificado ya puedes aceptar servicios")
        
    } catch (error) {
        console.log(error)
    }
}

const block_message = async(chat_id, message) =>{
    try {
        await bot.telegram.sendMessage(chat_id, message)  
    } catch (error) {
        console.log(error)
    }
}



const cancelMessage = async(viaje) =>{
    try {
        let mensaje
            mensaje = await bot.telegram.sendMessage(viaje["id_Conductor"], "El usuario cancelo el viaje")
        return mensaje
    } catch (error) {
        console.log(error)
    }

}

bot.on(message('text'), async (ctx) => {
    try {
        let chat_id = ctx.message.chat.id
        let driver = ctx.message.chat.username
        let isCreated = await db.checkDriver(chat_id)
    
        let msg
    
    
        if(isCreated){
            let isVerified = await db.checkVerifiedD(chat_id)
        let isBlock = await db.checkDBlock(chat_id)
    
            if(!isVerified){
                let mensaje = "Aun no haz sido verificado enviaremos un mensaje avisando cuando te verifiquemos"
                 msg = ctx.reply(mensaje)
            }else if(isBlock){
                msg = ctx.reply("Tu cuenta esta bloqueada, no puedes interactuar con este bot.")
            }
            else{
                 msg = ctx.reply("Aqui recibiras todas la informacion sobre los viajes que aceptes")  
            }
        }
        else if(isCreated == false){
            if (!(chat_id  in AI_functions.historialUser)){
                AI_functions.startAssistant(chat_id, "driver_r")
                let aux = AI_functions.historialUser[chat_id]
                let _new = {"role":"user", "content": ctx.message.text}
                aux.push(_new)
                let mensaje = await AI_functions.driverChat(chat_id, driver)
                msg = await ctx.reply(mensaje)  
                return
            }
            let aux = AI_functions.historialUser[chat_id]
            let _new = {"role":"user", "content": ctx.message.text}
            aux.push(_new)
            AI_functions.historialUser[chat_id] = aux
            let mensaje = await AI_functions.driverChat(chat_id, driver)
             msg = await ctx.reply(mensaje)  
        }
    } catch (error) {
        console.log(error)
    }

  })

module.exports = {
    bot,
    inicioMessage,
    handle_service,
    end_message,
    end_message_information,
    end_time_message,
    verified_message,
    cancelMessage,
    chat_historiesT,
    borrarTelegram,
    eliminarViaje,
    block_message,
    admin,
    eliminarViajeA
}
