import { useState } from 'react';
import './TreeNode.css';

const TreeNode = ({ node }) => {
	const [isExpanded, setIsExpanded] = useState(false);

	const handleToggle = () => {
		setIsExpanded(!isExpanded);
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
					{node.name}
				</div>
				{isExpanded && node?.tables?.map((child) => <TreeNode node={child} key={child.id} />)}
			</li>
		</ul>
	);
};
export default TreeNode;
