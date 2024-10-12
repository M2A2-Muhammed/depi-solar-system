const path = require('path');
const express = require('express');
const OS = require('os');
const bodyParser = require('body-parser');
const mongoose = require("mongoose");
const app = express();
const cors = require('cors');


app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '/')));
app.use(cors())

mongoose.connect(process.env.MONGO_URI, {
    user: process.env.MONGO_USERNAME,
    pass: process.env.MONGO_PASSWORD,
    useNewUrlParser: true,
    useUnifiedTopology: true
}, function (err) {
    if (err) {
        console.log("error!! " + err)
    } else {
        console.log("MongoDB Connection Successful")
    }
})

var Schema = mongoose.Schema;

var dataSchema = new Schema({
    name: String,
    id: Number,
    description: String,
    image: String,
    velocity: String,
    distance: String
});
var planetModel = mongoose.model('planets', dataSchema);



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
