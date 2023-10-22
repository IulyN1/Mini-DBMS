const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(
	bodyParser.urlencoded({
		extended: true
	})
);

const services = require('./services');

app.get('/', services.getData);
app.post('/database', services.createDatabase);
app.delete('/database/:name', services.dropDatabase);
app.post('/table', services.createTable);
app.delete('/table/:name', services.dropTable);
app.post('/index', services.createIndex);

const port = 5000;
app.listen(port, () => {
	console.log(`App listening on port ${port}`);
});
