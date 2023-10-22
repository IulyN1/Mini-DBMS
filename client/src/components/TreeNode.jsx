import { useState } from 'react';
import './TreeNode.css';

const TreeNode = ({ node, onSelect, selectedNode }) => {
	const [isExpanded, setIsExpanded] = useState(false);

	const handleToggle = () => {
		setIsExpanded(!isExpanded);
		onSelect(node);
	};

	return (
		<ul className="treeList">
			<li>
				<div onClick={handleToggle}>
					{node.tables ? (
						isExpanded ? (
							<>
								{'▼ '}
								<img src="images/db.png" alt="db" />
							</>
						) : (
							<>
								{'➤ '}
								<img src="images/db.png" alt="db" />
							</>
						)
					) : (
						<img src="images/table.png" alt="table" />
					)}{' '}
					{node === selectedNode ? <span>{node.name}</span> : node.name}
				</div>
				{isExpanded &&
					node?.tables?.map((child) => (
						<TreeNode node={child} key={child.id} onSelect={onSelect} selectedNode={selectedNode} />
					))}
			</li>
		</ul>
	);
};
export default TreeNode;
