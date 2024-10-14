const path = require('path');
const express = require('express');
const OS = require('os');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const app = express();
const cors = require('cors');
const fs = require('fs');

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '/')));
app.use(cors());

const pemFile = process.env.S3_MONGO_ACCESS_KEY || "global-bundle.pem"; // Path to your PEM file
const collection = process.env.MONGO_COLLECTION || "planets";
const data_file = process.env.S3_MONGO_DB_KEY || "superData.planets.json";
const uri = process.env.MONGO_URI ||
    `mongodb://db_admin:db_12345@solar-system-db.cluster-cxu20w2ieheu.us-east-2.docdb.amazonaws.com:27017/solar-system-db?tls=true&tlsCAFile=${pemFile}&replicaSet=rs0&readPreference=secondaryPreferred&retryWrites=false`;

let Planet; // Declare variable outside

// MongoDB connection using Mongoose
mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    tls: true,
    tlsCAFile: pemFile,
}).then(async () => {
    console.log('Connected to MongoDB');

    // Define the data schema
    const dataSchema = new mongoose.Schema({
        _id: {
            type: mongoose.Schema.Types.ObjectId,
            auto: true // Automatically create an ObjectId if not provided
        },
        name: String,
        id: Number,
        description: String,
        image: String,
        velocity: String,
        distance: String
    });

    const Planet = mongoose.model(collection, dataSchema);

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
}).catch(err => {
    console.error('MongoDB connection error:', err);
});

// POST request to fetch planet data by ID
app.post('/planet', async (req, res) => {
    const requestedId = Number(req.body.id);
    console.log("requestedId: " + requestedId);

    // Validate ID (assuming valid IDs are 0-9)
    if (isNaN(requestedId) || requestedId < 0 || requestedId > 9) {
        return res.status(400).send('Invalid planet ID. Please provide a number between 0 and 9.');
    }

    try {
        const planetData = await Planet.findOne({ id: requestedId });
        if (!planetData) {
            return res.status(404).send(`Planet with ID ${requestedId} not found.`);
        }
        res.send(planetData);
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal server error. Please try again later.');
    }
});

// GET request to fetch planet data by ID
app.get('/test/:id', async (req, res) => {
    const requestedId = Number(req.params.id);
    console.log("requestedId: " + requestedId);

    // Validate ID (assuming valid IDs are 0-9)
    if (isNaN(requestedId) || requestedId < 0 || requestedId > 9) {
        return res.status(400).send('Invalid planet ID. Please provide a number between 0 and 9.');
    }

    try {
        const planetData = await Planet.findOne({ id: requestedId });
        if (!planetData) {
            return res.status(404).send(`Planet with ID ${requestedId} not found.`);
        }
        res.send(planetData);
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal server error. Please try again later.');
    }
});

// Serve the index.html file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// OS and server status endpoints
app.get('/os', (req, res) => {
    res.json({
        "os": OS.hostname(),
        "env": process.env.NODE_ENV
    });
});

app.get('/live', (req, res) => {
    res.json({
        "status": "live"
    });
});

app.get('/ready', (req, res) => {
    res.json({
        "status": "ready"
    });
});

// Start the server
app.listen(3000, () => {
    console.log("Server successfully running on port - " + 3000);
});

module.exports = app;
