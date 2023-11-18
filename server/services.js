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
		fs.readFile(catalogPath, 'utf8', async (err, data) => {
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
						// check for foreign key constraint if parent table
						const childs = catalog.databases
							.find((el) => el.name === dbName)
							?.tables?.filter((el) => el.foreignKeys.some((fk) => fk.references === name));
						if (childs.length > 0) {
							try {
								await client.connect();

								const db = client.db(dbName);
								const collection = db.collection(name);
								const result = await collection.find({}).toArray();
								if (result.length > 0) {
									const ids = result.map((res) => res._id);
									let error = '';
									try {
										await Promise.all(
											childs?.map(async (child) => {
												const columns = child.foreignKeys.find(
													(fk) => fk.references === name
												)?.referencedColumns;
												const fkIndexes = child.indexes.filter(
													(index) => JSON.stringify(index.columns) === JSON.stringify(columns)
												);
												//check for each value from the table in it's children indexes
												try {
													await Promise.all(
														fkIndexes.map(async (index) => {
															await Promise.all(
																ids.map(async (id) => {
																	if (!error) {
																		const name = index.name;
																		const db = client.db(dbName);
																		const collection = db.collection(name);
																		const query = { _id: id };

																		// check foreign key
																		try {
																			const result = await collection
																				.find(query)
																				.toArray();
																			if (result[0].value) {
																				error =
																					'Operation violates FK constraint!';
																			}
																		} catch (err) {
																			console.error(
																				'Error reading from index file!',
																				err
																			);
																			error = 'Error reading from index file!';
																		}
																	}
																})
															);
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
									} else {
										await collection.drop();
									}
								}
							} catch (err) {
								console.error('Error reading table!', err);
							}
						}

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
	const { type, dbName, tbName, tbName1, tbName2, columnNames } = constraint;
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
											// add foreign key
											catalog.databases
												.find((el) => el.name === dbName)
												.tables.find((el) => el.name === tbName1)
												.foreignKeys.push({
													name,
													columns: columnNames,
													references: tbName2,
													referencedColumns: pk
												});

											//add index
											catalog.databases
												.find((el) => el.name === dbName)
												.tables.find((el) => el.name === tbName1)
												.indexes.push({
													name: 'Index' + tbName1 + tbName2,
													columns: columnNames,
													unique: false
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
						} else if (type === 'UNIQUE') {
							const table = db.tables.find((el) => el.name === tbName);
							if (table) {
								const validColumns = columnNames.every((col) =>
									table.columns.some((el) => el.name === col)
								);
								if (validColumns) {
									//add index
									catalog.databases
										.find((el) => el.name === dbName)
										.tables.find((el) => el.name === tbName)
										.indexes.push({
											name,
											columns: columnNames,
											unique: true
										});
									fs.writeFile(catalogPath, JSON.stringify(catalog), (err) => {
										if (err) {
											console.error('Error writing file:', err);
											return res.status(500).send('Error writing file!');
										}
										return res.status(200).send('UNIQUE constraint was created successfully!');
									});
								}
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
					// check indexes that are not foreign keys
					const otherIndexes = table.indexes.filter((index) => {
						return !table.foreignKeys.some(
							(fk) => JSON.stringify(fk.columns) === JSON.stringify(index.columns)
						);
					});
					let otherIndexesError = '';
					try {
						await client.connect();

						await Promise.all(
							otherIndexes.map(async (index) => {
								const name = index.name;
								const indexCols = index.columns;
								let pos = 0;
								let actualValue = value;
								if (indexCols.length === 1) {
									pos = table.columns.findIndex((column) => column.name === indexCols[0]);
									actualValue = pos > 0 ? value.split('#')[pos - 1] : value.split('#')[pos];
								} else if (indexCols.length > 1) {
									const len = indexCols.length;
									const posStart = table.columns.findIndex((column) => column.name === indexCols[0]);
									const posEnd = table.columns.findIndex(
										(column) => column.name === indexCols[len - 1]
									);
									const splitted = value.split('#');
									let acumulator = '';
									for (let i = posStart - 1; i <= posEnd - 1; i++) {
										acumulator += splitted[i];
										if (i !== posEnd - 1) {
											acumulator += '$';
										}
									}
									actualValue = acumulator;
								}

								const db = client.db(dbName);
								const collection = db.collection(name);
								const dataToInsert = { _id: actualValue, value: key };
								const query = { _id: actualValue };

								try {
									const result = await collection.find(query).toArray();
									if (result.length <= 0) {
										await collection.insertOne(dataToInsert);
									} else {
										const id = result[0]._id;
										let value = result[0].value;
										if (index.unique) {
											if (!value) {
												value = key;
											} else {
												otherIndexesError += 'Operation violates UNIQUE constraint!';
											}
										} else {
											if (!value) {
												value = key;
											} else {
												value = value + '#' + key;
											}
										}
										if (!otherIndexesError) {
											const filter = { _id: id };
											const update = { $set: { value } };

											try {
												await collection.updateOne(filter, update);
											} catch (err) {
												console.error('Error inserting in index file!', err);
												otherIndexesError += 'Error inserting in index file!';
											}
										}
									}
								} catch (err) {
									console.error('Error inserting in index file!', err);
									otherIndexesError += 'Error inserting in index file!';
								}
							})
						);
					} catch (err) {
						console.error('Error connecting to MongoDB!', err);
					} finally {
						await client.close();
					}
					if (otherIndexesError) {
						return res.status(500).send(otherIndexesError);
					}

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
								const fkIndexes = child.indexes.filter(
									(index) => JSON.stringify(index.columns) === JSON.stringify(columns)
								);

								try {
									await client.connect();

									await Promise.all(
										fkIndexes.map(async (index) => {
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
						const fkIndexes = table.indexes.filter((index) => {
							return table.foreignKeys.some(
								(fk) => JSON.stringify(fk.columns) === JSON.stringify(index.columns)
							);
						});
						let error = '';
						try {
							await client.connect();

							// insert value in indexes also
							for (const index of fkIndexes) {
								const name = index.name;
								const indexCols = index.columns;
								let pos = 0;
								let actualValue = value;
								if (indexCols.length === 1) {
									pos = table.columns.findIndex((column) => column.name === indexCols[0]);
									actualValue = pos > 0 ? value.split('#')[pos - 1] : value.split('#')[pos];
								} else if (indexCols.length > 1) {
									const len = indexCols.length;
									const posStart = table.columns.findIndex((column) => column.name === indexCols[0]);
									const posEnd = table.columns.findIndex(
										(column) => column.name === indexCols[len - 1]
									);
									const splitted = value.split('#');
									let acumulator = '';
									for (let i = posStart - 1; i <= posEnd - 1; i++) {
										acumulator += splitted[i];
										if (i !== posEnd - 1) {
											acumulator += '$';
										}
									}
									actualValue = acumulator;
								}

								try {
									const db = client.db(dbName);
									const collection = db.collection(name);
									const query = { _id: actualValue };

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
					// insert or update in table
					try {
						await client.connect();
						const db = client.db(dbName);
						const collection = db.collection(tbName);
						const dataToInsert = { _id: key, value };

						await collection.insertOne(dataToInsert);
						return res.status(200).send('Inserted successfully!');
					} catch (err) {
						console.error('Error:', err);
						error = err;
					} finally {
						await client.close();
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

				if (table) {
					// check indexes that are not foreign keys
					const otherIndexes = table.indexes.filter((index) => {
						return !table.foreignKeys.some(
							(fk) => JSON.stringify(fk.columns) === JSON.stringify(index.columns)
						);
					});

					let otherIndexesError = '';
					try {
						await client.connect();

						await Promise.all(
							otherIndexes.map(async (index) => {
								const name = index.name;
								const db = client.db(dbName);
								const collection = db.collection(name);

								try {
									const result = await collection.find({}).toArray();
									const el = result?.find((elem) => elem?.value?.split('#').includes(id));
									if (el) {
										const otherValues = el.value
											.split('#')
											.filter((val) => val !== id)
											.join('#');
										if (!otherValues) {
											await collection.deleteOne({ _id: el._id });
										} else {
											try {
												await collection.updateOne(
													{ _id: el._id },
													{ $set: { value: otherValues } }
												);
											} catch (err) {
												console.error('Error deleting from index file!', err);
												otherIndexesError += 'Error deleting from index file!';
											}
										}
									}
								} catch (err) {
									console.error('Error deleting from index file!', err);
									otherIndexesError += 'Error deleting from index file!';
								}
							})
						);
					} catch (err) {
						console.error('Error connecting to MongoDB!', err);
					} finally {
						await client.close();
					}
					if (otherIndexesError) {
						return res.status(500).send(otherIndexesError);
					}

					// check if parent table
					const childs = catalog.databases
						.find((el) => el.name === dbName)
						?.tables?.filter((el) => el.foreignKeys.some((fk) => fk.references === tbName));
					// check for each child the foreign key constraint
					let error = '';
					try {
						await Promise.all(
							childs?.map(async (child) => {
								const columns = child.foreignKeys.find(
									(fk) => fk.references === tbName
								)?.referencedColumns;
								const fkIndexes = child.indexes.filter(
									(index) => JSON.stringify(index.columns) === JSON.stringify(columns)
								);

								try {
									await client.connect();

									await Promise.all(
										fkIndexes.map(async (index) => {
											if (!error) {
												const name = index.name;
												const db = client.db(dbName);
												const collection = db.collection(name);
												const query = { _id: id };

												// check foreign key
												try {
													const result = await collection.find(query).toArray();
													if (result[0].value) {
														error += 'Operation violates FK constraint!';
													} else {
														await collection.deleteOne(query);
													}
												} catch (err) {
													console.error('Error deleting from index file!', err);
													error += 'Error deleting from index file!';
												}
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
						const fkIndexes = table.indexes.filter((index) => {
							return table.foreignKeys.some(
								(fk) => JSON.stringify(fk.columns) === JSON.stringify(index.columns)
							);
						});
						let error = '';
						try {
							await client.connect();

							// delete from indexes also
							for (const index of fkIndexes) {
								const name = index.name;
								const db = client.db(dbName);
								const collection = db.collection(name);

								try {
									const result = await collection.find({}).toArray();
									const el = result?.find((elem) => elem?.value?.split('#').includes(id));
									if (el) {
										const otherValues = el.value
											.split('#')
											.filter((val) => val !== id)
											.join('#');
										if (!otherValues) {
											try {
												await collection.updateOne(
													{ _id: el._id },
													{ $set: { value: otherValues } }
												);
											} catch (err) {
												console.error('Error deleting from index file!', err);
												error += 'Error deleting from index file!';
											}
										}
									}
								} catch (err) {
									console.error('Error deleting from index file!', err);
									error += 'Error deleting from index file!';
								}
							}
						} catch (err) {
							console.error('Error connecting to MongoDB', err);
						} finally {
							await client.close();
						}
					}

					// delete from table
					try {
						await client.connect();

						const db = client.db(dbName);
						const collection = db.collection(tbName);
						const filter = { _id: id };

						try {
							await collection.deleteOne(filter);
							return res.status(200).send('Deleted successfully!');
						} catch (err) {
							console.error('Error deleting data!', err);
						}
					} catch (err) {
						console.error('Error connecting to MongoDB!', err);
					} finally {
						await client.close();
					}
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
