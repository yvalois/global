import _bot from '@bot-whatsapp/bot'
const { createProvider } = _bot
import BaileysProvider from '@bot-whatsapp/provider/baileys'
import * as AI_functions from "./AI_functions.js"
const provider = createProvider(BaileysProvider)


let whatsappUriBase = "https://api.whatsapp.com/send?phone="
let first = {}

const verifyMessage = async(number) => {
    let mensaje="Felicitaciones haz sido vericado, ¿Deseas solicitar un servicio?"
    AI_functions.startAssistant(number, "registered")
    let aux = AI_functions.historialUser[number]
    let _new = {"role":"assistant", "content": mensaje}
    aux.push(_new)
    AI_functions.historialUser[number] = aux
    await provider.sendMessage(number, mensaje, {})
}


const BlockMessage = async(number, message) => {
    await provider.sendMessage(number, message, {})
}


const viaje_message = async(direccion1,direccion2,number,descripcion) => {
    let mensaje = `Se ha creado tu viaje
Inicio del viaje: ${direccion1}
Finalizacion del viaje: ${direccion2}
detalles: ${descripcion}
Numero: ${number.split('57')[1]}
Tarifa del viaje: A convenir

Si deseas cancelar escribe "cancelar".`
    await provider.sendMessage(number, mensaje, {})
    return mensaje
}
const viaje_aceptado_message = async(conductor, celularD, placa, vehiculo, number) =>{
    let mensaje = `Tu viaje ha sido aceptado
Conductor: ${conductor}.
Numero: ${celularD}.
Placa: ${placa}.
Vehiculo: ${vehiculo}.`

    await provider.sendMessage(number, mensaje, {})

    return mensaje
}

const end_message= async(number) =>{
    let mensaje = `Su viaje ha sido finalizado, si tienes algun inconveniente por favor contactate con: xxx-xxx-xxxx`
    await provider.sendMessage(number, mensaje, {})
}

const end_message_information = async(number) => {
    await provider.sendMessage(number, "Viaje finalizado, ya puedes solicitar otro", {})
}
const cancel_message= async(number)=>{
    await provider.sendMessage(number, "Su viaje fue cancelado", {})
}

const cancel_message2= async(number)=>{
    await provider.sendMessage(number, "No te encuentras en viaje.", {})
}

const no_cancel_message= async(number)=>{
    await provider.sendMessage(number, "Lo sentimos no puedes cancelar el viaje cuando ya se ha asignado un conductor", {})
}


const time_cancel = async(number) => {
    await provider.sendMessage(number, "El arrendamiento no ha sido aceptado por tarifa, intenta con un valor estimado más acorde a la distancia de recorrido.", {})

}
    
const time_end = async(number) =>{
    let mensaje = `Por temas de protocolo, hemos finalizado su viaje esto con el fin de mantener un sistema funcional. Si aun se encuentra en el servicio no hay ningun problema podra culminarlo. Este mensaje solo es informativo.`
    await provider.sendMessage(number, mensaje, {})

}



export {
    provider,
    verifyMessage,
    viaje_message,
    viaje_aceptado_message,
    end_message,
    end_message_information,
    cancel_message,
    time_cancel,
    time_end,
    first,
    BlockMessage,
    no_cancel_message,
    cancel_message2
}