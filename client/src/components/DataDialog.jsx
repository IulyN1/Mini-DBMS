import { useState } from 'react';
import './Dialog.css';

const DataDialog = ({ data, type, onSubmit, onClose }) => {
	const renderContent = () => {
		switch (type) {
			case 'ADD_ROW':
				return RenderAddRowModal(handleSubmit, data);
			case 'DELETE_ROW':
				return RenderDeleteRowModal(handleSubmit, data);
			default:
				return null;
		}
	};

	const handleSubmit = (inputData) => {
		onSubmit(inputData);
		onClose();
	};

	const RenderAddRowModal = (handleSubmit, data) => {
		const { columns } = data;
		const [inputData, setInputData] = useState(() =>
			columns?.reduce((acc, col) => {
				return { ...acc, [col.name]: '' };
			}, {})
		);

		return (
			<div>
				<table>
					<thead>
						<tr>
							{columns?.map((col, index) => (
								<th key={index}>{col.name}</th>
							))}
						</tr>
					</thead>
					<tbody>
						<tr>
							{columns?.map((col, index) => (
								<td key={index}>
									<input
										type="text"
										value={inputData?.[col.name]}
										onChange={(e) => setInputData({ ...inputData, [col.name]: e.target.value })}
									/>
								</td>
							))}
						</tr>
					</tbody>
				</table>
				<button onClick={() => handleSubmit(inputData)}>Confirm</button>
			</div>
		);
	};

	const RenderDeleteRowModal = (handleSubmit, data) => {
		const { id } = data;

		return (
			<div>
				<p>
					Delete the row with the id <strong>{id}</strong>?
				</p>
				<button onClick={handleSubmit}>Confirm</button>
			</div>
		);
	};

	return (
		<div className="dialog">
			<div className="dialogContent">
				<div>
					<span className="close" onClick={onClose}>
						&times;
					</span>
				</div>
				<br />
				{renderContent()}
			</div>
		</div>
	);
};

export default DataDialog;
