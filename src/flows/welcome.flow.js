import _bot from '@bot-whatsapp/bot'
const { addKeyword, EVENTS } = _bot
import conversationalLayer from "../layers/conversational.layer.js"
import mainLayer from "../layers/main.layer.js"

/**
 * Este flow responde a cualquier palabra que escriban
 */
export default addKeyword(EVENTS.WELCOME)
    .addAction(conversationalLayer)
    .addAction(mainLayer)