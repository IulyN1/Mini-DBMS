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
		tbName: 'placeholder',
		tbName1: 'placeholder',
		tbName2: 'placeholder',
		columnNames: []
	}
};

export const dataTypes = ['int', 'string'];
export const constraintTypes = ['FK', 'UNIQUE'];

/**
 * Transforms table data from an object to an array of rows data
 * @param {Object} data - the object to transform
 * @returns {Object} - the rows array
 */
export const transformTableData = (data) => {
	const transformedData = [];
	if (data) {
		data.forEach((el) => {
			Object.keys(el)?.forEach((elKey) => {
				const key = elKey.split('#');
				const value = el[elKey].split('#');
				const row = [...key, ...value];
				transformedData.push(row);
			});
		});
	}

	return transformedData;
};
