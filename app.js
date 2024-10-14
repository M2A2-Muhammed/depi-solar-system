const path = require('path');
const express = require('express');
const OS = require('os');
const bodyParser = require('body-parser');
const mongoose = require("mongoose");
const app = express();
const cors = require('cors')
const fs = require('fs');

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '/')));
app.use(cors())

const pemFile = process.env.S3_MONGO_ACCESS_KEY || "global-bundle.pem"; // Path to your PEM file
const collection = process.env.MONGO_COLLECTION || "planets";
const data_file = process.env.S3_MONGO_DB_KEY || "superData.planets.json";
const uri = process.env.MONGO_URI ||
    `mongodb://db_admin:db_12345@solar-system-db.cluster-cxu20w2ieheu.us-east-2.docdb.amazonaws.com:27017/${db}?tls=true&tlsCAFile=${pemFile}&replicaSet=rs0&readPreference=secondaryPreferred&retryWrites=false`;


// Planet schema
const planetSchema = new mongoose.Schema({
    name: String,
    id: Number,
    description: String,
    image: String,
    velocity: String,
    distance: String
});

const Planet = mongoose.model(collection, planetSchema);

// Function to check and insert data
async function checkAndInsertData() {
    try {

        const count = await Planet.countDocuments();
        console.log('Document count:', count);

        if (count === 0) {
            console.log('Collection is empty. Inserting data...');
            const data = JSON.parse(fs.readFileSync(data_file, 'utf8'));

            // Remove _id if present
            const cleanedData = data.map(item => {
                delete item._id; // Remove the _id field
                return item;
            });

            await Planet.insertMany(data);
            console.log('Data inserted successfully');
        } else {
            console.log('Collection already contains data');
        }
    } catch (err) {
        console.error('Error checking or inserting data:', err);
    }
}



mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}, function (err) {
    if (err) {
        console.log("error!! " + err);
    } else {
        console.log("MongoDB Connection Successful");

        checkAndInsertData();
    }
});


app.post('/planet', function (req, res) {
    // console.log("Received Planet ID " + req.body.id)
    Planet.findOne({
        id: req.body.id
    }, function (err, planetData) {
        if (err) {
            //alert("Ooops, We only have 9 planets and a sun. Select a number from 0 - 9")
            res.send("Error in Planet Data")
        } else {
            res.send(planetData);
        }
    })
})

app.get('/', async (req, res) => {
    res.sendFile(path.join(__dirname, '/', 'index.html'));
});


app.get('/os', function (req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.send({
        "os": OS.hostname(),
        "env": process.env.NODE_ENV
    });
})

app.get('/live', function (req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.send({
        "status": "live"
    });
})

app.get('/ready', function (req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.send({
        "status": "ready"
    });
})

app.listen(3000, () => {
    console.log("Server successfully running on port - " + 3000);
})


module.exports = app;