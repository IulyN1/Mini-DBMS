import Menu from './components/Menu';
import TreeView from './components/TreeView';
import DataView from './components/DataView';
import './App.css';

function App() {
	return (
		<>
			<Menu />
			<div className="data">
				<TreeView />
				<DataView />
			</div>
		</>
	);
}

export default App;
