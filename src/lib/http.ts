export async function post(
	url: string,
	data: any,
	token: string,
): Promise<any> {
	const response = await fetch(url, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${token}`,
			"Content-Type": "application/json",
			Accept: "application/json",
		},
		redirect: "follow",
		referrerPolicy: "no-referrer",
		body: JSON.stringify(data),
	});
	return response.json(); // parses JSON response into native JavaScript objects
}
export async function patch(
	url: string,
	data: any,
	token: string,
): Promise<any> {
	const response = await fetch(url, {
		method: "PATCH",
		headers: {
			Authorization: `Bearer ${token}`,
			"Content-Type": "application/json",
			Accept: "application/json",
		},
		redirect: "follow",
		referrerPolicy: "no-referrer",
		body: JSON.stringify(data),
	});
	return response.json(); // parses JSON response into native JavaScript objects
}
export async function get(url: string, token: string): Promise<any> {
	const response = await fetch(url, {
		method: "GET",
		headers: {
			Authorization: `Bearer ${token}`,
			Accept: "application/json",
		},
		redirect: "follow",
		referrerPolicy: "no-referrer",
	});
	return response.json(); // parses JSON response into native JavaScript objects
}
