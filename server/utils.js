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
 * Capitalizes first letter of a word and transforms the rest of it to lowercase
 * @param {String} word - the word to be transformed
 * @returns {String} - the transformed text
 */
const toUpper = (word) => {
	const string = word?.toLowerCase();
	if (string) {
		return string.charAt(0).toUpperCase() + string.slice(1);
	}
	return '';
};

module.exports = { isUnique, toUpper };
