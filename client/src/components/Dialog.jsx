import { useState } from 'react';
import { initialInputState, types } from '../utils';
import './Dialog.css';

const Dialog = ({ data, type, onSubmit, onClose, selected }) => {
	const renderContent = () => {
		switch (type) {
			case 'CREATE_DATABASE':
				return RenderCreateDatabaseModal(handleSubmit);
			case 'DROP_DATABASE':
				return RenderDropDatabaseModal(handleSubmit, selected);
			case 'CREATE_TABLE':
				return RenderCreateTableModal(handleSubmit);
			case 'DROP_TABLE':
				return RenderDropTableModal(handleSubmit, selected);
			case 'CREATE_INDEX':
				return RenderCreateIndexModal(handleSubmit);
			default:
				return null;
		}
	};

	const handleSubmit = (state) => {
		onSubmit(state);
		onClose();
	};

	const RenderCreateDatabaseModal = (handleSubmit) => {
		const [inputState, setInputState] = useState(initialInputState);

		return (
			<>
				<h1>Create Database</h1>
				<label htmlFor="createDatabase">Database Name: </label>
				<input
					id="createDatabase"
					type="text"
					autoComplete="off"
					spellCheck={false}
					value={inputState.name}
					onChange={(e) => setInputState({ ...inputState, name: e.target.value })}
				/>
				<button onClick={() => handleSubmit(inputState)} disabled={!inputState.name}>
					Submit
				</button>
			</>
		);
	};

	const RenderDropDatabaseModal = (handleSubmit, selected) => {
		const [inputState, setInputState] = useState(
			selected?.type === 'database' ? { ...initialInputState, name: selected.name } : initialInputState
		);

		return (
			<>
				<h1>Drop Database</h1>
				<label htmlFor="dropDatabase">Database Name: </label>
				<input
					id="dropDatabase"
					type="text"
					autoComplete="off"
					spellCheck={false}
					value={inputState.name}
					onChange={(e) => setInputState({ ...inputState, name: e.target.value })}
				/>
				<button onClick={() => handleSubmit(inputState)} disabled={!inputState.name}>
					Submit
				</button>
			</>
		);
	};

	const RenderCreateTableModal = (handleSubmit) => {
		const [inputState, setInputState] = useState(initialInputState);

		return (
			<>
				<h1>Create Table</h1>
				<label htmlFor="dbPicker">Database: </label>
				<select
					id="dbPicker"
					value={inputState.dbName}
					onChange={(e) => setInputState({ ...inputState, dbName: e.target.value })}
				>
					<option key="defaultOption" value={'placeholder'} disabled>
						Select a database
					</option>
					{data?.databases?.map((db) => (
						<option key={db.name} value={db.name}>
							{db.name}
						</option>
					))}
				</select>
				<br />
				<br />
				<label htmlFor="createTableName">Table Name: </label>
				<input
					id="createTableName"
					type="text"
					autoComplete="off"
					spellCheck={false}
					value={inputState.name}
					onChange={(e) => setInputState({ ...inputState, name: e.target.value })}
				/>
				<h3>Columns</h3>
				<div className="columnHeader">
					<span>PK</span>
					<span>Name</span>
					<span>Type</span>
				</div>
				{inputState.columns.map((column, index) => (
					<div key={index} className="columnOption">
						<input
							type="checkbox"
							checked={column.primaryKey}
							onChange={() => {
								const newColumns = [...inputState.columns];
								newColumns[index].primaryKey = !column.primaryKey;
								setInputState({
									...inputState,
									columns: [...newColumns]
								});
							}}
						/>
						<input
							type="text"
							autoComplete="off"
							spellCheck={false}
							value={column.name}
							onChange={(e) => {
								const newColumns = [...inputState.columns];
								newColumns[index].name = e.target.value;
								setInputState({
									...inputState,
									columns: [...newColumns]
								});
							}}
						/>
						<select
							value={column.type}
							onChange={(e) => {
								const newColumns = [...inputState.columns];
								newColumns[index].type = e.target.value;
								setInputState({
									...inputState,
									columns: [...newColumns]
								});
							}}
						>
							{types.map((type) => (
								<option key={type} value={type}>
									{type}
								</option>
							))}
						</select>
					</div>
				))}
				<button
					className="plusButton"
					onClick={() =>
						setInputState({
							...inputState,
							columns: [...inputState.columns, { name: '', type: 'int', primaryKey: false }]
						})
					}
				>
					+
				</button>
				<button
					onClick={() => handleSubmit(inputState)}
					disabled={!inputState.name || inputState.dbName === 'placeholder'}
				>
					Submit
				</button>
			</>
		);
	};

	const RenderDropTableModal = (handleSubmit, selected) => {
		const [inputState, setInputState] = useState(
			selected?.type === 'table' ? { ...initialInputState, name: selected.name } : initialInputState
		);

		return (
			<>
				<h1>Drop Table</h1>
				<label htmlFor="dbPicker">Database: </label>
				<select
					id="dbPicker"
					value={inputState.dbName}
					onChange={(e) => setInputState({ ...inputState, dbName: e.target.value })}
				>
					<option key="defaultOption" value={'placeholder'} disabled>
						Select a database
					</option>
					{data?.databases?.map((db) => (
						<option key={db.name} value={db.name}>
							{db.name}
						</option>
					))}
				</select>
				<br />
				<br />
				<label htmlFor="dropTableName">Table Name: </label>
				<input
					id="dropTableName"
					type="text"
					autoComplete="off"
					spellCheck={false}
					value={inputState.name}
					onChange={(e) => setInputState({ ...inputState, name: e.target.value })}
				/>
				<button
					onClick={() => handleSubmit(inputState)}
					disabled={!inputState.name || inputState.dbName === 'placeholder'}
				>
					Submit
				</button>
			</>
		);
	};

	const RenderCreateIndexModal = (handleSubmit) => {
		const [inputState, setInputState] = useState(initialInputState);

		return (
			<>
				<h1>Create Index</h1>
				<label htmlFor="dbPicker">Database: </label>
				<select
					id="dbPicker"
					value={inputState.dbName}
					onChange={(e) => setInputState({ ...inputState, dbName: e.target.value })}
				>
					<option key="defaultOption" value={'placeholder'} disabled>
						Select a database
					</option>
					{data?.databases?.map((db) => (
						<option key={db.name} value={db.name}>
							{db.name}
						</option>
					))}
				</select>
				<br />
				<br />
				<label htmlFor="tbPicker">Table: </label>
				<select
					id="tbPicker"
					value={inputState.tbName}
					onChange={(e) => setInputState({ ...inputState, tbName: e.target.value })}
				>
					<option key="defaultOption" value={'placeholder'} disabled>
						Select a table
					</option>
					{data?.databases
						?.find((el) => el.name === inputState.dbName)
						?.tables?.map((tb) => (
							<option key={tb.name} value={tb.name}>
								{tb.name}
							</option>
						))}
				</select>
				<br />
				{inputState.tbName !== 'placeholder' ? (
					<>
						<h3>Columns: </h3>
						{data?.databases
							?.find((el) => el.name === inputState.dbName)
							?.tables?.find((el) => el.name === inputState.tbName)
							?.columns?.map((column, index) => (
								<div key={index} className="indexColumnOption">
									<input
										type="checkbox"
										checked={
											!!inputState.indexColumnNames.find(
												(columnName) => columnName === column.name
											)
										}
										onChange={() => {
											let newColumnNames = [];
											const columnName = inputState.indexColumnNames.find(
												(columnName) => columnName === column.name
											);
											if (columnName) {
												// remove column name if we find it
												newColumnNames = inputState.indexColumnNames.filter(
													(columnName) => columnName !== column.name
												);
											} else {
												// otherwise add it
												newColumnNames = [...inputState.indexColumnNames, column.name];
											}
											setInputState({
												...inputState,
												indexColumnNames: [...newColumnNames]
											});
										}}
									/>
									<span>{column.name}</span>
								</div>
							))}
						<br />
					</>
				) : (
					<br />
				)}
				<label htmlFor="createIndexName">Index Name: </label>
				<input
					id="createIndexName"
					type="text"
					autoComplete="off"
					spellCheck={false}
					value={inputState.name}
					onChange={(e) => setInputState({ ...inputState, name: e.target.value })}
				/>
				<button
					onClick={() => handleSubmit(inputState)}
					disabled={
						!inputState.name || inputState.dbName === 'placeholder' || inputState.tbName === 'placeholder'
					}
				>
					Submit
				</button>
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
