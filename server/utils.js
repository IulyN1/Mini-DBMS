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

module.exports = { isUnique, toUpper };
