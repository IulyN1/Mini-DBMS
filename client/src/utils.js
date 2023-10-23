export const initialData = { databases: [] };

export const initialInputState = {
	name: '',
	dbName: 'placeholder',
	tbName: 'placeholder',
	columns: [{ name: 'id', type: 'int', primaryKey: true }],
	indexColumnNames: []
};

export const types = ['int', 'string'];
