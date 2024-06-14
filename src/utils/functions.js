import  * as bd from './bd.js'
import  * as telegram from './telegram.js'
import  * as AI_functions from "./AI_functions.js"
import  * as wpp from './whatsapp.js'
import { Client } from "@googlemaps/google-maps-services-js"
import { ObjectId }from 'mongodb'
// require('dotenv').config();
let first = {}

const client = new Client({});


const finalizar = async (cliente, who) => {
  try {
    const viaje = await bd.getRide(cliente);
    const Auxarray = viaje["finalizar"];
    if (viaje) {
      viaje["estado"] = "Completado";
      await bd.create_end_rides(viaje);
      await bd.deleteRide(cliente);
      if (cliente in AI_functions.historialUser) {
        delete AI_functions.historialUser[cliente];
      }
      await bd.update_driver_status("libre", viaje["id_Conductor"]);
  
      telegram.end_message_information(viaje);
  
      wpp.end_message(cliente);
    }
  } catch (error) {
    console.log(error)
  }
}

const cancelar = async (cliente) => {
  try {
  await telegram.eliminarViaje(cliente)

    let viaje = await bd.getRide(cliente)
    if(viaje){
      if (viaje["estado"] == "aceptado") {
        wpp.no_cancel_message(cliente)
      }
      else {
        await bd.deleteRide(cliente)
        wpp.cancel_message(cliente)
      }
    }else{
      wpp.cancel_message2(cliente)
    }
  } catch (error) {
    console.log(error)
    wpp.cancel_message2(cliente)
  }

}

const cancelarAdmin = async (cliente, _id, poscicion, viaje) => {
  try {
    let id = telegram.admin["viaje"][poscicion]
    let aux = telegram.admin["viaje"]
    aux.splice(poscicion, 1);
    telegram.admin["viaje"] = aux
    await telegram.eliminarViajeA(id)

    if(viaje){  
      if (viaje["estado"] == "aceptado") {
        wpp.no_cancel_message(cliente)
      }
      else {
        await bd.deleteRideby_id(new ObjectId(viaje._id))
        wpp.cancel_message(cliente)
      }
    }else{
      wpp.cancel_message2(cliente)
    }
  } catch (error) {
    console.log(error)
    wpp.cancel_message2(cliente)
  }
}


const cancelarxtiempo = async (cliente) => {
  setTimeout(async () => {
    try {
      let viaje = await bd.getRide(cliente)
      if(viaje){
      await telegram.eliminarViaje(cliente)
      if (viaje && viaje["estado"] != "aceptado") {
        await bd.deleteRide(cliente)
        wpp.time_cancel(cliente)
      }
    }
    } catch (error) {
    }

  }, 300000);

}


const borrar_conversaciones_antiguas = async () => {
  const tiempoActual = new Date().getTime() / 1000;
  const conversacionesParaBorrar = [];
  for (const usuario in wpp.first) {
    const tiempoTranscurrido = tiempoActual - wpp.first[usuario];
    if (tiempoTranscurrido > 300) {
      conversacionesParaBorrar.push(usuario);
    }
  }
  for (const usuario of conversacionesParaBorrar) {
    if (usuario in AI_functions.historialUser) {
      try {
        delete AI_functions.historialUser[usuario];
        delete wpp.first[usuario];
      } catch (error) {
        
      }
    }
  }
}

const closeByTime = async (user) => {
  setTimeout(async () => {
    try {
      let mensaje = `Por temas de protocolo, hemos finalizado su viaje esto con el fin de mantener un sistema funcional. Si aun se encuentra en el servicio no hay ningun problema podra culminarlo. Este mensaje solo es informativo.`
      let viaje = await bd.getRide(user)
      if(viaje){
        let id_conductor = viaje["id_Conductor"]
        await bd.deleteRide(user)
        viaje["estado"] = "Completado"
        await bd.create_end_rides(viaje)
        await bd.update_driver_status("libre", viaje["id_Conductor"])
        wpp.time_end(user)
        await telegram.end_time_message(id_conductor)
      }
    } catch (error) {
    }

  }, 3600000);
}

const convert_time_to_minutes = async (timeString) => {
  const timePattern = /\b(\d+)\s*(hours?|mins?)\b/g;
  const matches = timeString.matchAll(timePattern);
  let totalMinutes = 0;
  for (const match of matches) {
    const value = parseInt(match[1], 10);
    const unit = match[2].toLowerCase();
    if (unit === 'hour' || unit === 'hours') {
      totalMinutes += value * 60;
    } else if (unit === 'min' || unit === 'mins') {
      totalMinutes += value;
    }
  }
  return totalMinutes;
}

const getCords = async(address)=>{
  let address1 = address + " ,Palmira, Valle del cauca"
  let nose = await client.textSearch({params:{query: address1, 
    key: process.env.api_key
  }})

  return nose.data.results[0].geometry.location
}

const enviar_precio = async (direccion1, direccion2) => {
  let precio
  let directions
  let distancia
  let tiempo_estimado


  try {

    if (typeof direccion1 == "string") {
      const InitAdress = await getCords(direccion1)
      const EndAdress = await getCords(direccion2)
      directions = await client.directions({
        params: {
          origin: [InitAdress.lat, InitAdress.lng],
          destination: [EndAdress.lat, EndAdress.lng],
          key: process.env.api_key
        }
      })
    } else {
      directions = await client.directions({
        params: {
          origin: [direccion1.lat, direccion1.long],
          destination: "Calarca",
          key: process.env.api_key
        }
      })
      let direccion = directions.data.routes[0].legs[0].start_address
      return direccion
    }


  } catch (error) {
    console.log(error)
    return "Lo sentimos no encontramos la direccion, por favor intenta de nuevo"
  }
  if (directions) {
    tiempo_estimado = directions.data.routes[0].legs[0].duration["text"]
    distancia = directions.data.routes[0].legs[0].distance["text"]
    let kilometrosPrice = parseFloat(distancia.split(" ")[0]) * 1000
    let timePrice = await convert_time_to_minutes(tiempo_estimado) * 200
    precio = parseInt(kilometrosPrice + timePrice + 2800)
  }
  else {
    return "No se pudo encontrar la ruta, por favor intenta de nuevo"
  }
  if (precio >= 5000) {
    return [6000, directions.data.routes[0].legs[0].start_location, directions.data.routes[0].legs[0].end_location, distancia, tiempo_estimado]
  }
  else {
    return [6000, directions.data.routes[0].legs[0].start_location, directions.data.routes[0].legs[0].end_location, distancia, tiempo_estimado]
  }
}

const create_message = async (from_number, user_message) => {
  try {
    let mensaje = ""
    let isCreated = await bd.checkUser(from_number)
    let isVerified = false
    if (isCreated == true) {
      isVerified = await bd.checkVerified(from_number);
      // user = f"whatsapp:{from_number}"
    }
    if (isCreated == false) {
      if (!(from_number in AI_functions.historialUser)) {
        AI_functions.startAssistant(from_number, "no_registered")
      }
      let aux = AI_functions.historialUser[from_number]
      let _new = { "role": "user", "content": user_message }
      aux.push(_new)
      AI_functions.historialUser[from_number] = aux
  
      mensaje = await AI_functions.chat(from_number)
    }
    else if (isCreated == true && isVerified == true) {
      let isBlock = await bd.checkBlock(from_number)
  
      if (isBlock) {
        mensaje = "Lo sentimos estas bloqueado no puedes interactuar por el momento."
        return mensaje
      }
      if (!(from_number in AI_functions.historialUser)) {
        AI_functions.startAssistant(from_number, "registered")
      }
      let is_in_viaje = await bd.getRide(from_number)
      let user = await bd.getUser(from_number)

      if (is_in_viaje == null || user.admin == true) {
        let aux = AI_functions.historialUser[from_number]
        let _new = { "role": "user", "content": user_message }
        aux.push(_new)
        AI_functions.historialUser[from_number] = aux
        mensaje = await AI_functions.chat(from_number)
      }
      else {
        if (!(from_number in first)) first[from_number] = false
        if (first[from_number]) return
        else {
          first[from_number] = true
          mensaje = "Lo sentimos no podemos responder mientras estes en peticion de viaje o en un viaje."
        }
      }
    }
    else {
      mensaje = "No estas verificado cuando te verifiquemos te enviaremos un mensaje"
    }
    return mensaje;
  } catch (error) {
    console.log(error)
    let mensaje = "Lo sentimos estamos teniendo problemas internos por favor intentalo mas tarde."
    return mensaje;
  }
}


export {
  finalizar,
  cancelar,
  cancelarxtiempo,
  borrar_conversaciones_antiguas,
  closeByTime,
  convert_time_to_minutes,
  enviar_precio,
  create_message,
  cancelarAdmin
}