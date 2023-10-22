import { useState } from 'react';
import { initialInputState } from '../utils';
import './Dialog.css';

const Dialog = ({ type, onSubmit, onClose, selected }) => {
	const [inputState, setInputState] = useState(initialInputState);

	const renderContent = () => {
		switch (type) {
			case 'CREATE_DATABASE':
				return renderCreateDatabaseModal();
			case 'DROP_DATABASE':
				return renderDropDatabaseModal();
			case 'CREATE_TABLE':
				return renderCreateTableModal();
			case 'DROP_TABLE':
				return renderDropTableModal();
			case 'CREATE_INDEX':
				return renderCreateIndexModal();
			default:
				return null;
		}
	};

	const handleSubmit = () => {
		onSubmit(inputState);
		setInputState(initialInputState);
		onClose();
	};

	const renderCreateDatabaseModal = () => {
		return (
			<>
				<h1>Create Database</h1>
				<label htmlFor="createDatabase">Database Name: </label>
				<input
					id="createDatabase"
					type="text"
					value={inputState.name}
					onChange={(e) => setInputState({ ...inputState, name: e.target.value })}
				/>
				<button onClick={handleSubmit}>Submit</button>
			</>
		);
	};

	const renderDropDatabaseModal = () => {
		return (
			<>
				<h1>Drop Database</h1>
				<label htmlFor="dropDatabase">Database Name: </label>
				<input
					id="dropDatabase"
					type="text"
					defaultValue={selected?.type === 'database' ? selected.name : ''}
					onChange={(e) => setInputState({ ...inputState, name: e.target.value })}
				/>
				<button onClick={handleSubmit}>Submit</button>
			</>
		);
	};

	const renderCreateTableModal = () => {
		return (
			<>
				<h1>Create Table</h1>
				<label htmlFor="createTableName">Table Name: </label>
				<input
					id="createTableName"
					type="text"
					value={inputState.name}
					onChange={(e) => setInputState({ ...inputState, name: e.target.value })}
				/>
				<button onClick={handleSubmit}>Submit</button>
			</>
		);
	};

	const renderDropTableModal = () => {
		return (
			<>
				<h1>Drop Table</h1>
				<label htmlFor="dropTableName">Table Name: </label>
				<input
					id="dropTableName"
					type="text"
					defaultValue={selected?.type === 'table' ? selected.name : ''}
					onChange={(e) => setInputState({ ...inputState, name: e.target.value })}
				/>
				<button onClick={handleSubmit}>Submit</button>
			</>
		);
	};

	const renderCreateIndexModal = () => {
		return (
			<>
				<h1>Create Index</h1>
				<label htmlFor="createIndexName">Index Name: </label>
				<input id="createIndexName" type="text" />
				<button onClick={handleSubmit}>Submit</button>
			</>
		);
	};

	return (
		<div className="dialog">
			<div className="dialogContent">
				<span className="close" onClick={onClose}>
					&times;
				</span>
				{renderContent()}
			</div>
		</div>
	);
};

export default Dialog;
