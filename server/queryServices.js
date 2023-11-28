const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = 'mongodb+srv://iulianp14:admin@cluster0.gt5aifw.mongodb.net/?retryWrites=true&w=majority';

const fs = require('fs');
const { catalogPath, getReturnData } = require('./utils');

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
	serverApi: {
		version: ServerApiVersion.v1,
		strict: true,
		deprecationErrors: true
	}
});

const sqlSelectRegex = /^SELECT\s+(DISTINCT\s+)?(.+)\s+FROM\s+(.+)\s+WHERE\s+(.+)$/i;
const conditionRegex = /\s+AND\s+/i;

const getQueryData = (req, res) => {
	const dbName = req.query?.dbName;
	const sequential = req.query?.sequential;
	const query = req.query?.query;
	if (dbName && query) {
		const match = query.match(sqlSelectRegex);
		if (match) {
			fs.readFile(catalogPath, 'utf8', async (err, data) => {
				if (err) {
					console.error('Error reading file:', err);
					return res.status(500).send('Error reading catalog!');
				}

				try {
					const catalog = JSON.parse(data);

					const isDistinct = match[1] ? match[1].trim() : ''; // Check if DISTINCT is present
					const selectedColumns = match[2].split(',').map((column) => column.trim());
					const tableName = match[3].trim();
					const conditions = match[4].split(conditionRegex).map((condition) => condition.trim());

					const table = catalog.databases
						.find((el) => el.name === dbName)
						.tables.find((el) => el.name === tableName);

					if (table) {
						if (sequential === 'true') {
							// Start the timer
							const startTime = performance.now();
							try {
								await client.connect();
								const db = client.db(dbName);
								const collection = db.collection(tableName);

								const result = await collection.find().toArray();
								let filtered = [];
								result.forEach((elem) => {
									const val = elem.value.split('#');
									let ok = false;
									let error = '';
									conditions.forEach((condition) => {
										const [columnName, operator, value] = condition.split(/\s*(=|<|>)\s*/);
										const index = table.columns?.findIndex((col) => col.name === columnName);
										const isInt = table.columns[index].type === 'int';
										if (index || index === 0) {
											if (operator === '=') {
												ok =
													index === 0
														? isInt
															? parseInt(val[index]) === parseInt(elem._id)
															: val[index] === elem._id
														: isInt
														? parseInt(val[index - 1]) === parseInt(value)
														: val[index - 1] === value;
											} else if (operator === '>') {
												ok =
													index === 0
														? isInt
															? parseInt(val[index]) > parseInt(elem._id)
															: val[index] > elem._id
														: isInt
														? parseInt(val[index - 1]) > parseInt(value)
														: val[index - 1] > value;
											} else if (operator === '<') {
												ok =
													index === 0
														? isInt
															? parseInt(val[index]) < parseInt(elem._id)
															: val[index] < elem._id
														: isInt
														? parseInt(val[index - 1]) < parseInt(value)
														: val[index - 1] < value;
											}
										} else {
											error = 'Invalid columns!';
											return;
										}
									});
									if (error) {
										return res.status(400).send(error);
									}
									if (ok) {
										if (selectedColumns[0] === '*') {
											filtered.push(elem);
										} else {
											let editedElem = { _id: '', value: '' };
											const val = elem.value.split('#');
											selectedColumns.forEach((column) => {
												const index = table.columns?.findIndex((col) => col.name === column);
												if (!editedElem._id) {
													editedElem._id = index === 0 ? elem._id : val[index - 1];
												} else {
													editedElem.value += index === 0 ? elem._id : val[index - 1];
													editedElem.value += '#';
												}
											});
											editedElem.value = editedElem.value.slice(0, -1);
											filtered.push(editedElem);
										}
									}
								});
								// remove duplicates if distinct
								if (isDistinct) {
									filtered = new Set(filtered.map((obj) => JSON.stringify(obj)));
									filtered = Array.from(filtered).map((str) => JSON.parse(str));
								}
								const parsedData = getReturnData(filtered);
								// Stop the timer
								const endTime = performance.now();
								console.log(`Sequential time: ${endTime - startTime} ms`);
								return res.status(200).json(parsedData);
							} catch (err) {
								console.error('Error inserting in table!:', err);
								return res.status(500).send('Error inserting in table!');
							} finally {
								await client.close();
							}
						} else {
							// Start the timer
							const startTime = performance.now();
							const parsedData = [];
							// Stop the timer
							const endTime = performance.now();
							console.log(`Index time: ${endTime - startTime} ms`);
							return res.status(200).json(parsedData);
						}
					} else {
						return res.status(400).send('Invalid table!');
					}
				} catch (error) {
					console.error('Error parsing JSON:', error);
					return res.status(500).send('Error parsing JSON!');
				}
			});
		} else {
			return res.status(400).send('Invalid SQL command!');
		}
	} else {
		return res.status(400).send('Bad request!');
	}
};

module.exports = {
	getQueryData
};
