const createDatabase = (req, res) => {
	const name = req.body?.name;
	if (name) {
		// do stuff
	}
	res.send('OK');
};

const dropDatabase = (req, res) => {
	const name = req.params?.name;
	if (name) {
		// do stuff
	}
	res.send('OK');
};

const createTable = (req, res) => {
	const name = req.body?.name;
	if (name) {
		// do stuff
	}
	res.send('OK');
};

const dropTable = (req, res) => {
	const name = req.params?.name;
	if (name) {
		// do stuff
	}
	res.send('OK');
};

const createIndex = (req, res) => {
	const name = req.body?.name;
	if (name) {
		// do stuff
	}
	res.send('OK');
};

module.exports = { createDatabase, dropDatabase, createTable, dropTable, createIndex };
