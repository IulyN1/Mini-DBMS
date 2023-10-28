import { useState } from 'react';
import { getTableData } from '../API';
import { transformTableData } from '../utils';
import './DataView.css';

const DataView = ({ data }) => {
	const [tableData, setTableData] = useState(null);
	const [dbName, setDbName] = useState('placeholder');
	const [tbName, setTbName] = useState('placeholder');

	const handleViewDataClick = () => {
		if (dbName !== 'placeholder' && tbName !== 'placeholder') {
			(async () => {
				const response = await getTableData({ dbName, tbName });
				const responseData = transformTableData(response);
				setTableData(responseData);
			})();
		}
	};

	const handleAddRowClick = () => {
		console.log('add row');
	};

	const handleDeleteRowClick = () => {
		console.log('delete row');
	};

	return (
		<div className="dataViewContainer">
			<h3>Data Viewer</h3>
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
				<select id="tbPicker" value={tbName} onChange={(e) => setTbName(e.target.value)}>
					<option key="defaultOption" value={'placeholder'} disabled>
						Select a table
					</option>
					{data?.databases
						?.find((el) => el.name === dbName)
						?.tables?.map((tb) => (
							<option key={tb.name} value={tb.name}>
								{tb.name}
							</option>
						))}
				</select>
				<button onClick={handleViewDataClick}>View Data</button>
			</div>
			{tableData && (
				<>
					<table id="dataTable">
						<thead>
							<tr>
								<th key={'row_number'}></th>
								{data?.databases
									?.find((el) => el.name === dbName)
									?.tables?.find((el) => el.name === tbName)
									?.columns?.map((column) => (
										<th key={column.name}>{column.name}</th>
									))}
								<th key={'delete_btn'}></th>
							</tr>
						</thead>
						<tbody>
							{tableData?.map((row, index) => (
								<tr key={index}>
									<td key={'row_number'}>{index}</td>
									{row?.map((elem, index) => (
										<td key={index}>{elem}</td>
									))}
									<td key={'delete_btn'} className="deleteBtn" onClick={handleDeleteRowClick}>
										&times;
									</td>
								</tr>
							))}
						</tbody>
					</table>
					<div>
						<button className="addRowButton" onClick={handleAddRowClick}>
							+
						</button>
					</div>
				</>
			)}
		</div>
	);
};

export default DataView;
