export function setWikiConfiguration(url: URL, pocConfig: any) {
	try {
		const key = `$:/FirebaseConfig|${url}tw/poc`;
		const s = window.localStorage;
		const config: string | null = s.getItem(key);
		if (!config || config.length < 5 || !config == pocConfig) {
			s.setItem(key, JSON.stringify(pocConfig));
			console.log(
				`Set localstorage config from ${config} to ${JSON.stringify(
					pocConfig,
				)}`,
			);
		}
	} catch (err) {
		console.error(err);
	}
}
