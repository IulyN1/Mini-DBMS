import { useState } from 'react';
import Menu from './components/Menu';
import TreeView from './components/TreeView';
import DataView from './components/DataView';
import './App.css';

function App() {
	const [selectedNode, setSelectedNode] = useState(null);

	const handleNodeSelect = (node) => {
		setSelectedNode(node);
	};

	return (
		<>
			<Menu selectedNode={selectedNode} />
			<div className="data">
				<TreeView selectedNode={selectedNode} onSelect={handleNodeSelect} />
				<DataView />
			</div>
		</>
	);
}

export default App;
