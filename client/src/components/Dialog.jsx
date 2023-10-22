import './Dialog.css';

const Dialog = ({ type, onClose }) => {
	const renderContent = () => {
		switch (type) {
			case 'CREATE_DATABASE':
				return renderCreateDatabaseModal();
			case 'DROP_DATABASE':
				return renderDropDatabaseModal();
			case 'CREATE_TABLE':
				return renderCreateTableModal();
			case 'DROP_TABLE':
				return renderDropTableModal();
			case 'CREATE_INDEX':
				return renderCreateIndexModal();
			default:
				return null;
		}
	};

	const renderCreateDatabaseModal = () => {
		return (
			<>
				<h1>Create Database</h1>
			</>
		);
	};

	const renderDropDatabaseModal = () => {
		return (
			<>
				<h1>Drop Database</h1>
			</>
		);
	};

	const renderCreateTableModal = () => {
		return (
			<>
				<h1>Create Table</h1>
			</>
		);
	};

	const renderDropTableModal = () => {
		return (
			<>
				<h1>Drop Table</h1>
			</>
		);
	};

	const renderCreateIndexModal = () => {
		return (
			<>
				<h1>Create Index</h1>
			</>
		);
	};

	return (
		<div className="dialog">
			<div className="dialogContent">
				<span className="close" onClick={onClose}>
					&times;
				</span>
				{renderContent()}
			</div>
		</div>
	);
};

export default Dialog;
