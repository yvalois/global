const {  addKeyword, EVENTS } = require('@bot-whatsapp/bot')

const conversationalLayer = ("src/layers/wpp/conversational.layer");
const mainLayer = ("src/layers/wpp/main.layer");

/**
 * Este flow responde a cualquier palabra que escriban
 */
module.exports = addKeyword(EVENTS.WELCOME)
    .addAction(conversationalLayer)
    .addAction(mainLayer)