const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = 'mongodb+srv://iulianp14:admin@cluster0.gt5aifw.mongodb.net/?retryWrites=true&w=majority';

const fs = require('fs');
const { isUnique, toUpper, constraintTypes, catalogPath, transformTableData } = require('./utils');

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
					// create DB folder
					fs.mkdir(`./data/${name}`, { recursive: true }, (err) => {
						if (err) {
							console.error('Error creating folder:', err);
							return res.status(500).send('Error creating DB folder!');
						}
					});

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
					return res.status(402).send('Database already exists!');
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
					// delete DB folder
					fs.rm(`./data/${name}`, { recursive: true }, (err) => {
						if (err) {
							console.error('Error deleting DB folder:', err);
							return res.status(500).send('Error deleting DB folder!');
						}
					});

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
							// create table file
							const fileName = `${name}.kv`;
							fs.writeFile(`./data/${dbName}/${fileName}`, '', (err) => {
								if (err) {
									console.error('Error creating table file:', err);
									return res.status(500).send('Error creating table file!');
								}
							});

							// update catalog
							catalog.databases
								.find((el) => el.name === dbName)
								.tables.push({
									name,
									type: 'table',
									fileName,
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
						return res.status(402).send('Table already exists!');
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
						// delete table file
						const fileName = `${name}.kv`;
						fs.unlink(`./data/${dbName}/${fileName}`, (err) => {
							if (err) {
								console.error('Error deleting table file:', err);
								return res.status(500).send('Error deleting table file!');
							}
						});

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
									.indexes.push({ name, columns: indexColumnNames });

								fs.writeFile(catalogPath, JSON.stringify(catalog), (err) => {
									if (err) {
										console.error('Error writing file:', err);
										return res.status(500).send('Error writing file!');
									}

									return res.status(200).send('Index was created successfully!');
								});
							} else {
								return res.status(402).send('Index name already exists!');
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
											return res.status(402).send('FK name already exists!');
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
				const fileName = catalog.databases
					.find((el) => el.name === dbName)
					?.tables?.find((el) => el.name === tbName)?.fileName;

				if (fileName) {
					fs.readFile(`./data/${dbName}/${fileName}`, 'utf8', (err, data) => {
						if (err) {
							console.error('Error reading file:', err);
							return res.status(500).send('Error reading table data!');
						}

						try {
							const tableData = data && JSON.parse(data);
							return res.status(200).json(tableData);
						} catch (error) {
							console.error('Error parsing table data:', error);
							return res.status(500).send('Error parsing table data!');
						}
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
	if (dbName && tbName && tableData) {
		fs.readFile(catalogPath, 'utf8', (err, data) => {
			if (err) {
				console.error('Error reading file:', err);
				return res.status(500).send('Error reading catalog!');
			}

			try {
				const catalog = JSON.parse(data);
				const fileName = catalog.databases
					.find((el) => el.name === dbName)
					?.tables?.find((el) => el.name === tbName)?.fileName;

				if (fileName) {
					fs.readFile(`./data/${dbName}/${fileName}`, 'utf8', (err, data) => {
						if (err) {
							console.error('Error reading file:', err);
							return res.status(500).send('Error reading table data!');
						}

						const fileData = JSON.parse(data);
						const [key, value] = transformTableData(tableData);
						if (key && value) {
							fileData[key] = value;
						}
						const updatedData = JSON.stringify(fileData);

						fs.writeFile(`./data/${dbName}/${fileName}`, updatedData, (err, data) => {
							if (err) {
								console.error('Error reading file:', err);
								return res.status(500).send('Error reading table data!');
							}

							try {
								const tbData = data && JSON.parse(data);
								return res.status(200).json(tbData);
							} catch (error) {
								console.error('Error parsing table data:', error);
								return res.status(500).send('Error parsing table data!');
							}
						});
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
				const fileName = catalog.databases
					.find((el) => el.name === dbName)
					?.tables?.find((el) => el.name === tbName)?.fileName;

				if (fileName) {
					fs.readFile(`./data/${dbName}/${fileName}`, 'utf8', (err, data) => {
						if (err) {
							console.error('Error reading file:', err);
							return res.status(500).send('Error reading table data!');
						}

						const fileData = JSON.parse(data);
						delete fileData[id];
						const updatedData = JSON.stringify(fileData);

						fs.writeFile(`./data/${dbName}/${fileName}`, updatedData, (err, data) => {
							if (err) {
								console.error('Error reading file:', err);
								return res.status(500).send('Error reading table data!');
							}

							try {
								const tbData = data && JSON.parse(data);
								return res.status(200).json(tbData);
							} catch (error) {
								console.error('Error parsing table data:', error);
								return res.status(500).send('Error parsing table data!');
							}
						});
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
