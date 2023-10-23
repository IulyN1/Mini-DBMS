import { useState } from 'react';
import Dialog from './Dialog';
import Notification from './Notification';
import { createDatabase, dropDatabase, createTable, dropTable, createIndex } from '../API';
import './Menu.css';

const Menu = ({ data, selectedNode, onAction }) => {
	const [type, setType] = useState(null);
	const [response, setResponse] = useState(null);

	const handleSubmit = (inputData) => {
		switch (type) {
			case 'CREATE_DATABASE':
				return handleCreateDatabase(inputData);
			case 'DROP_DATABASE':
				return handleDropDatabase(inputData);
			case 'CREATE_TABLE':
				return handleCreateTable(inputData);
			case 'DROP_TABLE':
				return handleDropTable(inputData);
			case 'CREATE_INDEX':
				return handleCreateIndex(inputData);
			default:
				return null;
		}
	};

	const handleCreateDatabase = async (inputData) => {
		const res = await createDatabase(inputData);
		setResponse(res);
		onAction();
	};

	const handleDropDatabase = async (inputData) => {
		const res = await dropDatabase(inputData);
		setResponse(res);
		onAction();
	};

	const handleCreateTable = async (inputData) => {
		const res = await createTable(inputData);
		setResponse(res);
		onAction();
	};

	const handleDropTable = async (inputData) => {
		const res = await dropTable(inputData);
		setResponse(res);
		onAction();
	};

	const handleCreateIndex = async (inputData) => {
		const res = await createIndex(inputData);
		setResponse(res);
		onAction();
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
				<Dialog
					data={data}
					type={type}
					onSubmit={handleSubmit}
					onClose={() => setType(null)}
					selected={selectedNode}
				/>
			)}
			{response && <Notification response={response} onClose={() => setResponse(null)} />}
		</>
	);
};

export default Menu;
