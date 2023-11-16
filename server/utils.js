const constraintTypes = ['FK', 'UNIQUE'];
const catalogPath = 'catalog.json';

/**
 * Checks if the name value for key 'name' is unique in the array of objects
 * @param {Object} arr - the array of objects given
 * @param {String} name - the value to check against
 * @returns {Boolean} - true if it is unique, false otherwise
 */
const isUnique = (arr, name) => {
	let isUnique = true;

	for (let obj of arr) {
		if (obj.name === name) {
			isUnique = false;
			break;
		}
	}

	return isUnique;
};

/**
 * Capitalizes first letter of a word
 * @param {String} word - the word to be transformed
 * @returns {String} - the transformed text
 */
const toUpper = (word) => {
	if (word) {
		return word.charAt(0).toUpperCase() + word.slice(1);
	}
	return '';
};

/**
 * Transforms a table data object into key-value string
 * @param {Object} tableData - the table data given
 * @param {Object} primaryKey - the list of primary keys for table
 * @returns {Object} - array pair of key-value as String
 */
const transformTableData = (tableData, primaryKey) => {
	let key = '',
		value = '';
	if (tableData) {
		Object.keys(tableData).forEach((objectKey) => {
			const isPk = primaryKey.includes(objectKey);
			if (isPk) {
				key += tableData[objectKey];
				key += '#';
			} else {
				value += tableData[objectKey];
				value += '#';
			}
		});
		key = key.slice(0, -1);
		value = value.slice(0, -1);
	}
	return [key, value];
};

const getReturnData = (data) => {
	let returnData = [];
	if (data) {
		data.forEach((el) => {
			const key = el['_id'];
			const value = el['value'];
			const parsed = { [key]: value };
			returnData.push(parsed);
		});
	}
	return returnData;
};

module.exports = { isUnique, toUpper, constraintTypes, catalogPath, transformTableData, getReturnData };
