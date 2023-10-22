export const initialInputState = { name: '' };

export const data = {
	databases: [
		{
			id: 1,
			name: 'Database 1',
			type: 'database',
			tables: [
				{
					id: 2,
					name: 'Table 1',
					type: 'table'
				},
				{
					id: 3,
					name: 'Table 2',
					type: 'table'
				}
			]
		},
		{
			id: 4,
			name: 'Database 2',
			type: 'database',
			tables: [
				{
					id: 5,
					name: 'Table 3',
					type: 'table'
				},
				{
					id: 6,
					name: 'Table 4',
					type: 'table'
				}
			]
		}
	]
};
