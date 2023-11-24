import { useState } from 'react';
import { getQueryData } from '../API';
import { transformTableData } from '../utils';
import './QueryView.css';

const QueryView = ({ data }) => {
	const [tableData, setTableData] = useState(null);
	const [dbName, setDbName] = useState('placeholder');
	const [query, setQuery] = useState('');
	const [sequential, setSequential] = useState(false);

	const handleQueryClick = () => {
		if (dbName !== 'placeholder' && query) {
			(async () => {
				const response = await getQueryData({ dbName, sequential, query });
				const responseData = transformTableData(response);
				setTableData(responseData);
			})();
		}
	};

	return (
		<div className="dataViewContainer">
			<h3>Query Viewer</h3>
			<div className="flexHeader">
				<div className="optionsContainer">
					<select id="dbPicker" value={dbName} onChange={(e) => setDbName(e.target.value)}>
						<option key="defaultOption" value={'placeholder'} disabled>
							Select a database
						</option>
						{data?.databases?.map((db) => (
							<option key={db.name} value={db.name}>
								{db.name}
							</option>
						))}
					</select>
				</div>
				<button onClick={handleQueryClick}>Query</button>
			</div>
			<div className="sequentialContainer">
				<input
					id="sequentialCheckbox"
					type="checkbox"
					checked={sequential}
					onChange={() => setSequential(!sequential)}
				/>
				<label htmlFor="sequentialCheckbox">Use sequential scan</label>
			</div>
			<textarea
				rows={5}
				value={query}
				onChange={(e) => setQuery(e.target.value)}
				placeholder="Write query here"
			/>
			{tableData && (
				<>
					<table id="dataTable">
						<thead>
							<tr>
								<th key={'row_number'}></th>
							</tr>
						</thead>
						<tbody>
							{tableData?.map((row, index) => (
								<tr key={index}>
									<td key={'row_number'}>{index + 1}</td>
								</tr>
							))}
						</tbody>
					</table>
				</>
			)}
		</div>
	);
};

export default QueryView;
