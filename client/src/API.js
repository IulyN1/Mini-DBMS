const baseURL = 'http://localhost:5000/';

export const getData = async () => await (await fetch(baseURL)).json();

export const createDatabase = async (data) => {
	const name = data?.name;
	if (name) {
		return await fetch(`${baseURL}database`, {
			method: 'POST',
			body: JSON.stringify({
				name
			}),
			headers: {
				'Content-Type': 'application/json'
			}
		});
	}
};

export const dropDatabase = async (data) => {
	const name = data?.name;
	if (name) {
		return await fetch(`${baseURL}database/${name}`, {
			method: 'DELETE'
		});
	}
};

export const createTable = async (data) => {
	const name = data?.name;
	const dbName = data?.dbName;
	const columns = data?.columns;
	if (name && dbName && columns) {
		return await fetch(`${baseURL}table`, {
			method: 'POST',
			body: JSON.stringify({
				name,
				dbName,
				columns
			}),
			headers: {
				'Content-Type': 'application/json'
			}
		});
	}
};

export const dropTable = async (data) => {
	const name = data?.name;
	const dbName = data?.dbName;
	if (name && dbName) {
		return await fetch(`${baseURL}table/${name}`, {
			method: 'DELETE',
			body: JSON.stringify({
				dbName
			}),
			headers: {
				'Content-Type': 'application/json'
			}
		});
	}
};

export const createIndex = async (data) => {
	const name = data?.name;
	const dbName = data?.dbName;
	const tbName = data?.tbName;
	const indexColumnNames = data?.indexColumnNames;
	if (name && dbName && tbName && indexColumnNames) {
		return await fetch(`${baseURL}index`, {
			method: 'POST',
			body: JSON.stringify({
				name,
				dbName,
				tbName,
				indexColumnNames
			}),
			headers: {
				'Content-Type': 'application/json'
			}
		});
	}
};

export const addConstraint = async (data) => {
	const constraint = data?.constraint;
	if (constraint) {
		return await fetch(`${baseURL}constraint/add`, {
			method: 'POST',
			body: JSON.stringify({
				constraint
			}),
			headers: {
				'Content-Type': 'application/json'
			}
		});
	}
};

export const getTableData = async (data) => {
	const dbName = data?.dbName;
	const tbName = data?.tbName;
	if (dbName && tbName) {
		return await (
			await fetch(`${baseURL}table/data?dbName=${dbName}&tbName=${tbName}`, {
				method: 'GET'
			})
		).json();
	}
};

export const insertTableData = async (data) => {
	const dbName = data?.dbName;
	const tbName = data?.tbName;
	const tableData = data?.tableData;
	const update = data?.update;
	if (dbName && tbName && tableData) {
		return await fetch(`${baseURL}table/data/insert`, {
			method: 'POST',
			body: JSON.stringify({
				dbName,
				tbName,
				tableData,
				update
			}),
			headers: {
				'Content-Type': 'application/json'
			}
		});
	}
};

export const deleteTableData = async (data) => {
	const dbName = data?.dbName;
	const tbName = data?.tbName;
	const id = data?.id;
	if (dbName && tbName && id) {
		return await fetch(`${baseURL}table/data/delete/${id}`, {
			method: 'DELETE',
			body: JSON.stringify({
				dbName,
				tbName
			}),
			headers: {
				'Content-Type': 'application/json'
			}
		});
	}
};

export const getQueryData = async (data) => {
	const dbName = data?.dbName;
	const query = data?.query;
	const sequential = data?.sequential;
	if (dbName && query) {
		return await (
			await fetch(`${baseURL}query?dbName=${dbName}&sequential=${sequential}&query=${query}`, {
				method: 'GET'
			})
		).json();
	}
};
