const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = 'mongodb://127.0.0.1:27017';

const fs = require('fs');
const { catalogPath, getReturnData } = require('./utils');

const client = new MongoClient(uri, {
	serverApi: {
		version: ServerApiVersion.v1,
		strict: true,
		deprecationErrors: true
	}
});

const sqlSelectRegex =
	/^SELECT\s+(DISTINCT\s+)?(.+?)\s+FROM\s+(\w+)((?:\s+INNER\s+JOIN\s+\w+\s+ON\s+\w+\.\w+\s*=\s*\w+\.\w+)+)?(?:\s+WHERE\s+(.+))?\s*$/i;
const conditionRegex = /\s+AND\s+/i;
const joinRegex = /\s+INNER\s+JOIN\s+/i;

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
					const joins = match[4] ? match[4].split(joinRegex).slice(1) : []; // Extract join clauses
					const conditions = match[5]
						? match[5].split(conditionRegex).map((condition) => condition.trim())
						: [];

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

								// start timer
								const startTime = performance.now();

								// check joins
								let rez = [];
								for (const join of joins) {
									const [tb1, col1, tb2, col2] = join.split(' ')[2].split(/[.=]/);
									const joinResult = await sortMergeJoin(catalog, dbName, tb1, col1, tb2, col2, rez);
									//const joinResult = await hashJoin(catalog, dbName, tb1, col1, tb2, col2, rez);
									//const joinResult = await indexLoopJoin(catalog, dbName, tb1, col1, tb2, col2, rez);
									rez = joinResult;
								}

								// check conditions
								let filtered = [];
								const hasJoins = rez.length > 0;
								if (hasJoins) {
									rez.forEach((elem) => {
										let ok = true;
										let error = '';

										conditions.forEach((condition) => {
											const [column, operator, value] = condition.split(/\s*(=|<|>)\s*/);
											const [tableName, columnName] = column.split('.');
											const table = catalog.databases
												.find((el) => el.name === dbName)
												.tables.find((el) => el.name === tableName);
											const index = table.columns?.findIndex((col) => col.name === columnName);
											const val =
												index === 0
													? elem[`${tableName}._id`]
													: elem[`${tableName}.value`].split('#');

											if (index || index === 0) {
												let conditionResult;
												if (operator === '=') {
													conditionResult =
														index === 0 ? val === value : val[index - 1] === value;
												} else if (operator === '>') {
													conditionResult =
														index === 0 ? val > value : val[index - 1] > value;
												} else if (operator === '<') {
													conditionResult =
														index === 0 ? val < value : val[index - 1] < value;
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
											// check selected columns
											if (selectedColumns[0] === '*') {
												filtered.push(elem);
											} else {
												let editedElem = { _id: '', value: '' };
												selectedColumns.forEach((column) => {
													const [tableName, columnName] = column.split('.');
													const table = catalog.databases
														.find((el) => el.name === dbName)
														.tables.find((el) => el.name === tableName);

													const index = table.columns?.findIndex(
														(col) => col.name === columnName
													);
													const val =
														index === 0
															? elem[`${tableName}._id`]
															: elem[`${tableName}.value`].split('#');
													if (!editedElem._id) {
														editedElem._id = index === 0 ? val : val[index - 1];
													} else {
														editedElem.value += index === 0 ? val : val[index - 1];
														editedElem.value += '#';
													}
												});
												editedElem.value = editedElem.value.slice(0, -1);
												filtered.push(editedElem);
											}
										}
									});
								} else {
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
											// check selected columns
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
								}
								// remove duplicates if distinct
								if (isDistinct) {
									filtered = new Set(filtered.map((obj) => JSON.stringify(obj)));
									filtered = Array.from(filtered).map((str) => JSON.parse(str));
								}

								const parsedData = getReturnData(filtered, hasJoins);
								// end timer
								const endTime = performance.now();
								//console.log(`Sequential time: ${endTime - startTime} ms`);

								return res.status(200).json(parsedData);
							} catch (err) {
								console.error('Error in query!', err);
								return res.status(500).send('Error in query!');
							} finally {
								await client.close();
							}
						} else {
							// INDEX TIME
							const times = [];

							// start timer
							const startTime = performance.now();

							// check joins
							let rez = [];
							for (const join of joins) {
								const [tb1, col1, tb2, col2] = join.split(' ')[2].split(/[.=]/);
								const joinResult = await sortMergeJoin(catalog, dbName, tb1, col1, tb2, col2, rez);
								//const joinResult = await hashJoin(catalog, dbName, tb1, col1, tb2, col2, rez);
								//const joinResult = await indexLoopJoin(catalog, dbName, tb1, col1, tb2, col2, rez);
								rez = joinResult;
							}

							// check conditions
							let filtered = [];
							const hasJoins = rez.length > 0;
							if (hasJoins) {
								rez.forEach((elem) => {
									let ok = true;
									let error = '';

									conditions.forEach((condition) => {
										const [column, operator, value] = condition.split(/\s*(=|<|>)\s*/);
										const [tableName, columnName] = column.split('.');
										const table = catalog.databases
											.find((el) => el.name === dbName)
											.tables.find((el) => el.name === tableName);
										const index = table.columns?.findIndex((col) => col.name === columnName);
										const val =
											index === 0
												? elem[`${tableName}._id`]
												: elem[`${tableName}.value`].split('#');

										if (index || index === 0) {
											let conditionResult;
											if (operator === '=') {
												conditionResult =
													index === 0 ? val === value : val[index - 1] === value;
											} else if (operator === '>') {
												conditionResult = index === 0 ? val > value : val[index - 1] > value;
											} else if (operator === '<') {
												conditionResult = index === 0 ? val < value : val[index - 1] < value;
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
										// check selected columns
										if (selectedColumns[0] === '*') {
											filtered.push(elem);
										} else {
											let editedElem = { _id: '', value: '' };
											selectedColumns.forEach((column) => {
												const [tableName, columnName] = column.split('.');
												const table = catalog.databases
													.find((el) => el.name === dbName)
													.tables.find((el) => el.name === tableName);

												const index = table.columns?.findIndex(
													(col) => col.name === columnName
												);
												const val =
													index === 0
														? elem[`${tableName}._id`]
														: elem[`${tableName}.value`].split('#');
												if (!editedElem._id) {
													editedElem._id = index === 0 ? val : val[index - 1];
												} else {
													editedElem.value += index === 0 ? val : val[index - 1];
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

								const parsedData = getReturnData(filtered, hasJoins);
								// end timer
								const endTime = performance.now();
								//console.log(`Index time: ${endTime - startTime} ms`);

								return res.status(200).json(parsedData);
							}

							// check conditions
							let mappedResults = '';
							let noIndexConditions = [];
							for (const condition of conditions) {
								// start timer
								const startTime = performance.now();

								const [columnName, operator, value] = condition.split(/\s*(=|<|>)\s*/);
								// Check if the column has an index
								const tableIndex = table.indexes.find((index) => index.columns.includes(columnName));

								// end timer
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

										// start timer
										const startTime1 = performance.now();

										mappedResults = result
											.map((element) => (element.value ? element.value : null))
											.filter(Boolean)
											.join('#');

										// end timer
										const endTime1 = performance.now();
										times.push(endTime1 - startTime1);
									} finally {
										await client.close();
									}
								} else {
									// start timer
									const startTime1 = performance.now();

									const cond = [columnName, operator, value];
									noIndexConditions.push(cond);

									// end timer
									const endTime1 = performance.now();
									times.push(endTime1 - startTime1);
								}
							}
							if (mappedResults) {
								// start timer
								const startTime1 = performance.now();

								const ids = mappedResults.split('#');

								// end timer
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

									// start timer
									const startTime2 = performance.now();

									let filtered = [];
									let resultConditions;
									// Process the result array based on noIndexConditions
									if (noIndexConditions.length > 0) {
										resultConditions = applyNoIndexConditions(result, noIndexConditions, table);
									} else {
										resultConditions = result;
									}

									// check selected columns
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

									// end timer
									const endTime2 = performance.now();
									times.push(endTime2 - startTime2);

									const time = times.reduce((accumulator, currentValue) => {
										return accumulator + currentValue;
									}, 0);
									//console.log(`Index time: ${time} ms`);

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

									// start timer
									const startTime = performance.now();

									let filtered = [];
									result.forEach((elem) => {
										const val = elem.value.split('#');
										let ok = true;
										let error = '';

										conditions.forEach((condition) => {
											const [columnName, operator, value] = condition.split(/\s*(=|<|>)\s*/);
											const index = table.columns?.findIndex((col) => col.name === columnName);

											if (index || index === 0) {
												let conditionResult;
												if (operator === '=') {
													conditionResult =
														index === 0
															? val[index] === elem._id
															: val[index - 1] === value;
												} else if (operator === '>') {
													conditionResult =
														index === 0 ? val[index] > elem._id : val[index - 1] > value;
												} else if (operator === '<') {
													conditionResult =
														index === 0 ? val[index] < elem._id : val[index - 1] < value;
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

									// end timer
									const endTime = performance.now();
									//console.log(`Index(sequential) time: ${endTime - startTime} ms`);

									return res.status(200).json(parsedData);
								} catch (err) {
									console.error('Error in query!', err);
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

// Function to perform Sort-Merge Join
async function sortMergeJoin(catalog, dbName, table1, column1, table2, column2, inputResult) {
	try {
		// Start timer
		const startTime = performance.now();

		await client.connect();
		const db = client.db(dbName);

		const isFirstJoin = inputResult.length === 0;

		// Fetch data for table1 from MongoDB if we don't have input result
		const table1Data = isFirstJoin ? await db.collection(table1).find().toArray() : inputResult;

		let table2Data = [];
		if (column2) {
			// Fetch data for table2 from MongoDB only if column2 is defined
			table2Data = await db.collection(table2).find().toArray();
		}

		const col1Index = catalog.databases
			.find((el) => el.name === dbName)
			.tables.find((el) => el.name === table1)
			.columns.findIndex((col) => col.name === column1);
		const col2Index = catalog.databases
			.find((el) => el.name === dbName)
			.tables.find((el) => el.name === table2)
			.columns.findIndex((col) => col.name === column2);

		if (table1Data.length > 0 && table2Data.length > 0 && col1Index >= 0 && col2Index >= 0) {
			// Sort both tables based on the join key
			const col = isFirstJoin
				? col1Index === 0
					? '_id'
					: 'value'
				: col1Index === 0
				? `${table1}._id`
				: `${table1}.value`;
			const sortedTable1 = table1Data.sort((a, b) =>
				col1Index === 0 ? a[col] - b[col] : a[col].split('#')[col1Index - 1] - b[col].split('#')[col1Index - 1]
			);
			const sortedTable2 = table2Data.sort((a, b) =>
				col2Index === 0 ? a._id - b._id : a.value.split('#')[col2Index - 1] - b.value.split('#')[col2Index - 1]
			);

			const result = [];

			let i = 0;
			let j = 0;

			while (i < sortedTable1.length && j < sortedTable2.length) {
				const row1 = sortedTable1[i];
				const row2 = sortedTable2[j];

				const col = isFirstJoin
					? col1Index === 0
						? '_id'
						: 'value'
					: col1Index === 0
					? `${table1}._id`
					: `${table1}.value`;
				const row1Value = col1Index === 0 ? row1[col] : row1[col].split('#')[col1Index - 1];
				const row2Value = col2Index === 0 ? row2._id : row2.value.split('#')[col2Index - 1];

				if (row1Value === row2Value) {
					// Perform the join
					const joinedRow = {};

					// Add fields from table1 with a prefix
					for (const key in row1) {
						if (isFirstJoin) {
							joinedRow[`${table1}.${key}`] = row1[key];
						} else {
							joinedRow[key] = row1[key];
						}
					}

					// Add fields from table2 with a prefix
					for (const key in row2) {
						joinedRow[`${table2}.${key}`] = row2[key];
					}

					result.push(joinedRow);

					// Move to the next row in table1
					i++;
				} else if (row1Value < row2Value) {
					// Move to the next row in table1
					i++;
				} else {
					// Move to the next row in table2
					j++;
				}
			}
			// End timer
			const endTime = performance.now();
			console.log(`Sort-Merge Join time: ${endTime - startTime} ms`);

			return result;
		}

		return [];
	} finally {
		await client.close();
	}
}

// Function to perform Hash Join
async function hashJoin(catalog, dbName, table1, column1, table2, column2, inputResult) {
	try {
		// Start timer
		const startTime = performance.now();

		await client.connect();
		const db = client.db(dbName);

		const isFirstJoin = inputResult.length === 0;

		// Fetch data for table1 from MongoDB if we don't have input result
		const table1Data = isFirstJoin ? await db.collection(table1).find().toArray() : inputResult;

		let table2Data = [];
		if (column2) {
			// Fetch data for table2 from MongoDB only if column2 is defined
			table2Data = await db.collection(table2).find().toArray();
		}

		const col1Index = catalog.databases
			.find((el) => el.name === dbName)
			.tables.find((el) => el.name === table1)
			.columns.findIndex((col) => col.name === column1);
		const col2Index = catalog.databases
			.find((el) => el.name === dbName)
			.tables.find((el) => el.name === table2)
			.columns.findIndex((col) => col.name === column2);

		if (table1Data.length > 0 && table2Data.length > 0 && col1Index >= 0 && col2Index >= 0) {
			const hashTable = {};

			// Build a hash table for table1
			for (const row1 of table1Data) {
				const col = isFirstJoin
					? col1Index === 0
						? '_id'
						: 'value'
					: col1Index === 0
					? `${table1}._id`
					: `${table1}.value`;
				const key = col1Index === 0 ? row1[col] : row1[col].split('#')[col1Index - 1];

				if (!hashTable[key]) {
					hashTable[key] = [];
				}
				hashTable[key].push(row1);
			}

			const result = [];

			// Probe hash table with table2 data
			for (const row2 of table2Data) {
				const key = col2Index === 0 ? row2._id : row2.value.split('#')[col2Index - 1];
				const matchingRows = hashTable[key];

				if (matchingRows) {
					for (const row1 of matchingRows) {
						const joinedRow = {};

						// Add fields from table1 with a prefix
						for (const key in row1) {
							if (isFirstJoin) {
								joinedRow[`${table1}.${key}`] = row1[key];
							} else {
								joinedRow[key] = row1[key];
							}
						}

						// Add fields from table2 with a prefix
						for (const key in row2) {
							joinedRow[`${table2}.${key}`] = row2[key];
						}

						result.push(joinedRow);
					}
				}
			}
			// End timer
			const endTime = performance.now();
			console.log(`Hash Join time: ${endTime - startTime} ms`);

			return result;
		}

		return [];
	} finally {
		await client.close();
	}
}

// Function to perform Index-Nested-Loop Join
async function indexLoopJoin(catalog, dbName, table1, column1, table2, column2, inputResult) {
	try {
		// Start timer
		const times = [];
		let startTime = performance.now();

		await client.connect();
		const db = client.db(dbName);

		const isFirstJoin = inputResult.length === 0;

		// Fetch data for table1 from MongoDB if we don't have input result
		const table1Data = isFirstJoin ? await db.collection(table1).find().toArray() : inputResult;

		const col1Index = catalog.databases
			.find((el) => el.name === dbName)
			.tables.find((el) => el.name === table1)
			.columns.findIndex((col) => col.name === column1);
		const col2Index = catalog.databases
			.find((el) => el.name === dbName)
			.tables.find((el) => el.name === table2)
			.columns.findIndex((col) => col.name === column2);

		// Check for index on second table
		const table2IndexName = catalog.databases
			.find((el) => el.name === dbName)
			.tables.find((el) => el.name === table2)
			.indexes.find((index) => index.columns.includes(column2))?.name;

		let table2Data = [];
		if (column2) {
			// Fetch data for table2 from MongoDB only if column2 is defined
			table2Data = !table2IndexName && col2Index > 0 ? await db.collection(table2).find().toArray() : [];
		}
		if (table1Data.length > 0 && col1Index >= 0 && col2Index >= 0) {
			const result = [];

			// Iterate over each row in table1
			for (const row1 of table1Data) {
				// Extract the join key from the current row in table1
				const col = isFirstJoin
					? col1Index === 0
						? '_id'
						: 'value'
					: col1Index === 0
					? `${table1}._id`
					: `${table1}.value`;
				const key = col1Index === 0 ? row1[col] : row1[col].split('#')[col1Index - 1];
				const query = { _id: key };

				const endTime = performance.now();
				times.push(endTime - startTime);

				// Find matching rows in table2 based on the join key
				const matchingRows = table2IndexName
					? await db.collection(table2IndexName).find(query).toArray()
					: col2Index === 0
					? await db.collection(table2).find(query).toArray()
					: table2Data.filter((row2) =>
							col2Index === 0 ? row2._id === key : row2.value.split('#')[col2Index - 1] === key
					  );

				startTime = performance.now();

				// Perform the join and add to the result
				for (const row2 of matchingRows) {
					const joinedRow = {};

					// Add fields from table1 with a prefix
					for (const key in row1) {
						if (isFirstJoin) {
							joinedRow[`${table1}.${key}`] = row1[key];
						} else {
							joinedRow[key] = row1[key];
						}
					}

					// Add fields from table2 with a prefix
					for (const key in row2) {
						joinedRow[`${table2}.${key}`] = row2[key];
					}

					result.push(joinedRow);
				}
			}
			// End timer
			const endTime = performance.now();
			times.push(endTime - startTime);
			const time = times.reduce((accumulator, currentValue) => {
				return accumulator + currentValue;
			}, 0);
			console.log(`Index-Nested-Loop Join time: ${time} ms`);

			return result;
		}

		return [];
	} finally {
		await client.close();
	}
}

module.exports = {
	getQueryData
};
