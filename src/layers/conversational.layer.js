const { BotContext, BotMethods } = require("@bot-whatsapp/bot/dist/types");
const { handleHistory } = require("../../utils/handleHistory");

/**
 * Su funcion es almancenar en el state todos los mensajes que el usuario  escriba
 */
module.exports = async ({ body }, { state}) => {
    await handleHistory({ content: body, role: 'user' }, state)
}