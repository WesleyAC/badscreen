function blockAppliesToSites(entry) {
	return entry.websites.filter(website => {
		let time_matches = entry.times.map(timeMatchesNow).includes(true);
		let type_allow = entry.type === "allow";
		let time_block = (type_allow !== time_matches);
		let temp_allow = Date.now() > (website.temp_allow_start + (website.temp_delay * 1000 * 60)) && Date.now() < (website.temp_allow_start + ((website.temp_delay + website.temp_time) * 1000 * 60));
		return time_block && !temp_allow;
	}).map(website => website.url);
}

async function filterRequest(details) {
	return {redirectUrl: browser.runtime.getURL("/blocked.html")};
}

function timeMatchesNow(time) {
	let now = new Date();
	let start = new Date();
	start.setHours(time.start_time[0]);
	start.setMinutes(time.start_time[1]);
	start.setSeconds(0, 0);
	let end = new Date();
	end.setHours(time.end_time[0]);
	end.setMinutes(time.end_time[1]);
	end.setSeconds(0, 0);
	return now > start && now < end && time.days.includes(now.getDay());
}

function blocklistToFilters(blocklist) {
	return [].concat.apply([], blocklist.map(entry => {
		return blockAppliesToSites(entry).map(url => `*://*.${url}/*`);
	}))
}

async function updateRequestHandler() {
	let blocklist = (await browser.storage.local.get()).blocklist;
	browser.webRequest.onBeforeRequest.removeListener(filterRequest);
	browser.webRequest.onBeforeRequest.addListener(
		filterRequest,
		{urls: blocklistToFilters(blocklist)},
		["blocking"]
	);
}

browser.storage.onChanged.addListener((changes, area) => {
	if (area === "local" && "blocklist" in changes) {
		updateRequestHandler();
	}
});

// Yeah, reloading every minute is bad, but idgaf
browser.alarms.create("reload_filter", {
	when: Date.now() + 1000,
	periodInMinutes: 1,
});

browser.alarms.onAlarm.addListener((alarm) => {
	updateRequestHandler();
});
