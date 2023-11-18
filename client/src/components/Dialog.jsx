import { useState } from 'react';
import { initialInputState, dataTypes, constraintTypes } from '../utils';
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
			case 'ADD_CONSTRAINT':
				return RenderAddConstraintModal(handleSubmit);
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
							{dataTypes.map((type) => (
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

	const RenderAddConstraintModal = (handleSubmit) => {
		const [inputState, setInputState] = useState(initialInputState);

		return (
			<>
				<h1>Add Constraint</h1>
				<label htmlFor="dbPicker">Database: </label>
				<select
					id="dbPicker"
					value={inputState.constraint.dbName}
					onChange={(e) =>
						setInputState({
							...inputState,
							constraint: { ...inputState.constraint, dbName: e.target.value }
						})
					}
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
				<label htmlFor="constraintTypePicker">Constraint Type: </label>
				<select
					id="constraintTypePicker"
					value={inputState.constraint.type}
					onChange={(e) =>
						setInputState({ ...inputState, constraint: { ...inputState.constraint, type: e.target.value } })
					}
				>
					<option key="defaultOption" value={'placeholder'} disabled>
						Select a constraint
					</option>
					{constraintTypes.map((type) => (
						<option key={type} value={type}>
							{type}
						</option>
					))}
				</select>
				<br />
				<br />
				{inputState.constraint.type === 'FK' && (
					<>
						<div className="constraintTables">
							<div>
								<label htmlFor="tbPicker1">Table 1: </label>
								<select
									id="tbPicker1"
									value={inputState.constraint.tbName1}
									onChange={(e) =>
										setInputState({
											...inputState,
											constraint: { ...inputState.constraint, tbName1: e.target.value }
										})
									}
								>
									<option key="defaultOption" value={'placeholder'} disabled>
										Select a table
									</option>
									{data?.databases
										?.find((el) => el.name === inputState.constraint.dbName)
										?.tables?.map((tb) => (
											<option key={tb.name} value={tb.name}>
												{tb.name}
											</option>
										))}
								</select>
							</div>
							<div>
								<label htmlFor="tbPicker2">Table 2: </label>
								<select
									id="tbPicker2"
									value={inputState.constraint.tbName2}
									onChange={(e) =>
										setInputState({
											...inputState,
											constraint: { ...inputState.constraint, tbName2: e.target.value }
										})
									}
								>
									<option key="defaultOption" value={'placeholder'} disabled>
										Select a table
									</option>
									{data?.databases
										?.find((el) => el.name === inputState.constraint.dbName)
										?.tables?.map((tb) => (
											<option key={tb.name} value={tb.name}>
												{tb.name}
											</option>
										))}
								</select>
							</div>
						</div>
						<br />
					</>
				)}
				{inputState.constraint.tbName1 !== 'placeholder' &&
					inputState.constraint.tbName2 !== 'placeholder' &&
					inputState.constraint.tbName1 !== inputState.constraint.tbName2 && (
						<>
							<div className="fkColumns">
								<div>
									{data?.databases
										?.find((el) => el.name === inputState.constraint.dbName)
										?.tables?.find((el) => el.name === inputState.constraint.tbName1)
										?.columns?.map((column, index) => (
											<div key={index} className="indexColumnOption">
												<input
													type="checkbox"
													value={column.name}
													checked={!!inputState.constraint.columnNames.includes(column.name)}
													onChange={() => {
														let newColumnNames = [];
														const columnName = inputState.constraint.columnNames.find(
															(columnName) => columnName === column.name
														);
														if (columnName) {
															// remove column name if we find it
															newColumnNames = inputState.constraint.columnNames.filter(
																(columnName) => columnName !== column.name
															);
														} else {
															// otherwise add it if it does not violate foreign key constraint
															const columnLimit = data?.databases
																?.find((el) => el.name === inputState.constraint.dbName)
																?.tables?.find(
																	(el) => el.name === inputState.constraint.tbName2
																)?.primaryKey?.length;

															if (
																inputState.constraint.columnNames.length < columnLimit
															) {
																newColumnNames = [
																	...inputState.constraint.columnNames,
																	column.name
																];
															} else {
																newColumnNames = [...inputState.constraint.columnNames];
															}
														}
														setInputState({
															...inputState,
															constraint: {
																...inputState.constraint,
																columnNames: [...newColumnNames]
															}
														});
													}}
												/>
												<span>{column.name}</span>
											</div>
										))}
								</div>
								<em>References</em>
								<div>
									{data?.databases
										?.find((el) => el.name === inputState.constraint.dbName)
										?.tables?.find((el) => el.name === inputState.constraint.tbName2)
										?.primaryKey?.map((column, index) => (
											<div key={index} className="indexColumnOption">
												<strong>{column}</strong>
											</div>
										))}
								</div>
							</div>
							<br />
						</>
					)}
				{inputState.constraint.type === 'UNIQUE' && (
					<>
						<div className="constraintTables">
							<div>
								<label htmlFor="tbPicker">Table: </label>
								<select
									id="tbPicker"
									value={inputState.constraint.tbName}
									onChange={(e) =>
										setInputState({
											...inputState,
											constraint: { ...inputState.constraint, tbName: e.target.value }
										})
									}
								>
									<option key="defaultOption" value={'placeholder'} disabled>
										Select a table
									</option>
									{data?.databases
										?.find((el) => el.name === inputState.constraint.dbName)
										?.tables?.map((tb) => (
											<option key={tb.name} value={tb.name}>
												{tb.name}
											</option>
										))}
								</select>
							</div>
						</div>
						<br />
					</>
				)}
				{inputState.constraint.tbName !== 'placeholder' && (
					<div>
						{data?.databases
							?.find((el) => el.name === inputState.constraint.dbName)
							?.tables?.find((el) => el.name === inputState.constraint.tbName)
							?.columns?.map((column, index) => (
								<div key={index} className="indexColumnOption">
									<input
										type="checkbox"
										value={column.name}
										checked={inputState.constraint.columnNames.includes(column.name)}
										onChange={() => {
											const columnName = column.name;

											// If the column is already selected, unselect it
											// If the column is not selected, unselect all others and select this one
											const newColumnNames = inputState.constraint.columnNames.includes(
												columnName
											)
												? inputState.constraint.columnNames.filter(
														(name) => name !== columnName
												  )
												: [columnName];

											setInputState({
												...inputState,
												constraint: {
													...inputState.constraint,
													columnNames: newColumnNames
												}
											});
										}}
									/>
									<span>{column.name}</span>
								</div>
							))}
					</div>
				)}
				<label htmlFor="constraintName">Constraint Name: </label>
				<input
					id="constraintName"
					type="text"
					autoComplete="off"
					spellCheck={false}
					value={inputState.constraint.name}
					onChange={(e) =>
						setInputState({ ...inputState, constraint: { ...inputState.constraint, name: e.target.value } })
					}
				/>
				<button
					onClick={() => handleSubmit(inputState)}
					disabled={
						!inputState.constraint.name || !inputState.constraint.dbName || !inputState.constraint.type
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
