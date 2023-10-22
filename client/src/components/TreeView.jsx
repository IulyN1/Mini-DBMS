import TreeNode from './TreeNode';
import { data } from '../utils';
import './TreeView.css';

const TreeView = () => {
	return (
		<div className="treeView">
			<h3>Object Explorer</h3>
			{data?.databases?.map((node) => (
				<TreeNode node={node} key={node.id} />
			))}
		</div>
	);
};

export default TreeView;
