import { useState, useEffect } from 'react';
import './Notification.css';

const Notification = ({ response, onClose }) => {
	const [text, setText] = useState('');

	useEffect(() => {
		(async () => {
			const res = await response.text();
			setText(res);
		})();
	}, [response]);

	return (
		text && (
			<div className="notification">
				<div className={response.status === 200 ? 'success' : 'error'}>
					<span className="closeBtn" onClick={onClose}>
						&times;
					</span>
					<span>{text}</span>
				</div>
			</div>
		)
	);
};

export default Notification;
