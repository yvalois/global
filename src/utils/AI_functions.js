import { OpenAI } from 'openai'
import * as bd from './bd.js'
import * as telegram from './telegram.js'
import * as wpp from './whatsapp.js'
import * as functions from './functions.js'
// require('dotenv').config();
import { system_for_driver_r, system_for_no_registered, system_for_registered } from './prompt.js'



const OPENAI_API_KEY = process.env.OPEN_API_KEY;
const client = new OpenAI({ apiKey: OPENAI_API_KEY });

let historialUser = {};

function quitarTildes(cadena) {
  return cadena.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}


function startAssistant(chatId, userType) {
  if (userType === 'no_registered') {
    const system = system_for_no_registered;
    historialUser[chatId] = [{ role: 'system', content: system }];
  } else if (userType === 'registered') {
    const system = system_for_registered;
    historialUser[chatId] = [{ role: 'system', content: system }];
  } else if (userType === 'driver_r') {
    const system = system_for_driver_r;
    historialUser[chatId] = [{ role: 'system', content: system }];
  }
}

const  AIInteraction = async(userChat) =>{
  try {
    const response = await client.chat.completions.create({
      model: 'gpt-3.5-turbo-1106',
      messages: userChat,
      temperature: 0.3,
      max_tokens: 2048,
      top_p: 0.2  ,
      frequency_penalty: 0.2,
      presence_penalty: 0.2,
    });
    return response;
  } catch (error) {
    return
  }

}

const chat = async(chatId)=> {
  try {
    const response = await AIInteraction(historialUser[chatId]);
    let respuesta = response.choices[0].message.content;
    const aux = historialUser[chatId];
    const mensaje = { role: 'assistant', content: respuesta };
    aux.push(mensaje);
    historialUser[chatId] = aux;
    if (respuesta.includes('function')) {
      const textoLimpiado = respuesta.replace(/[^a-zA-Z0-9:, -_áéíóúñÑÁÉÍÓÚÑ|!]/g, '');
      const cantidadDeDosPuntos = textoLimpiado.split(':').length - 1;
      const functionParams2 = textoLimpiado.split(':')[cantidadDeDosPuntos].split('|');
      const functionParams = textoLimpiado.split(':')[cantidadDeDosPuntos].split(',');
      if (functionParams[0] === 'createUser') {
        respuesta = await bd.createUser(chatId, functionParams[1]);
        const aux = historialUser[chatId];
        const mensaje = { role: 'assistant', content: respuesta };
        aux.push(mensaje);
        delete historialUser[chatId];
      } else if (functionParams2[0] === 'enviar_precio') {
        const precio = await functions.enviar_precio(functionParams2[1], functionParams2[2]); 
        if (precio[0] !== 'Lo sentimos no encontramos la direccion, por favor intenta de nuevo' || precio !== 'No se pudo encontrar la ruta, por favor intenta de nuevo') {
          respuesta = `Información de tu viaje:
Tu oferta: A convenir.
Inicio del alquiler: https://www.google.com/maps/place/${precio[1].lat}+${precio[1].lng}
Finalizacion del alquiler: https://www.google.com/maps/place/${precio[2].lat}+${precio[2].lng}
distancia: ${precio[3]}
tiempo: ${precio[4].replace("hours", "horas").replace("mins", "minutos")}
*Si por algún motivo el punto de destino no es adonde tu deseas movilizarte no confirmes el viaje 
¿deseas confirmar el viaje? Escribe Si o No".`
  const aux = historialUser[chatId];
  const mensaje = { role: 'assistant', content: respuesta };
  aux.push(mensaje);
  respuesta = `Información de tu viaje:
Tu oferta: A convenir.
Inicio del alquiler: https://www.google.com/maps/place/${precio[1].lat}+${precio[1].lng}
Finalizacion del alquiler: https://www.google.com/maps/place/${precio[2].lat}+${precio[2].lng}
*Si por algún motivo el punto de destino no es adonde tu deseas movilizarte no confirmes el viaje 
¿deseas confirmar el viaje? Escribe Si o No".`


if(precio[1].lat == undefined  && precio[2].lat == undefined ){
  respuesta = `Lo lamentamos no encontramos las direcciones podrias ser mas especifico`
}
else if(precio[1].lat == undefined ){
  respuesta = `Lo sentimos no encontramos tu ubicacion actual podria ser mas especifico ${functionParams2[1]}`
}else if(precio[2].lat == undefined ){
  respuesta = `Lo sentimos no encontramos la direccion a la que te diriges ${functionParams2[2]}`
}

  } else {
          respuesta = precio;
        }
        const aux = historialUser[chatId];
        const mensaje = { role: 'assistant', content: respuesta };
        aux.push(mensaje);
        historialUser[chatId] = aux;
      } else if (functionParams2[0] === 'crear_viaje') {
        const usuario = await bd.getUser(chatId);
        const viaje = {
          desde: functionParams2[1].replace('|', ','),
          hasta: functionParams2[2].replace('|', ','),
          descripcion:functionParams2[3],
          tarifaSugerida: "A convenir",
          id_Conductor: '',
          conductor: '',
          usuario_t: '',
          placa: '',
          d_telefono: '',
          cedula: '',
          vehiculo: '',
          pasajero: usuario.nombre,
          telefono: chatId,
          estado: 'Esperando',
          fecha: '',
          admin: usuario.admin
        };
        const isCreated = await bd.createRide(viaje);
        delete historialUser[chatId];
        if (isCreated) {
          wpp.viaje_message(functionParams2[1].replace('|', ','), functionParams2[2].replace('|', ','), chatId,functionParams2[3],  );
          await telegram.inicioMessage(functionParams2[1].replace('|', ','), functionParams2[2].replace('|', ','),functionParams2[3], isCreated, chatId, usuario);
          if(!usuario.admin){
            await functions.cancelarxtiempo(chatId)
          }
        } else {
          respuesta = 'Lo sentimos tuvimos un problema vuelve a intentarlo mas tarde.';
          const aux = historialUser[chatId];
          const mensaje = { role: 'assistant', content: respuesta };
          aux.push(mensaje);
          historialUser[chatId] = aux;
        }
      }
    }
    return respuesta;
  } catch (error) {
    delete historialUser[chatId];
    let respuesta = "Lo sentimos estamos teniendo problemas internos por favor intentalo mas tarde."
    return respuesta;
  }
}

const driverChat = async(chatId, user) => {
  try {
    const response = await AIInteraction(historialUser[chatId]);
    let respuesta = response.choices[0].message.content;
  
    const aux = historialUser[chatId];
    const mensaje = { role: 'assistant', content: respuesta };
    aux.push(mensaje);
    historialUser[chatId] = aux;
    if (respuesta.includes('function:') || respuesta.includes('funcion:') || respuesta.includes('"function:')) {
      const textoLimpiado = respuesta.replace(/[^a-zA-Z0-9:, -_áéíóúñÑ|!]/g, '');
      const cantidadDeDosPuntos = textoLimpiado.split(':').length - 1;
      const functionParams = textoLimpiado.split(':')[cantidadDeDosPuntos].split(',');
      if (functionParams[0] === 'createDriver') {
        const item = {
          cedula: functionParams[3],
          vehiculo: functionParams[4],
          telefono: functionParams[2],
          usuario_t: user,
          estado: 'libre',
          placa: functionParams[5],
          nombre: functionParams[1],
          status: false,
          chat_id: chatId,
          block: false
        };
        respuesta = await bd.createDriver(item);
      }
    }
    return respuesta;
  } catch (error) {
    console.log(error)
    delete historialUser[chatId];
    return "Lo sentimos estamos teniendo problemas internos por favor intentalo mas tarde."
  }

}

export {
    quitarTildes,
    startAssistant,
    AIInteraction,
    chat,
    driverChat,
    historialUser

}