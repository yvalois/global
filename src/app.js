const { createBot, createProvider, createFlow, addKeyword } = require('@bot-whatsapp/bot')

const QRPortalWeb = require('@bot-whatsapp/portal')
const BaileysProvider = require('@bot-whatsapp/provider/baileys')
const MockAdapter = require('@bot-whatsapp/database/mock')

const AIClass = require('./services/ai');
const flowsW = require('./flows');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { provider } = require('./utils/whatsapp');
const  db = require('./utils/bd')
const  wpp = require('./utils/whatsapp')
const  AI_functions = require('./utils/AI_functions')
const {bot} = require("./utils/telegram")
const multer = require("multer")


require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
const upload = multer({ dest: 'uploads/' });
// Utiliza el enrutador para las peticiones POST


// Inicia el servidor
const PORT = process.env.PORT || 5003;
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
    const rides = await db.getRides(); // Asumiendo que envías los datos del conductor a actualizar en el body de la petición
    res.json(rides);
  } catch (error) {
    console.log(error)
    res.status(400).json({ message: "Lo sentimos, al parecer hubo un error. Inténtalo más tarde." });
  }
});

app.put('/global/api/updateuser',upload.single('miFormData'), async(req, res) => {
  try {
    const updatedUser = await db.updateUser(req.body.number, req.body.status); // Asumiendo que envías los datos del usuario a actualizar en el body de la petición
    res.json(updatedUser);
  } catch (error) {
    console.log(error)
    res.status(400).json({ message: "Lo sentimos, al parecer hubo un error. Inténtalo más tarde." });
  }

});

app.delete('/global/api/deleteuser',upload.single('miFormData'), async(req, res) => {
  try {
    const deletedUser = await db.deleteUser(req.body.number); // Asumiendo que envías el id del usuario a eliminar como un query parameter
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
    const updatedDriver = await db.updateDriver(req.body.number, req.body.status); // Asumiendo que envías los datos del conductor a actualizar en el body de la petición
    res.json(updatedDriver);
  } catch (error) {
    console.log(error)
    res.status(400).json({ message: "Lo sentimos, al parecer hubo un error. Inténtalo más tarde." });
  }

});

app.delete('/global/api/deletedriver',upload.single('miFormData'), async(req, res) => {
  try {
    const deletedDriver = await db.deleteDriver(req.body.number); // Asumiendo que envías el id del conductor a eliminar como un query parameter
    res.json(deletedDriver);
  } catch (error) {
    console.log(error)
    res.status(400).json({ message: "Lo sentimos, al parecer hubo un error. Inténtalo más tarde." });
  }

});

app.put('/global/api/blockuser',upload.single('miFormData'), async(req, res) => {
  try {
    const blockUser = await db.blockUser(req.body.number, req.body.block); // Asumiendo que envías los datos del conductor a actualizar en el body de la petición
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

    QRPortalWeb()
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
