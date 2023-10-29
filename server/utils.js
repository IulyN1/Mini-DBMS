const constraintTypes = ['FK'];
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
 * @returns {Object} - array pair of key-value as String
 */
const transformTableData = (tableData) => {
	let key = '',
		value = '',
		i = 0;
	if (tableData) {
		Object.keys(tableData).forEach((objectKey) => {
			if (i == 0) {
				key = tableData[objectKey];
			} else {
				value += tableData[objectKey];
				value += '#';
			}
			i++;
		});
		value = value.slice(0, -1);
	}
	return [key, value];
};

module.exports = { isUnique, toUpper, constraintTypes, catalogPath, transformTableData };
