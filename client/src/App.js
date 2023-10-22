import { useState, useEffect } from 'react';
import Menu from './components/Menu';
import TreeView from './components/TreeView';
import DataView from './components/DataView';
import { getData } from './API';
import { initialData } from './utils';
import './App.css';

function App() {
	const [selectedNode, setSelectedNode] = useState(null);
	const [data, setData] = useState(initialData);

	useEffect(() => {
		(async () => {
			const response = await getData();
			setData(response);
		})();
	}, []);

	const handleNodeSelect = (node) => {
		setSelectedNode(node);
	};

	return (
		<>
			<Menu selectedNode={selectedNode} />
			<div className="data">
				<TreeView data={data} selectedNode={selectedNode} onSelect={handleNodeSelect} />
				<DataView />
			</div>
		</>
	);
}

export default App;
