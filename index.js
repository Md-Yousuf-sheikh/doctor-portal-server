const express = require('express')
const { MongoClient } = require('mongodb');
const app = express()
var cors = require('cors')
require('dotenv').config()
const port = process.env.PORT || 5000;
const ObjectId = require('mongodb').ObjectId;
const fileUpload = require('express-fileupload');
const { json } = require('express');


app.use(cors());
app.use(express.json());
app.use(fileUpload());

// Mongodb user pass link 
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.trmxc.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
// Mongo Client
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

//  
const stripe = require("stripe")(process.env.STRIPE_SECRET)

// Mongo function

async function run() {

    try {
        await client.connect();
        const database = client.db('doctors_portal');
        const appointmentCollection = database.collection('appointments');
        // user collection
        const usersCollection = database.collection('users');
        const doctorsCollection = database.collection('doctors')

        // Get post 
        app.get('/appointments', async (req, res) => {
            const email = req.query.email;
            const date = new Date(new Date(req.query.date).valueOf() - 86400000).toLocaleDateString();
            // (new Date(req.query.date).valueOf() - 86400000)
            const query = { email: email, date: date };
            const curser = await appointmentCollection.find(query);
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
            res.json(result);
        })
        //  get single Id
        app.get('/appointments/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await appointmentCollection.findOne(query);
            res.json(result)
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

        // appointments
        app.put('/appointments/:id', async (req, res) => {
            const id = req.params.id;
            const payment = req.body;
            const filter = { _id: ObjectId(id) };
            const updateDoc = {
                $set: {
                    payment: payment
                }
            }
            const result = await appointmentCollection.updateOne(filter, updateDoc);
            res.json(result)
        })

        // Post stripe
        app.post("/create-payment-intent", async (req, res) => {
            const paymentInfo = req.body;
            const amount = paymentInfo.price * 100;
            // Create a PaymentIntent with the order amount and currency
            const paymentIntent = await stripe.paymentIntents.create({
                currency: 'usd',
                amount: amount,
                payment_method_types: ['card']

            });
            res.json({
                clientSecret: paymentIntent.client_secret,
            })
        })

        //  doctors collection
        app.post('/doctors', async (req, res) => {
            const name = req.body.name;
            const email = req.body.email;
            const pic = req.files.image;
            const picData = pic.data;
            const encodePic = picData.toString('base64');
            const imageBuffer = Buffer.from(encodePic, 'base64');
            const doctor = {
                name,
                email,
                image: imageBuffer
            }
            const result = await doctorsCollection.insertOne(doctor);
            res.json(result)
        })

        //  get doctor
        app.get('/doctors', async (req, res) => {
            const cursor = doctorsCollection.find({});
            const doctors = await cursor.toArray();
            res.json(doctors)
        })

        // Heroku login/create/push
        // 1. git add .
        // 2. git commit -m"fast"
        // 3. git push
        // 4. heroku login
        // 5. heroku create 
        // 6. git push heroku main
        // 7. go to heroku website 
        // 8. got settings 
        // 9. click => Reveal Config Vars
        // 10. Add => KEY  and VALUE (.env)




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
