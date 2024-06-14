import { MongoClient } from 'mongodb'
import  * as whatsapp from './whatsapp.js'
import  * as telegram from './telegram.js'
// require('dotenv').config();

const db_user = process.env.DB_USER;
const db_pass = process.env.DB_PASS;



const client = new MongoClient(`mongodb+srv://${db_user}:${db_pass}@global-transport.lunod3j.mongodb.net/`);
const dbname = client.db('transporte');
const collection_name = dbname.collection('Users');
const collection_viajes = dbname.collection('Viajes');
const collection_viajes_t = dbname.collection('Viajes_Terminados');
const collection_conductores = dbname.collection('Conductores');


const createUser = async (user, name) => {
    const item = {
        nombre: name,
        number: user,
        status: true,
        block: false,
        admin: false
    };
    const created = await collection_name.insertOne(item);
    if (created) {
        return 'Usuario creado correctamente, Ya puedes empezar a solicitar tus viajes.'
    } else {
        return 'Error al crear el usuario';
    }
}

const createDriver = async (item) => {
    const created = await collection_conductores.insertOne(item);
    if (created) {
        return `Usuario creado correctamente, a continuación estarás pasando por un momento de verificación, cuando hayamos validado tu verificación te enviaremos un mensaje.`
    } else {
        return 'Error al crear el usuario'
    }
}

const checkUser = async(user) =>{
    const myquery = { number: user };
    const items = await collection_name.findOne(myquery);
    if (items) {
        return true
    } else {
        return false
    }
}

const checkVerified = async (user) => {
    const myquery = { number: user };
    const items = await collection_name.findOne(myquery);
    return items.status
}

const checkBlock = async (user) => {
    const myquery = { number: user };
    const items = await collection_name.findOne(myquery);
    return items.block
}

const checkDBlock = async (user) => {
    const myquery = { chat_id: user };
    const items = await collection_conductores.findOne(myquery);

    return items.block
}

const getUsers = async () => {
    const users = await collection_name.find().toArray();
    return users
}

const getRides = async () => {
    const rides = await collection_viajes_t.find().toArray();
    return rides
}

const getRidesU = async (number) => {
    const Ridequery = { telefono: number };

    const rides = await collection_viajes.find(Ridequery).toArray();
    return rides
}

const getDrivers = async () => {
    const drivers = await collection_conductores.find().toArray();
    for (const usuario of drivers) {
        usuario._id = usuario._id
    }
    return drivers
}

const updateDriver = async (number, status) => {
    const myquery = { chat_id: parseInt(number) };
    if (status === 'false') {
        const newvalues = { $set: { status: false } };
        await collection_conductores.updateOne(myquery, newvalues);
        return "Felicidades"

    } else if (status === 'true') {
        const newvalues = { $set: { status: true } };
        await collection_conductores.updateOne(myquery, newvalues);
        const driver = await collection_conductores.findOne(myquery);
        await telegram.verified_message(driver.chat_id);
        return "Felicidades"

    }
}

const deleteDriver = async (number) => {
    const myquery = { chat_id: parseInt(number) };
    await collection_conductores.deleteOne(myquery);
    return "Felicidades"
}

const updateUser = async (number, status) => {

    const myquery = { number: number };
    if (status === 'false') {
        
        const newvalues = { $set: { status: false } };
        await collection_name.updateOne(myquery, newvalues);
    } else if (status === 'true') {
        const newvalues = { $set: { status: true } };
        await collection_name.updateOne(myquery, newvalues);
        whatsapp.verifyMessage(number);
        return "Felicidades"
    }
}

const blockUser = async (number, block) => {
    const myquery = { number: number };
    let message 
    if (block === 'false') {
        message = "Tu cuenta ha sido desbloqueada ya puedes disfrutar de nuestro servicio."
        const newvalues = { $set: { block: false } };
        await collection_name.updateOne(myquery, newvalues);
    } else if (block === 'true') {
        message = "Debido a un comportamiento inadecuado estas siendo bloqueado."
        const newvalues = { $set: { block: true } };
        await collection_name.updateOne(myquery, newvalues);
    }
    whatsapp.BlockMessage(number, message);



}

const blockDriver= async (number, status) => {

    const myquery = { chat_id: parseInt(number) };
    let message 
    const driver = await collection_conductores.findOne(myquery);

    if (status === 'false') {
        message = "Tu cuenta ha sido desbloqueada ya puedes disfrutar de nuestro servicio."
        const newvalues = { $set: { block: false } };
        await collection_conductores.updateOne(myquery, newvalues);

    } else if (status === 'true') {
        message ="Debido a un comportamiento inadecuado estas siendo bloqueado."
        const newvalues = { $set: { block: true } };
        await collection_conductores.updateOne(myquery, newvalues);
    }

    await telegram.block_message(driver.chat_id, message);

    return "Felicidades"
}

const deleteUser = async (number) => {

    const myquery = { number: number };
    await collection_name.deleteOne(myquery);

    return deleteUser
}

const createRide = async (item) => {
    const created = await collection_viajes.insertOne(item);

    return created
}

const getUser = async (number) => {
    const myquery = { number: number };
    const usuario = await collection_name.findOne(myquery);

    return usuario
}

const getRide = async (number) => {
    const Ridequery = { telefono: number };
    const viaje = await collection_viajes.findOne(Ridequery);

    return viaje
}

const end_update_ride = async (number, array) => {
    const Ridequery = { telefono: number };
    const newvaluesV = { $set: { finalizar: array } };
    await collection_viajes.updateOne(Ridequery, newvaluesV);

    return "Felicidades"
}

const getDriver = async (userT) => {
    const Driverquery = { chat_id: userT };
    const driver = await collection_conductores.findOne(Driverquery);
    // res.json(driver); retornar en expresss asi
    return driver
}

const deleteRide = async (number) => {
    const Ridequery = { telefono: number };
    await collection_viajes.deleteOne(Ridequery);
    //   res.json({ mensaje: 'Felicidades' }); retornar en expresss asi
    return "Felicidades"
}

const deleteRideby_id = async (_id) => {
    const Ridequery = { _id: _id };
    await collection_viajes.deleteOne(Ridequery);
    //   res.json({ mensaje: 'Felicidades' }); retornar en expresss asi
    return "Felicidades"
}

const create_end_rides = async (viaje) => {
    const create = await collection_viajes_t.insertOne(viaje);
    // res.json(create); retornar en expresss asi
    return create
}

const update_driver_status = async (status, userT) => {
    const Driverquery = { chat_id: userT };
    const newvalues = { $set: { estado: status } };
    await collection_conductores.updateOne(Driverquery, newvalues);
    // res.json({ mensaje: 'Felicidades' }); retornar en expresss asi
    return "Felicidades"
}

const findRideById = async (_id) => {
    const myquery = { _id: _id };
    const ride_info = await collection_viajes.findOne(myquery);
    // res.json(ride_info); retornar en expresss asi
    return ride_info
}

const accept_ride = async (driver_n, user_t, placa, telefono, cedula, vehiculo, Did, _id) => {
    const myquery = { _id: _id };
    const currentDate = new Date();

    const day = currentDate.getDate();
    const month = currentDate.getMonth() + 1; // Los meses en JavaScript son base 0, así que se suma 1
    const year = currentDate.getFullYear();
    
    const formattedDate = `${day}/${month}/${year}`;
    const newvalues = {
        $set: {
            estado: 'aceptado',
            conductor: driver_n,
            usuario_t:user_t,
            placa: placa,
            d_telefono: telefono,
            cedula: cedula,
            vehiculo: vehiculo,
            id_Conductor: Did,
            fecha: formattedDate,
        },
    };
    await collection_viajes.updateOne(myquery, newvalues);
    // res.json({ mensaje: 'Felicidades' }); retornar en expresss asi
    return "Felicidades"
}

const checkDriver = async (user) => {
    const myquery = { chat_id: user };
    const items = await collection_conductores.findOne(myquery);
    if (items != null) {
        return true;
    } else {
        return false;
    }
}

const checkVerifiedD = async (user) => {
    const myquery = { chat_id: user };
    const items = await collection_conductores.findOne(myquery);
    // res.json(items.status); retornar en expresss asi
    return items.status
}



export {
    createUser,
    createDriver,
    checkUser,
    checkVerified,
    getUsers,
    getDrivers,
    updateDriver,
    deleteDriver,
    updateUser,
    deleteUser,
    createRide,
    getUser,
    getRide,
    end_update_ride,
    getDriver,
    deleteRide,
    create_end_rides,
    update_driver_status,
    findRideById,
    accept_ride,
    checkDriver,
    checkVerifiedD,
    blockDriver,
    blockUser,
    checkBlock,
    checkDBlock,
    getRides,
    getRidesU,
    deleteRideby_id
  };