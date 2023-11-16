const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = 'mongodb+srv://iulianp14:admin@cluster0.gt5aifw.mongodb.net/?retryWrites=true&w=majority';

const fs = require('fs');
const { isUnique, toUpper, constraintTypes, catalogPath, transformTableData, getReturnData } = require('./utils');

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
	serverApi: {
		version: ServerApiVersion.v1,
		strict: true,
		deprecationErrors: true
	}
});

async function run() {
	try {
		// Connect the client to the server	(optional starting in v4.7)
		await client.connect();
		// Send a ping to confirm a successful connection
		await client.db('admin').command({ ping: 1 });
		console.log('Successfully connected to MongoDB!');
	} finally {
		// Ensures that the client will close when you finish/error
		await client.close();
	}
}
run().catch(console.dir);

const getData = (_, res) => {
	fs.readFile(catalogPath, 'utf8', (err, data) => {
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
		fs.readFile(catalogPath, 'utf8', (err, data) => {
			if (err) {
				console.error('Error reading file:', err);
				return res.status(500).send('Error reading catalog!');
			}

			try {
				const catalog = JSON.parse(data);
				if (isUnique(catalog.databases, name)) {
					// update catalog
					catalog.databases.push({ name, type: 'database', tables: [] });
					fs.writeFile(catalogPath, JSON.stringify(catalog), (err) => {
						if (err) {
							console.error('Error writing file:', err);
							return res.status(500).send('Error writing file!');
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
		fs.readFile(catalogPath, 'utf8', (err, data) => {
			if (err) {
				console.error('Error reading file:', err);
				return res.status(500).send('Error reading catalog!');
			}

			try {
				const catalog = JSON.parse(data);
				const db = catalog.databases.find((el) => el.name === name);
				if (db) {
					// update catalog
					const databases = catalog.databases.filter((el) => el.name !== name);
					catalog.databases = databases;
					fs.writeFile(catalogPath, JSON.stringify(catalog), (err) => {
						if (err) {
							console.error('Error writing file:', err);
							return res.status(500).send('Error writing file!');
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
	const columns = req.body?.columns;
	if (name && dbName && columns) {
		fs.readFile(catalogPath, 'utf8', (err, data) => {
			if (err) {
				console.error('Error reading file:', err);
				return res.status(500).send('Error reading catalog!');
			}

			try {
				const catalog = JSON.parse(data);
				const db = catalog.databases.find((el) => el.name === dbName);
				if (db) {
					if (isUnique(db.tables, name)) {
						let tableColumns = [];
						let primaryKey = [];
						columns?.forEach((column) => {
							if (column.primaryKey && column.name) {
								primaryKey.push(column.name);
							}
							if (column.name) {
								tableColumns.push({ name: column.name, type: column.type });
							}
						});
						if (tableColumns.length === 0) {
							return res.status(400).send('Invalid columns');
						} else if (primaryKey.length === 0) {
							return res.status(400).send('Invalid primary key');
						} else {
							// update catalog
							catalog.databases
								.find((el) => el.name === dbName)
								.tables.push({
									name,
									type: 'table',
									columns: tableColumns,
									primaryKey,
									foreignKeys: [],
									indexes: []
								});
							fs.writeFile(catalogPath, JSON.stringify(catalog), (err) => {
								if (err) {
									console.error('Error writing file:', err);
									return res.status(500).send('Error writing file!');
								}

								return res.status(200).send('Table was created successfully!');
							});
						}
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
	const name = toUpper(req.params?.name);
	const dbName = toUpper(req.body?.dbName);
	if (name && dbName) {
		fs.readFile(catalogPath, 'utf8', (err, data) => {
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
						// update catalog
						const otherTables = db.tables.filter((el) => el.name !== name);
						const tables = otherTables.map((el) => {
							return { ...el, foreignKeys: el.foreignKeys.filter((key) => key.references !== name) };
						});
						catalog.databases.find((el) => el.name === dbName).tables = tables;

						fs.writeFile(catalogPath, JSON.stringify(catalog), (err) => {
							if (err) {
								console.error('Error writing file:', err);
								return res.status(500).send('Error writing file!');
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
	const indexColumnNames = req.body?.indexColumnNames;
	if (name && dbName && tbName && indexColumnNames) {
		fs.readFile(catalogPath, 'utf8', (err, data) => {
			if (err) {
				console.error('Error reading file:', err);
				return res.status(500).send('Error reading catalog!');
			}

			try {
				const catalog = JSON.parse(data);
				const db = catalog.databases.find((el) => el.name === dbName);
				if (db) {
					const table = db.tables.find((el) => el.name === tbName);
					if (table) {
						if (indexColumnNames.length === 0) {
							return res.status(400).send('Invalid columns for index!');
						} else {
							if (isUnique(table.indexes, name)) {
								catalog.databases
									.find((el) => el.name === dbName)
									.tables.find((el) => el.name === tbName)
									.indexes.push({ name, columns: indexColumnNames, unique: false });

								fs.writeFile(catalogPath, JSON.stringify(catalog), (err) => {
									if (err) {
										console.error('Error writing file:', err);
										return res.status(500).send('Error writing file!');
									}

									return res.status(200).send('Index was created successfully!');
								});
							} else {
								return res.status(400).send('Index name already exists!');
							}
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

const addConstraint = (req, res) => {
	const constraint = req.body?.constraint;
	const name = toUpper(constraint?.name);
	const { type, dbName, tbName1, tbName2, columnNames } = constraint;
	if (name && type && dbName && tbName1 && tbName2 && columnNames) {
		if (!constraintTypes.includes(type)) {
			return res.status(400).send('Invalid constraint type!');
		} else if (columnNames.length === 0) {
			return res.status(400).send('Invalid columns!');
		} else {
			fs.readFile(catalogPath, 'utf8', (err, data) => {
				if (err) {
					console.error('Error reading file:', err);
					return res.status(500).send('Error reading catalog!');
				}

				try {
					const catalog = JSON.parse(data);
					const db = catalog.databases.find((el) => el.name === dbName);
					if (db) {
						if (type === 'FK') {
							const table1 = db.tables.find((el) => el.name === tbName1);
							const table2 = db.tables.find((el) => el.name === tbName2);
							if (table1 && table2 && table1.name !== table2.name) {
								const validColumns = columnNames.every((col) =>
									table1.columns.some((el) => el.name === col)
								);
								if (validColumns) {
									const pk = table2.primaryKey;
									if (columnNames.length === pk.length) {
										const fks = catalog.databases
											.find((el) => el.name === dbName)
											.tables.find((el) => el.name === tbName1).foreignKeys;
										if (isUnique(fks, name)) {
											catalog.databases
												.find((el) => el.name === dbName)
												.tables.find((el) => el.name === tbName1)
												.foreignKeys.push({
													name,
													columns: columnNames,
													references: tbName2,
													referencedColumns: pk
												});

											fs.writeFile(catalogPath, JSON.stringify(catalog), (err) => {
												if (err) {
													console.error('Error writing file:', err);
													return res.status(500).send('Error writing file!');
												}

												return res.status(200).send('FK constraint was created successfully!');
											});
										} else {
											return res.status(400).send('FK name already exists!');
										}
									} else {
										return res.status(400).send('Invalid number of columns for FK!');
									}
								} else {
									return res.status(400).send('Invalid columns!');
								}
							} else {
								return res.status(400).send('Invalid tables!');
							}
						}
					} else {
						return res.status(404).send('Database not found!');
					}
				} catch (error) {
					console.error('Error parsing JSON:', error);
					return res.status(500).send('Error parsing JSON!');
				}
			});
		}
	} else {
		return res.status(400).send('Bad request!');
	}
};

const getTableData = (req, res) => {
	const dbName = req.query?.dbName;
	const tbName = req.query?.tbName;
	if (dbName && tbName) {
		fs.readFile(catalogPath, 'utf8', (err, data) => {
			if (err) {
				console.error('Error reading file:', err);
				return res.status(500).send('Error reading catalog!');
			}

			try {
				const catalog = JSON.parse(data);
				const found = catalog.databases
					.find((el) => el.name === dbName)
					?.tables?.find((el) => el.name === tbName);

				if (found) {
					client
						.connect()
						.then(() => {
							const db = client.db(dbName);
							const collection = db.collection(tbName);

							collection
								.find({})
								.toArray()
								.then((data) => {
									const parsedData = getReturnData(data);
									return res.status(200).json(parsedData);
								})
								.catch((err) => {
									console.error('Error retrieving data!', err);
									return res.status(500).send('Error retrieving data!');
								})
								.finally(() => {
									client.close();
								});
						})
						.catch((err) => {
							console.error('Error connecting to MongoDB', err);
						});
				} else {
					return res.status(500).send('Cannot find data!');
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

const insertTableData = (req, res) => {
	const dbName = req.body?.dbName;
	const tbName = req.body?.tbName;
	const tableData = req.body?.tableData;
	const update = req.body?.update;
	if (dbName && tbName && tableData) {
		fs.readFile(catalogPath, 'utf8', async (err, data) => {
			if (err) {
				console.error('Error reading file:', err);
				return res.status(500).send('Error reading catalog!');
			}

			try {
				const catalog = JSON.parse(data);
				const table = catalog.databases
					.find((el) => el.name === dbName)
					?.tables?.find((el) => el.name === tbName);
				const validColumns = table?.primaryKey?.every((pk) => tableData[pk]);

				if (table && validColumns) {
					const [key, value] = transformTableData(tableData, table.primaryKey);
					// check if parent table
					const childs = catalog.databases
						.find((el) => el.name === dbName)
						?.tables?.filter((el) => el.foreignKeys.some((fk) => fk.references === tbName));

					// for each child insert the key in the index files matching foreign keys
					let error = '';
					let errorIndexes = [];
					try {
						await Promise.all(
							childs?.map(async (child) => {
								const columns = child.foreignKeys.find(
									(fk) => fk.references === tbName
								)?.referencedColumns;
								const indexes = child.indexes.filter(
									(index) => JSON.stringify(index.columns) === JSON.stringify(columns)
								);

								try {
									await client.connect();

									await Promise.all(
										indexes.map(async (index) => {
											const name = index.name;
											errorIndexes.push(name);

											const db = client.db(dbName);
											const collection = db.collection(name);
											const dataToInsert = { _id: key, value: '' };

											try {
												await collection.insertOne(dataToInsert);
											} catch (err) {
												console.error('Error inserting in index file!', err);
												error += 'Error inserting in index file!';
											}
										})
									);
								} catch (err) {
									console.error('Error connecting to MongoDB!', err);
								} finally {
									await client.close();
								}
							})
						);
					} catch (err) {
						console.error('Error occurred!', err);
					}
					if (error) {
						return res.status(500).send(error);
					}

					// check if child
					const hasParent = table.foreignKeys.length > 0;
					if (hasParent) {
						let error = '';
						try {
							await client.connect();

							// insert value in indexes also
							for (const index of table.indexes) {
								const name = index.name;
								try {
									const db = client.db(dbName);
									const collection = db.collection(name);
									const query = { _id: value };

									// check for foreign key
									const result = await collection.find(query).toArray();
									if (result.length <= 0) {
										error += 'Operation violates FK constraint!';
									} else {
										// if checks passed, insert into index
										const id = result[0]._id;
										let value = result[0].value;
										if (index.unique) {
											if (!value) {
												value = key;
											} else {
												error += 'Operation violates UNIQUE constraint!';
											}
										} else {
											if (!value) {
												value = key;
											} else {
												value = value + '#' + key;
											}
										}
										if (!error) {
											const filter = { _id: id };
											const update = { $set: { value } };

											try {
												await collection.updateOne(filter, update);
											} catch (err) {
												console.error('Error inserting in index file!', err);
												error += 'Error inserting in index file!';
											}
										}
									}
								} catch (err) {
									console.error('Error reading index!', err);
									error += 'Error reading index!';
								}
							}
						} catch (err) {
							console.error('Error connecting to MongoDB', err);
						} finally {
							await client.close();
						}
						// if there was an error revert changes
						if (error) {
							await Promise.all(
								errorIndexes.map(async (indexName) => {
									try {
										await client.connect();

										const db = client.db(dbName);
										const collection = db.collection(indexName);
										const query = { _id: key };

										await collection.deleteOne(query);
									} catch (err) {
										console.error('Error deleting from index!', err);
									} finally {
										await client.close();
									}
								})
							);
							return res.status(500).send(error);
						}
					}

					if (!update) {
						client
							.connect()
							.then(() => {
								const db = client.db(dbName);
								const collection = db.collection(tbName);
								const dataToInsert = { _id: key, value };

								collection
									.insertOne(dataToInsert)
									.then((result) => {
										return res.status(200).send('Inserted successfully!');
									})
									.catch((err) => {
										console.error('Error inserting data!', err);
										return res.status(500).send('Error inserting data!');
									})
									.finally(() => {
										client.close();
									});
							})
							.catch((err) => {
								console.error('Error connecting to MongoDB', err);
							});
					} else {
						client
							.connect()
							.then(() => {
								const db = client.db(dbName);
								const collection = db.collection(tbName);
								const filter = { _id: key };
								const update = { $set: { value } };

								collection
									.updateOne(filter, update)
									.then((result) => {
										return res.status(200).send('Updated successfully!');
									})
									.catch((err) => {
										console.error('Error updating data!', err);
										return res.status(500).send('Error updating data!');
									})
									.finally(() => {
										client.close();
									});
							})
							.catch((err) => {
								console.error('Error connecting to MongoDB', err);
							});
					}
				} else {
					return res.status(400).send('Invalid data!');
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

const deleteTableData = (req, res) => {
	const dbName = req.body?.dbName;
	const tbName = req.body?.tbName;
	const id = req.params?.id;
	if (dbName && tbName && id) {
		fs.readFile(catalogPath, 'utf8', (err, data) => {
			if (err) {
				console.error('Error reading file:', err);
				return res.status(500).send('Error reading catalog!');
			}

			try {
				const catalog = JSON.parse(data);
				const table = catalog.databases
					.find((el) => el.name === dbName)
					?.tables?.find((el) => el.name === tbName);

				if (table) {
					client
						.connect()
						.then(() => {
							const db = client.db(dbName);
							const collection = db.collection(tbName);
							const filter = { _id: id };

							collection
								.deleteOne(filter)
								.then((result) => {
									return res.status(200).send('Deleted successfully!');
								})
								.catch((err) => {
									console.error('Error deleting data!', err);
									return res.status(500).send('Error deleting data!');
								})
								.finally(() => {
									client.close();
								});
						})
						.catch((err) => {
							console.error('Error connecting to MongoDB', err);
						});
				} else {
					return res.status(400).send('Cannot find data!');
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

module.exports = {
	getData,
	createDatabase,
	dropDatabase,
	createTable,
	dropTable,
	createIndex,
	addConstraint,
	getTableData,
	insertTableData,
	deleteTableData
};
