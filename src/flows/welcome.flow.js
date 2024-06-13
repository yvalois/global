const {  addKeyword, EVENTS } = require('@bot-whatsapp/bot')

const conversationalLayer = require("../layers/conversational.layer");
const mainLayer = require("../layers/main.layer");

/**
 * Este flow responde a cualquier palabra que escriban
 */
module.exports = addKeyword(EVENTS.WELCOME)
    .addAction(conversationalLayer)
    .addAction(mainLayer)