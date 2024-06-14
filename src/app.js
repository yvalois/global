import 'dotenv/config'
import _bot from '@bot-whatsapp/bot'
const { createBot, createProvider, createFlow, addKeyword } = _bot
import QRPortalWeb from '@bot-whatsapp/portal'
import MockAdapter from '@bot-whatsapp/database/mock'
import AIClass from './services/ai/index.js';
import flowsW from './flows/index.js';
import express from 'express'
import cors from 'cors';
import bodyParser from 'body-parser';
import { provider } from './utils/whatsapp.js';
import  * as db from './utils/bd.js'
import  * as wpp from './utils/whatsapp.js'
import  * as AI_functions from './utils/AI_functions.js'
import {bot} from "./utils/telegram.js"
import multer from "multer"
import * as dotenv from 'dotenv';
dotenv.config();

// require('dotenv').config();

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
const upload = multer({ dest: 'uploads/' });
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});

app.get('/global/api/getusers', async(req, res) => {
  try {
    const users = await db.getUsers();
    res.json(users);
  } catch (error) {
    console.log(error)
    res.status(400).json({ message: "Lo sentimos, al parecer hubo un error. Inténtalo más tarde." });
  }
});

app.get('/global/api/getrides', async(req, res) => {
  try {
    const rides = await db.getRides();
    res.json(rides);
  } catch (error) {
    console.log(error)
    res.status(400).json({ message: "Lo sentimos, al parecer hubo un error. Inténtalo más tarde." });
  }
});

app.put('/global/api/updateuser',upload.single('miFormData'), async(req, res) => {
  try {
    const updatedUser = await db.updateUser(req.body.number, req.body.status); 
    res.json(updatedUser);
  } catch (error) {
    console.log(error)
    res.status(400).json({ message: "Lo sentimos, al parecer hubo un error. Inténtalo más tarde." });
  }

});

app.delete('/global/api/deleteuser',upload.single('miFormData'), async(req, res) => {
  try {
    const deletedUser = await db.deleteUser(req.body.number);
    res.json(deletedUser);
  } catch (error) {
    console.log(error)
    res.status(400).json({ message: "Lo sentimos, al parecer hubo un error. Inténtalo más tarde." });
  }

});

app.get('/global/api/getdrivers', async(req, res) => {
  try {
    const drivers = await db.getDrivers();
    res.json(drivers);
  } catch (error) {
    console.log(error)
    res.status(400).json({ message: "Lo sentimos, al parecer hubo un error. Inténtalo más tarde." });
  }

});

app.put('/global/api/updatedriver',upload.single('miFormData'), async(req, res) => {
  try {
    const updatedDriver = await db.updateDriver(req.body.number, req.body.status);
    res.json(updatedDriver);
  } catch (error) {
    console.log(error)
    res.status(400).json({ message: "Lo sentimos, al parecer hubo un error. Inténtalo más tarde." });
  }

});

app.delete('/global/api/deletedriver',upload.single('miFormData'), async(req, res) => {
  try {
    const deletedDriver = await db.deleteDriver(req.body.number);
    res.json(deletedDriver);
  } catch (error) {
    console.log(error)
    res.status(400).json({ message: "Lo sentimos, al parecer hubo un error. Inténtalo más tarde." });
  }

});

app.put('/global/api/blockuser',upload.single('miFormData'), async(req, res) => {
  try {
    const blockUser = await db.blockUser(req.body.number, req.body.block);
    res.json(blockUser);
  } catch (error) {
    console.log(error)
    res.status(400).json({ message: "Lo sentimos, al parecer hubo un error. Inténtalo más tarde." });
  }

});

app.put('/global/api/blockdriver',upload.single('miFormData'), async(req, res) => {
  try {
    const blockDriver = await db.blockDriver(req.body.number, req.body.block); // Asumiendo que envías los datos del conductor a actualizar en el body de la petición
    res.json(blockDriver);
  } catch (error) {
    console.log(error)
    res.status(400).json({ message: "Lo sentimos, al parecer hubo un error. Inténtalo más tarde." });
  }

});


const ai = new AIClass(process.env.OPEN_API_KEY, 'gpt-3.5-turbo-16k')


const main = async () => {
    const adapterDB = new MockAdapter()


    await createBot({
        database: adapterDB ,
        provider,
        flow: flowsW
    }, { extensions: { ai } })

    QRPortalWeb({port:3000})
    bot.launch()

    function borrar_conversaciones_antiguas() {
        const tiempo_actual = Date.now(); // time in seconds
        const conversaciones_para_borrar = [];
        for (const usuario in wpp.first) {
  
          const tiempo_transcurrido = tiempo_actual - wpp.first[usuario];
          if (tiempo_transcurrido > 300) {
  
            conversaciones_para_borrar.push(usuario);
          }
        }
      
        for (const usuario of conversaciones_para_borrar) {
          if (usuario in AI_functions.historialUser) {
            delete AI_functions.historialUser[usuario];
            delete wpp.first[usuario];
          }
        }
      }
      
  
      const umbralMinutos = 5;

      setInterval(borrar_conversaciones_antiguas, umbralMinutos * 60 * 1000);
}

main()
