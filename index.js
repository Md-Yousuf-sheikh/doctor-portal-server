const express = require('express')
const { MongoClient } = require('mongodb');
const app = express()
var cors = require('cors')
require('dotenv').config()
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());


// Mongodb user pass link 
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.trmxc.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
// Mongo Client
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });


// Mongo function

async function run() {

    try {
        await client.connect();
        const database = client.db('doctors_portal');
        const appointmentCollection = database.collection('appointments');
        // user collection
        const usersCollection = database.collection('users');

        // Get post 
        app.get('/appointments', async (req, res) => {
            const email = req.query.email;
            const date = new Date(req.query.date).toLocaleDateString();
            const query = { email: email, date: date };
            const curser = appointmentCollection.find(query);
            const appointments = await curser.toArray();
            res.json(appointments);
        })

        //  check admin states
        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            let isAdmin = false;
            if (user?.role === 'admin') {
                isAdmin = true;
            }
            res.json({ admin: isAdmin })
        })

        //  Use to post appointment
        app.post('/appointments', async (req, res) => {
            const appointment = req.body;
            const result = await appointmentCollection.insertOne(appointment)
            res.json(result)

        })
        //  use to post users
        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            console.log(result);
            res.json(result);
        })

        // user update and insert   (upsert)
        app.put('/users', async (req, res) => {
            const user = req.body;
            const filter = { email: user.email };
            const options = { upsert: true };
            const updateDoc = { $set: user };
            const result = await usersCollection.updateOne(filter, updateDoc, options);
            res.json(result)
        })

        // Admin user PUT
        app.put('/users/admin', async (req, res) => {
            const user = req.body;

            const filter = { email: user.email };
            const updateDoc = { $set: { role: 'admin' } };
            const result = await usersCollection.updateOne(filter, updateDoc);
            res.json(result);
        })

    }
    // Finally
    finally {
        // await client.close();
    }



}
run().catch(console.dir)


app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})
