const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = 'mongodb+srv://iulianp14:admin@cluster0.gt5aifw.mongodb.net/?retryWrites=true&w=majority';

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
	serverApi: {
		version: ServerApiVersion.v1,
		strict: true,
		deprecationErrors: true
	}
});

const getQueryData = (req, res) => {
	const dbName = req.query?.dbName;
	const sequential = req.query?.sequential;
	const query = req.query?.query;
	if (dbName && query) {
		if (sequential) {
			// now
		} else {
			// to do
		}
	} else {
		return res.status(400).send('Bad request!');
	}
};

module.exports = {
	getQueryData
};
