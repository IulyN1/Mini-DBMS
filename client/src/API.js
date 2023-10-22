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
	if (name && dbName) {
		return await fetch(`${baseURL}table`, {
			method: 'POST',
			body: JSON.stringify({
				name,
				dbName
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
	if (name && dbName && tbName) {
		return await fetch(`${baseURL}index`, {
			method: 'POST',
			body: JSON.stringify({
				name,
				dbName,
				tbName
			}),
			headers: {
				'Content-Type': 'application/json'
			}
		});
	}
};
