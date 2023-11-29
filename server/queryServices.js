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
							// SEQUENTIAL TIME
							try {
								await client.connect();
								const db = client.db(dbName);
								const collection = db.collection(tableName);

								const result = await collection.find().toArray();

								const startTime = performance.now();
								let filtered = [];
								result.forEach((elem) => {
									const val = elem.value.split('#');
									let ok = true;
									let error = '';

									conditions.forEach((condition) => {
										const [columnName, operator, value] = condition.split(/\s*(=|<|>)\s*/);
										const index = table.columns?.findIndex((col) => col.name === columnName);
										const isInt = table.columns[index].type === 'int';

										if (index || index === 0) {
											let conditionResult;

											if (operator === '=') {
												conditionResult =
													index === 0
														? isInt
															? parseInt(val[index]) === parseInt(elem._id)
															: val[index] === elem._id
														: isInt
														? parseInt(val[index - 1]) === parseInt(value)
														: val[index - 1] === value;
											} else if (operator === '>') {
												conditionResult =
													index === 0
														? isInt
															? parseInt(val[index]) > parseInt(elem._id)
															: val[index] > elem._id
														: isInt
														? parseInt(val[index - 1]) > parseInt(value)
														: val[index - 1] > value;
											} else if (operator === '<') {
												conditionResult =
													index === 0
														? isInt
															? parseInt(val[index]) < parseInt(elem._id)
															: val[index] < elem._id
														: isInt
														? parseInt(val[index - 1]) < parseInt(value)
														: val[index - 1] < value;
											}
											// Update ok based on the condition result
											ok = ok && conditionResult;
											// If any condition fails, break out of the loop early
											if (!ok) {
												return;
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
								const endTime = performance.now();
								console.log(`Sequential time: ${endTime - startTime} ms`);
								return res.status(200).json(parsedData);
							} catch (err) {
								console.error('Error in query!:', err);
								return res.status(500).send('Error in query!');
							} finally {
								await client.close();
							}
						} else {
							// INDEX TIME
							const times = [];
							let mappedResults = '';
							let noIndexConditions = [];
							for (const condition of conditions) {
								const startTime = performance.now();
								const [columnName, operator, value] = condition.split(/\s*(=|<|>)\s*/);
								// Check if the column has an index
								const tableIndex = table.indexes.find((index) => index.columns.includes(columnName));

								const endTime = performance.now();
								times.push(endTime - startTime);

								// if index is available scan it's contents
								if (tableIndex) {
									try {
										await client.connect();
										const database = client.db(dbName);
										const collection = database.collection(tableIndex.name);

										const filter = {};
										filter['_id'] = {};

										if (operator === '=') {
											filter['_id'] = value;
										} else if (operator === '<') {
											filter['_id']['$lt'] = value;
										} else if (operator === '>') {
											filter['_id']['$gt'] = value;
										}

										const result = await collection.find(filter).toArray();

										const startTime1 = performance.now();
										mappedResults = result
											.map((element) => (element.value ? element.value : null))
											.filter(Boolean)
											.join('#');
										const endTime1 = performance.now();
										times.push(endTime1 - startTime1);
									} finally {
										await client.close();
									}
								} else {
									const startTime1 = performance.now();

									const cond = [columnName, operator, value];
									noIndexConditions.push(cond);

									const endTime1 = performance.now();
									times.push(endTime1 - startTime1);
								}
							}
							if (mappedResults) {
								const startTime1 = performance.now();

								const ids = mappedResults.split('#');

								const endTime1 = performance.now();
								times.push(endTime1 - startTime1);
								try {
									await client.connect();
									const database = client.db(dbName);
									const collection = database.collection(tableName);

									const filter = {};
									filter['_id'] = {};
									filter['_id']['$in'] = ids;

									const result = await collection.find(filter).toArray();

									const startTime2 = performance.now();
									let filtered = [];
									let resultConditions;
									// Process the result array based on noIndexConditions
									if (noIndexConditions.length > 0) {
										resultConditions = applyNoIndexConditions(result, noIndexConditions, table);
									} else {
										resultConditions = result;
									}

									for (const elem of resultConditions) {
										if (selectedColumns[0] === '*') {
											filtered.push(elem);
										} else {
											let editedElem = { _id: '', value: '' };
											const val = elem.value.split('#');
											selectedColumns.forEach((column) => {
												const index = table.columns.findIndex((col) => col.name === column);
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
									// remove duplicates if distinct
									if (isDistinct) {
										filtered = new Set(filtered.map((obj) => JSON.stringify(obj)));
										filtered = Array.from(filtered).map((str) => JSON.parse(str));
									}

									const parsedData = getReturnData(filtered);
									const endTime2 = performance.now();
									times.push(endTime2 - startTime2);

									const time = times.reduce((accumulator, currentValue) => {
										return accumulator + currentValue;
									}, 0);
									console.log(`Index time: ${time} ms`);
									return res.status(200).json(parsedData);
								} finally {
									await client.close();
								}
							} else {
								// if no index available, go back to sequential
								try {
									await client.connect();
									const db = client.db(dbName);
									const collection = db.collection(tableName);

									const result = await collection.find().toArray();

									const startTime = performance.now();
									let filtered = [];
									result.forEach((elem) => {
										const val = elem.value.split('#');
										let ok = true;
										let error = '';

										conditions.forEach((condition) => {
											const [columnName, operator, value] = condition.split(/\s*(=|<|>)\s*/);
											const index = table.columns?.findIndex((col) => col.name === columnName);
											const isInt = table.columns[index].type === 'int';

											if (index || index === 0) {
												let conditionResult;

												if (operator === '=') {
													conditionResult =
														index === 0
															? isInt
																? parseInt(val[index]) === parseInt(elem._id)
																: val[index] === elem._id
															: isInt
															? parseInt(val[index - 1]) === parseInt(value)
															: val[index - 1] === value;
												} else if (operator === '>') {
													conditionResult =
														index === 0
															? isInt
																? parseInt(val[index]) > parseInt(elem._id)
																: val[index] > elem._id
															: isInt
															? parseInt(val[index - 1]) > parseInt(value)
															: val[index - 1] > value;
												} else if (operator === '<') {
													conditionResult =
														index === 0
															? isInt
																? parseInt(val[index]) < parseInt(elem._id)
																: val[index] < elem._id
															: isInt
															? parseInt(val[index - 1]) < parseInt(value)
															: val[index - 1] < value;
												}
												// Update ok based on the condition result
												ok = ok && conditionResult;
												// If any condition fails, break out of the loop early
												if (!ok) {
													return;
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
													const index = table.columns?.findIndex(
														(col) => col.name === column
													);
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
									const endTime = performance.now();
									console.log(`Index(sequential) time: ${endTime - startTime} ms`);
									return res.status(200).json(parsedData);
								} catch (err) {
									console.error('Error in query!:', err);
									return res.status(500).send('Error in query!');
								} finally {
									await client.close();
								}
							}
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

// Function to apply conditions that don't have an index
function applyNoIndexConditions(elements, conditions, table) {
	return elements.filter((elem) => {
		const val = elem.value.split('#');
		let ok = true;
		let error = '';

		conditions.forEach((cond) => {
			const [colName, op, condValue] = cond;
			const index = table.columns.findIndex((col) => col.name === colName);
			const isInt = table.columns[index].type === 'int';

			if (index || index === 0) {
				let conditionResult;
				if (op === '=') {
					conditionResult =
						index === 0
							? isInt
								? parseInt(val[index]) === parseInt(elem._id)
								: val[index] === elem._id
							: isInt
							? parseInt(val[index - 1]) === parseInt(condValue)
							: val[index - 1] === condValue;
				} else if (op === '>') {
					conditionResult =
						index === 0
							? isInt
								? parseInt(val[index]) > parseInt(elem._id)
								: val[index] > elem._id
							: isInt
							? parseInt(val[index - 1]) > parseInt(condValue)
							: val[index - 1] > condValue;
				} else if (op === '<') {
					conditionResult =
						index === 0
							? isInt
								? parseInt(val[index]) < parseInt(elem._id)
								: val[index] < elem._id
							: isInt
							? parseInt(val[index - 1]) < parseInt(condValue)
							: val[index - 1] < condValue;
				}
				// Update ok based on the condition result
				ok = ok && conditionResult;
				// If any condition fails, break out of the loop early
				if (!ok) {
					return;
				}
			} else {
				error = 'Invalid columns!';
				return;
			}
		});
		if (error) {
			throw new Error(error);
		}
		return ok;
	});
}

module.exports = {
	getQueryData
};
