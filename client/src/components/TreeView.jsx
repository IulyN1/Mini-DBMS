import TreeNode from './TreeNode';
import { data } from '../utils';
import './TreeView.css';

const TreeView = ({ selectedNode, onSelect }) => {
	return (
		<div className="treeView">
			<h3>Object Explorer</h3>
			{data?.databases?.map((node) => (
				<TreeNode key={node.id} node={node} onSelect={onSelect} selectedNode={selectedNode} />
			))}
		</div>
	);
};

export default TreeView;
