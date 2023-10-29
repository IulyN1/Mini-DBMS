import { useState, useMemo } from 'react';
import { getTableData, insertTableData, deleteTableData } from '../API';
import { transformTableData } from '../utils';
import './DataView.css';
import DataDialog from './DataDialog';

const DataView = ({ data }) => {
	const [tableData, setTableData] = useState(null);
	const [dbName, setDbName] = useState('placeholder');
	const [tbName, setTbName] = useState('placeholder');
	const [dialogType, setDialogType] = useState(null);
	const [id, setId] = useState(null);

	const columns = useMemo(() => {
		return data?.databases?.find((el) => el.name === dbName)?.tables?.find((el) => el.name === tbName)?.columns;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [tableData]);

	const handleViewDataClick = () => {
		if (dbName !== 'placeholder' && tbName !== 'placeholder') {
			(async () => {
				const response = await getTableData({ dbName, tbName });
				const responseData = transformTableData(response);
				setTableData(responseData);
			})();
		}
	};

	const handleSubmit = (inputData) => {
		if (dialogType === 'ADD_ROW') {
			(async () => {
				const response = await insertTableData({ dbName, tbName, tableData: inputData });
				if (response.status === 200) {
					handleViewDataClick();
				}
			})();
		} else if (dialogType === 'DELETE_ROW') {
			(async () => {
				const response = await deleteTableData({ dbName, tbName, id });
				if (response.status === 200) {
					handleViewDataClick();
				}
				setId(null);
			})();
		}
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
								{columns?.map((column) => (
									<th key={column.name}>{column.name}</th>
								))}
								<th key={'delete_btn'}></th>
							</tr>
						</thead>
						<tbody>
							{tableData?.map((row, index) => (
								<tr key={index}>
									<td key={'row_number'}>{index + 1}</td>
									{row?.map((elem, index) => (
										<td key={index}>{elem}</td>
									))}
									<td
										key={'delete_btn'}
										className="deleteBtn"
										onClick={() => {
											setId(row[0]);
											setDialogType('DELETE_ROW');
										}}
									>
										&times;
									</td>
								</tr>
							))}
						</tbody>
					</table>
					<div>
						<button className="addRowButton" onClick={() => setDialogType('ADD_ROW')}>
							+
						</button>
					</div>
					{dialogType && (
						<DataDialog
							data={{ columns, id }}
							type={dialogType}
							onClose={() => setDialogType(null)}
							onSubmit={handleSubmit}
						/>
					)}
				</>
			)}
		</div>
	);
};

export default DataView;
