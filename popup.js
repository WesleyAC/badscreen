import htm from "/3p/htm.js";

// fuck virtual dom, all my homies use createElement
function h(type, attrs = {}, ...children) {
	const e = document.createElement(type);

	for (const key of Object.keys(attrs || {})) {
		if (key.startsWith("on")) {
			e.addEventListener(key.substr(2).toLowerCase(), attrs[key]);
		} else {
			if (typeof attrs[key] === "boolean") {
				if (attrs[key]) {
					e.setAttribute(key, "");
				}
			} else {
				e.setAttribute(key, attrs[key]);
			}
		}
	}

	for (const child of children.flat(Infinity).map(k => k && k.parentNode ? k.cloneNode(true) : k)) {
		if (typeof child === "string" || typeof child === "number") {
			e.appendChild(document.createTextNode(child));
		} else if (child instanceof HTMLElement) {
			e.appendChild(child);
		}
	}

	return e;
}

const html = htm.bind(h);

// TODO: proxy this
let state = { 
	blocklist: [],
	rerender_timer_running: false,
};

function add_rule(state) {
	state.blocklist.push({
		type: "allow",
		times: [
			{
				days: [0, 1, 2, 3, 4, 5, 6],
				start_time: [19, 0],
				end_time: [22, 0],
			},
		],
		websites: [
			{
				url: "example.com",
				temp_delay: 0,
				temp_time: 0,
				temp_allow_start: null,
			}
		],
		modify_delay: 5,
		wants_edit: null,
		existing: false,
		editing: true,
	});
	rerender();
}

function has_running_timer() {
	let out = false;
	for (const e of state.blocklist) {
		if (e.wants_edit) {
			out = true;
			if (Date.now() > e.wants_edit) {
				e.editing = true;
				e.wants_edit = null;
			}
		}
		for (const w of e.websites) {
			if (w.temp_allow_start) {
				out = true;
				if (Date.now() > (w.temp_allow_start + (w.temp_delay + w.temp_time) * 60 * 1000)) {
					w.temp_allow_start = null;
				}
			}
		}
	}
	return out;
}

function render(state) {
	return html`
	<div>
		<div class="text-center text-4xl pb-4">bad screen</div>
		<div class="flex flex-col">
			${state.blocklist.map((entry, idx) => render_blocklist_entry(entry, idx))}
			<div class="bg-purple-100 rounded-xl p-4 text-center text-4xl" onclick=${() => add_rule(state)}>
				+
			</div>
		</div>
	</div>`;
}

function set_entry_type(entry, type) {
	entry.type = type;
	rerender();
}

function delete_entry(state, entry) {
	state.blocklist = Array.from(state.blocklist.filter(maybe_entry => maybe_entry != entry));
	rerender();
}

function cancel_edit_entry(state, entry) {
	if (entry.existing) {
		entry.editing = false;
	} else {
		state.blocklist = Array.from(state.blocklist.filter(maybe_entry => maybe_entry != entry));
	}
	rerender();
}

function save_entry(entry) {
	entry.editing = false;
	entry.existing = true;
	rerender();
}

function add_new_time(entry) {
	entry.times.push({
		days: [0, 1, 2, 3, 4, 5, 6],
		start_time: [19, 0],
		end_time: [22, 0],
	});
	rerender();
}

function remove_time_entry(entry, time) {
	entry.times = Array.from(entry.times.filter(maybe_time => maybe_time != time));
	rerender();
}

function update_entry_website(entry, website_idx, key, new_value) {
	entry.websites[website_idx][key] = new_value;
	// don't rerender, since we're editing an input
}

function update_entry_modify_delay(entry, new_value) {
	entry.modify_delay = new_value;
	// don't rerender, since we're editing an input
}

function remove_website(entry, idx) {
	entry.websites.splice(idx, 1);
	rerender();
}

function add_website(entry) {
	entry.websites.push({
		url: "",
		temp_delay: 0,
		temp_time: 0,
		temp_allow_start: null,
	});
	rerender();
}

function kickstart_rerender_timer() {
	if (!state.rerender_timer_running) {
		rerender_timer();
	}
}

function rerender_timer() {
	if (has_running_timer(state)) {
		state.rerender_timer_running = true;
		rerender();
		setTimeout(rerender_timer, 1000);
	} else {
		state.rerender_timer_running = false;
	}
}

function edit_entry(entry) {
	entry.wants_edit = Date.now() + entry.modify_delay * 1000 * 60;
	kickstart_rerender_timer();
	rerender();
}

function cancel_edit_request(entry) {
	entry.wants_edit = null;
	rerender();
}

function request_temp_allow_entry(entry, website_idx) {
	let website = entry.websites[website_idx];
	website.temp_allow_start = Date.now();
	kickstart_rerender_timer();
	rerender();
}

function cancel_temp_allow(entry, website_idx) {
	entry.websites[website_idx].temp_allow_start = null;
	rerender();
}

function render_blocklist_entry(entry, recyclekey) {
	let inner;
	if (entry.editing) {
		inner = render_blocklist_entry_editing(entry, recyclekey);
	} else {
		inner = render_blocklist_entry_not_editing(entry, recyclekey);
	}
	return html`
	<div class="bg-purple-100 rounded-xl p-4 mb-4">
		${inner}
	</div>`;
}

function render_blocklist_entry_editing(entry, recyclekey) {
	return html`
	<div class="flex flex-row justify-center space-x-2 pb-4">
		${render_pill(entry.type === "allow" ? "bg-green-500" : "bg-gray-300", "allow", () => set_entry_type(entry, "allow"))}
		${render_pill(entry.type === "allow" ? "bg-gray-300" : "bg-red-600", "block", () => set_entry_type(entry, "block"))}
	</div>
	<div class="flex flex-col">
		${entry.times.map((time, idx) => html`
			<div class="flex flex-row justify-between">
				${render_datetime_display(time, true, `${recyclekey}-clock-${idx}`)}
				<div class="flex flex-row justify-center space-x-2">
					${render_circle_button((entry.times.length > 1) ? "bg-blue-200" : "invisible", "-", () => remove_time_entry(entry, time))}
					${render_circle_button((idx == (entry.times.length-1)) ? "bg-blue-200" : "invisible", "+", () => add_new_time(entry))}
				</div>
			</div>
		`)}
	</div>
	<div>
		${entry.websites.map((website, idx) => html`
			<div class="flex flex-row space-x-2 pb-1 pt-1">
				<input data-recycle="${recyclekey}-${idx}-url" class="flex-grow text-2xl bg-gray-200 rounded" type="text" value="${website.url}" oninput=${(e) => update_entry_website(entry, idx, "url", e.currentTarget.value)}/>
				<div class="flex flex-row justify-center space-x-2">
					${render_circle_button((entry.websites.length > 1) ? "bg-blue-200" : "invisible", "-", () => remove_website(entry, idx))}
					${render_circle_button((idx == (entry.websites.length-1)) ? "bg-blue-200" : "invisible", "+", () => add_website(entry))}
				</div>
			</div>
			<div class="flex flex-row pb-1 pt-1">
				<div class="text-2xl flex-none w-max">temp allow for</div>
				<input data-recycle="${recyclekey}-${idx}-temp_time" class="text-2xl w-8 bg-gray-200 rounded text-right" type="text" value="${website.temp_time}" onclick=${(e) => e.currentTarget.select()} oninput=${(e) => update_entry_website(entry, idx, "temp_time", parseInt(e.currentTarget.value))}/>
				<div class="text-2xl flex-none w-max pl-2">mins with</div>
				<input data-recycle="${recyclekey}-${idx}-temp_delay" class="text-2xl w-8 bg-gray-200 rounded text-right" type="text" value="${website.temp_delay}" onclick=${(e) => e.currentTarget.select()} oninput=${(e) => update_entry_website(entry, idx, "temp_delay", parseInt(e.currentTarget.value))}/>
				<div class="text-2xl flex-none w-max pl-2">mins delay</div>
			</div>
		`)}
	</div>
	<div class="flex flex-row justify-center pt-6">
		<div class="text-2xl flex-none w-max">delay editing for</div>
		<input data-recycle="${recyclekey}-modify_delay" class="text-2xl w-8 bg-gray-200 rounded text-right" type="text" value="${entry.modify_delay}" onclick=${(e) => e.currentTarget.select()} oninput=${(e) => update_entry_modify_delay(entry, parseInt(e.currentTarget.value))}/>
		<div class="text-2xl flex-none pl-2">mins</div>
	</div>
	<div class="flex flex-row justify-center space-x-2 pt-4">
		${render_pill("bg-blue-200", "cancel", () => cancel_edit_entry(state, entry))}
		${entry.existing ? render_pill("bg-red-300", "delete", () => delete_entry(state, entry)) : ""}
		${render_pill("bg-green-300", entry.existing ? "save" : "add rule", () => save_entry(entry))}
	</div>
	`;
}

function render_blocklist_entry_not_editing(entry, recyclekey) {
	return html`
	<div class="pb-4">
		${render_pill(entry.type === "allow" ? "bg-green-500" : "bg-red-600", entry.type)}
	</div>
	${entry.times.map((time, idx) => render_datetime_display(time, false, `${recyclekey}-clock-${idx}`))}
	<div class="flex flex-row items-end">
		<div class="flex flex-col flex-grow">
			${entry.websites.map((website, idx) => html`
			<div class="flex flex-row space-x-2 mt-4">
				<div class="text-2xl">${website.url}</div>
				${render_temp_allow_button(entry, website, idx)}
			</div>
			`)}
		</div>
		${render_edit_button(entry)}
	</div>
	`;
}

function render_temp_allow_button(entry, website, website_idx) {
	if (website.temp_time > 0) {
		if (website.temp_allow_start === null) {
			return render_pill("bg-blue-200", "temp allow", () => request_temp_allow_entry(entry, website_idx));
		} else {
			let start_time_left = website.temp_allow_start + (website.temp_delay * 1000 * 60) - Date.now();
			if (start_time_left > 0) {
				let start_time_left_mins = Math.floor(start_time_left / 1000 / 60);
				let start_time_left_secs = Math.floor((start_time_left / 1000) % 60);
				return render_pill("bg-gray-300", `waiting ${start_time_left_mins}:${start_time_left_secs.toString().padStart(2, "0")}`, () => cancel_temp_allow(entry, website_idx));
			} else {
				let remaining_time = website.temp_allow_start + ((website.temp_delay + website.temp_time) * 1000 * 60) - Date.now();
				let remaining_time_mins = Math.floor(remaining_time / 1000 / 60);
				let remaining_time_secs = Math.floor((remaining_time / 1000) % 60);
				return render_pill("bg-gray-300", `allowed: ${remaining_time_mins}:${remaining_time_secs.toString().padStart(2, "0")}`, () => cancel_temp_allow(entry, website_idx));

			}

		}
	} else {
		return "";
	}

}

function render_edit_button(entry) {
	if (entry.wants_edit === null) {
		return render_pill("bg-blue-200", "edit", () => edit_entry(entry))
	} else {
		let ms = entry.wants_edit - Date.now();
		let mins = Math.floor(ms / 1000 / 60);
		let secs = Math.floor((ms / 1000) % 60);
		return render_pill("bg-gray-300", `${mins}:${secs.toString().padStart(2, "0")}`, () => cancel_edit_request(entry))
	}
}

function render_circle_button(color, text, onclick) {
	return html`
	<div class="h-10 w-10 rounded-full ${color} text-4xl flex justify-center items-center" onclick=${onclick}>
		${text}
	</div>`;
}

function render_pill(color, text, onclick = undefined) {
	return html`
	<div class="text-center">
		<div class="rounded-full pb-1 pt-1 pl-4 pr-4 text-2xl inline ${color}" onclick=${onclick}>${text}</div>
	</div>`;
}

function toggle_day(time, day) {
	if (time.days.includes(day)) {
		time.days = Array.from(time.days.filter(e => e !== day))
	} else {
		time.days.push(day);
	}
	rerender();
}

function render_datetime_display(time, editable, recyclekey) {
	return html`
	<div class="flex flex-row pb-1 pt-1 space-x-3">
		<div class="flex flex-row space-x-1">
			${Array.from(Array(7).keys()).map(day => html`
				<div class="rounded-full h-10 w-10 flex items-center justify-center ${time.days.includes(day) ? "bg-blue-500" : "bg-blue-200"}" onclick=${editable ? () => toggle_day(time, day) : undefined}>
					${["S","M","T","W","T","F","S"][day]}
				</div>
			`)}
		</div>
		<div class="inline h-10 flex items-center m-auto">
			${render_time_display(time.start_time, editable, `${recyclekey}-0`)}
			—
			${render_time_display(time.end_time, editable, `${recyclekey}-1`)}
		</div>
	</div>`;
}

function render_time_display(time, editable, recyclekey) {
	return html`
	<div class="text-2xl">
		${render_time_display_segment(time[0].toString().padStart(2, "0"), (e) => (time[0] = parseInt(e.currentTarget.value)), editable, `${recyclekey}-1`)}
		:
		${render_time_display_segment(time[1].toString().padStart(2, "0"), (e) => (time[1] = parseInt(e.currentTarget.value)), editable, `${recyclekey}-2`)}
	</div>`;
}

function render_time_display_segment(time, oninput, editable, recyclekey) {
	return html`
	<input data-recycle="${recyclekey}" class="w-8 text-2xl rounded ${editable ? "bg-gray-200" : "bg-transparent"}" type="text" disabled=${!editable} value="${time}" onclick=${(e) => e.currentTarget.select()} oninput=${(e) => oninput(e)}/>
	`;
}

function rerender() {
	let ss, se;
	let ii = document.activeElement.dataset["recycle"];
	if (ii) {
		ss = document.activeElement.selectionStart;
		se = document.activeElement.selectionEnd;
	}
	document.body.lastChild.replaceWith(render(state));
	if (ii) {
		const es = document.querySelectorAll(`[data-recycle="${ii}"]`);
		if (es.length == 1) {
			es[0].focus({ preventScroll: true });
			es[0].selectionStart = ss;
			es[0].selectionEnd = se;
		}
	}
	browser.storage.local.set(state);
}

async function init() {
	let blocklist = (await browser.storage.local.get()).blocklist;
	if (blocklist) {
		state = { blocklist, rerender_timer_running: false };
	}
	rerender();
	kickstart_rerender_timer();
}

init();
