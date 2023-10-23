import TreeNode from './TreeNode';
import './TreeView.css';

const TreeView = ({ data, selectedNode, onSelect }) => {
	return (
		<div className="treeView">
			<h3>Object Explorer</h3>
			{data?.databases?.map((node) => (
				<TreeNode key={node.name} node={node} onSelect={onSelect} selectedNode={selectedNode} />
			))}
		</div>
	);
};

export default TreeView;
