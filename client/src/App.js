import { useState, useEffect } from 'react';
import Menu from './components/Menu';
import TreeView from './components/TreeView';
import DataView from './components/DataView';
import { getData } from './API';
import { initialData } from './utils';
import './App.css';

function App() {
	const [selectedNode, setSelectedNode] = useState(null);
	const [operationsDone, setOperationsDone] = useState(0);
	const [data, setData] = useState(initialData);

	useEffect(() => {
		(async () => {
			const response = await getData();
			setData(response);
		})();
	}, [operationsDone]);

	const handleNodeSelect = (node) => {
		setSelectedNode(node);
	};

	return (
		<>
			<Menu data={data} selectedNode={selectedNode} onAction={() => setOperationsDone(operationsDone + 1)} />
			<div className="data">
				<TreeView data={data} selectedNode={selectedNode} onSelect={handleNodeSelect} />
				<DataView data={data} />
			</div>
		</>
	);
}

export default App;
