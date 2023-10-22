import { useState } from 'react';
import Dialog from './Dialog';
import { createDatabase, dropDatabase, createTable, dropTable, createIndex } from '../API';
import './Menu.css';

const Menu = ({ selectedNode }) => {
	const [type, setType] = useState(null);

	const handleSubmit = (inputData) => {
		switch (type) {
			case 'CREATE_DATABASE':
				return createDatabase(inputData);
			case 'DROP_DATABASE':
				return dropDatabase(inputData);
			case 'CREATE_TABLE':
				return createTable(inputData);
			case 'DROP_TABLE':
				return dropTable(inputData);
			case 'CREATE_INDEX':
				return createIndex(inputData);
			default:
				return null;
		}
	};

	return (
		<>
			<div className="buttonContainer">
				<button onClick={() => setType('CREATE_DATABASE')}>Create Database</button>
				<button onClick={() => setType('DROP_DATABASE')}>Drop Database</button>
				<button onClick={() => setType('CREATE_TABLE')}>Create Table</button>
				<button onClick={() => setType('DROP_TABLE')}>Drop Table</button>
				<button onClick={() => setType('CREATE_INDEX')}>Create Index</button>
			</div>
			{type && (
				<Dialog type={type} onSubmit={handleSubmit} onClose={() => setType(null)} selected={selectedNode} />
			)}
		</>
	);
};

export default Menu;
