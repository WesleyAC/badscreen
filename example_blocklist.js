let state = {
	blocklist: [
		{
			type: "allow",
			times: [
				{
					days: [0, 1, 2, 3, 4, 5, 6],
					start_time: [19, 0],
					end_time: [22, 0],
				},
				{
					days: [0, 6],
					start_time: [3, 0],
					end_time: [4, 10],
				},
			],
			websites: [
				{
					url: "twitter.com",
					temp_delay: 0.25,
					temp_time: 3,
					temp_allow_start: null,
				},
				{
					url: "example.com",
					temp_delay: 0,
					temp_time: 0,
					temp_allow_start: null,
				},
			],
			modify_delay: 1,
			wants_edit: null,
			existing: true,
			editing: false,
		},
	],
};
