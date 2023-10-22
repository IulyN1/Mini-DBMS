import { useState } from 'react';
import Dialog from './Dialog';
import './Menu.css';

const Menu = () => {
	const [type, setType] = useState(null);

	return (
		<>
			<div className="buttonContainer">
				<button onClick={() => setType('CREATE_DATABASE')}>Create Database</button>
				<button onClick={() => setType('DROP_DATABASE')}>Drop Database</button>
				<button onClick={() => setType('CREATE_TABLE')}>Create Table</button>
				<button onClick={() => setType('DROP_TABLE')}>Drop Table</button>
				<button onClick={() => setType('CREATE_INDEX')}>Create Index</button>
			</div>
			{type && <Dialog type={type} onClose={() => setType(null)} />}
		</>
	);
};

export default Menu;
