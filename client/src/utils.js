export const initialData = { databases: [] };

export const initialInputState = {
	name: '',
	dbName: 'placeholder',
	tbName: 'placeholder',
	columns: [{ name: 'id', type: 'int', primaryKey: true }],
	indexColumnNames: [],
	constraint: {
		name: '',
		type: 'placeholder',
		dbName: 'placeholder',
		tbName1: 'placeholder',
		tbName2: 'placeholder',
		columnNames: []
	}
};

export const dataTypes = ['int', 'string'];
export const constraintTypes = ['FK'];
