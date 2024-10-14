const path = require('path');
const express = require('express');
const OS = require('os');
const bodyParser = require('body-parser');
const mongoose = require("mongoose");
const app = express();
const cors = require('cors');
const fs = require('fs');

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '/')));
app.use(cors())

// mongoose.connect(process.env.MONGO_URI, {
//     user: process.env.MONGO_USERNAME,
//     pass: process.env.MONGO_PASSWORD,
//     useNewUrlParser: true,
//     useUnifiedTopology: true
// }, function (err) {
//     if (err) {
//         console.log("error!! " + err)
//     } else {
//         console.log("MongoDB Connection Successful")
//     }
// })


const pemFile = process.env.S3_MONGO_ACCESS_KEY || "global-bundle.pem"; // Path to your PEM file
const db = process.env.MONGO_DB || "superData";
const collection = process.env.MONGO_COLLECTION || "planets";
const data_file = process.env.S3_MONGO_DB_KEY || "superData.planets.json";
const uri = process.env.MONO_URI ||
    "mongodb://db_admin:db_12345@solar-system-db.cluster-cxu20w2ieheu.us-east-2.docdb.amazonaws.com:27017/?tls=true&tlsCAFile=${pemFile}&replicaSet=rs0&readPreference=secondaryPreferred&retryWrites=false";

// MongoDB SSL options
const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true
};

mongoose.connect(uri, options)
    .then(async () => {
        console.log('Connected to MongoDB');

        // Create database and collection
        const db = mongoose.connection.useDb(db);

        var dataSchema = new mongoose.Schema({
            name: String,
            id: Number,
            description: String,
            image: String,
            velocity: String,
            distance: String
        });

        const Planet = db.model(collection, dataSchema);

        // Check if the collection is empty
        const count = await Planet.countDocuments();
        if (count === 0) {
            console.log('Collection is empty. Inserting data...');

            // Load data from JSON file
            const data = JSON.parse(fs.readFileSync(data_file, 'utf8'));

            // Insert data into the collection
            await Planet.insertMany(data);
            console.log('Data inserted successfully');
        } else {
            console.log('Collection already contains data');
        }
    })
    .catch(err => {
        console.error('MongoDB connection error:', err);
    });

var dataSchema = new mongoose.Schema({
    name: String,
    id: Number,
    description: String,
    image: String,
    velocity: String,
    distance: String
});

var planetModel = mongoose.model(collection, dataSchema);



app.post('/planet', function (req, res) {
    const requestedId = Number(req.body.id);
    console.log("requestedId: " + requestedId);

    // Validate ID (assuming valid IDs are 0-9)
    if (isNaN(requestedId) || requestedId < 0 || requestedId > 9) {
        return res.status(400).send('Invalid planet ID. Please provide a number between 0 and 9.');
    }

    planetModel.findOne({ id: requestedId })
        .then(planetData => {
            if (!planetData) {
                return res.status(404).send(`Planet with ID ${requestedId} not found.`);
            }
            res.send(planetData);
        })
        .catch(err => {
            console.error(err); // Log actual error details for debugging
            res.status(500).send('Internal server error. Please try again later.');
        });
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
