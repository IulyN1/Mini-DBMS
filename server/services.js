const fs = require('fs');
const { isUnique, toUpper } = require('./utils');

const filePath = 'catalog.json';

const getData = (_, res) => {
	fs.readFile(filePath, 'utf8', (err, data) => {
		if (err) {
			console.error('Error reading file:', err);
			return res.status(500).send('Error reading catalog!');
		}

		try {
			const catalog = JSON.parse(data);
			return res.status(200).json(catalog);
		} catch (error) {
			console.error('Error parsing JSON:', error);
			return res.status(500).send('Error parsing JSON!');
		}
	});
};

const createDatabase = (req, res) => {
	const name = toUpper(req.body?.name);
	if (name) {
		fs.readFile(filePath, 'utf8', (err, data) => {
			if (err) {
				console.error('Error reading file:', err);
				return res.status(500).send('Error reading catalog!');
			}

			try {
				const catalog = JSON.parse(data);
				if (isUnique(catalog.databases, name)) {
					catalog.databases.push({ name, type: 'database', tables: [] });

					fs.writeFile(filePath, JSON.stringify(catalog), (err) => {
						if (err) {
							console.error('Error writing file:', err);
							return res.status(500).send('Error writing file');
						}

						return res.status(200).send('Database was created successfully!');
					});
				} else {
					return res.status(400).send('Database already exists!');
				}
			} catch (error) {
				console.error('Error parsing JSON:', error);
				return res.status(500).send('Error parsing JSON!');
			}
		});
	} else {
		return res.status(400).send('Bad request!');
	}
};

const dropDatabase = (req, res) => {
	const name = toUpper(req.params?.name);
	if (name) {
		fs.readFile(filePath, 'utf8', (err, data) => {
			if (err) {
				console.error('Error reading file:', err);
				return res.status(500).send('Error reading catalog!');
			}

			try {
				const catalog = JSON.parse(data);
				const db = catalog.databases.find((el) => el.name === name);
				if (db) {
					const databases = catalog.databases.filter((el) => el.name !== name);
					catalog.databases = databases;

					fs.writeFile(filePath, JSON.stringify(catalog), (err) => {
						if (err) {
							console.error('Error writing file:', err);
							return res.status(500).send('Error writing file');
						}

						return res.status(200).send('Database was deleted successfully!');
					});
				} else {
					return res.status(404).send('Database not found!');
				}
			} catch (error) {
				console.error('Error parsing JSON:', error);
				return res.status(500).send('Error parsing JSON!');
			}
		});
	} else {
		return res.status(400).send('Bad request!');
	}
};

const createTable = (req, res) => {
	const name = toUpper(req.body?.name);
	const dbName = toUpper(req.body?.dbName);
	if (name && dbName) {
		fs.readFile(filePath, 'utf8', (err, data) => {
			if (err) {
				console.error('Error reading file:', err);
				return res.status(500).send('Error reading catalog!');
			}

			try {
				const catalog = JSON.parse(data);
				const db = catalog.databases.find((el) => el.name === dbName);
				if (db) {
					if (isUnique(db.tables, name)) {
						catalog.databases
							.find((el) => el.name === dbName)
							.tables.push({ name, type: 'table', columns: [], indexes: [] });

						fs.writeFile(filePath, JSON.stringify(catalog), (err) => {
							if (err) {
								console.error('Error writing file:', err);
								return res.status(500).send('Error writing file');
							}

							return res.status(200).send('Table was created successfully!');
						});
					} else {
						return res.status(400).send('Table already exists!');
					}
				} else {
					return res.status(404).send('Database not found!');
				}
			} catch (error) {
				console.error('Error parsing JSON:', error);
				return res.status(500).send('Error parsing JSON!');
			}
		});
	} else {
		return res.status(400).send('Bad request!');
	}
};

const dropTable = (req, res) => {
	const name = toUpper(req.body?.name);
	const dbName = toUpper(req.body?.dbName);
	if (name && dbName) {
		fs.readFile(filePath, 'utf8', (err, data) => {
			if (err) {
				console.error('Error reading file:', err);
				return res.status(500).send('Error reading catalog!');
			}

			try {
				const catalog = JSON.parse(data);
				const db = catalog.databases.find((el) => el.name === dbName);
				if (db) {
					const table = db.tables.find((el) => el.name === name);
					if (table) {
						const tables = db.tables.filter((el) => el.name !== name);
						catalog.databases.find((el) => el.name === dbName).tables = tables;

						fs.writeFile(filePath, JSON.stringify(catalog), (err) => {
							if (err) {
								console.error('Error writing file:', err);
								return res.status(500).send('Error writing file');
							}

							return res.status(200).send('Table was deleted successfully!');
						});
					} else {
						return res.status(404).send('Table not found!');
					}
				} else {
					return res.status(404).send('Database not found!');
				}
			} catch (error) {
				console.error('Error parsing JSON:', error);
				return res.status(500).send('Error parsing JSON!');
			}
		});
	} else {
		return res.status(400).send('Bad request!');
	}
};

const createIndex = (req, res) => {
	const name = toUpper(req.body?.name);
	const dbName = toUpper(req.body?.dbName);
	const tbName = toUpper(req.body?.tbName);
	if (name && dbName && tbName) {
		fs.readFile(filePath, 'utf8', (err, data) => {
			if (err) {
				console.error('Error reading file:', err);
				return res.status(500).send('Error reading catalog!');
			}

			try {
				const catalog = JSON.parse(data);
				const db = catalog.databases.find((el) => el.name === dbName);
				if (db) {
					const table = db.tables.find((el) => el.name === name);
					if (table) {
						if (isUnique(table.indexes, name)) {
							catalog.databases
								.find((el) => el.name === dbName)
								.tables.find((el) => el.name === tbName)
								.push({ name, type: 'index' });

							fs.writeFile(filePath, JSON.stringify(catalog), (err) => {
								if (err) {
									console.error('Error writing file:', err);
									return res.status(500).send('Error writing file');
								}

								return res.status(200).send('Index was created successfully!');
							});
						} else {
							return res.status(400).send('Index already exists!');
						}
					} else {
						return res.status(404).send('Table not found!');
					}
				} else {
					return res.status(404).send('Database not found!');
				}
			} catch (error) {
				console.error('Error parsing JSON:', error);
				return res.status(500).send('Error parsing JSON!');
			}
		});
	} else {
		return res.status(400).send('Bad request!');
	}
};

module.exports = { getData, createDatabase, dropDatabase, createTable, dropTable, createIndex };
