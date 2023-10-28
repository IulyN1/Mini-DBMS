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

/**
 * Transforms table data from an object to an array of rows data
 * @param {Object} data - the object to transform
 * @returns {Object} - the rows array
 */
export const transformTableData = (data) => {
	const transformedData = [];
	if (data) {
		Object.keys(data)?.forEach((key) => {
			const value = data[key].split('#');
			const row = [key, ...value];
			transformedData.push(row);
		});
	}

	return transformedData;
};
