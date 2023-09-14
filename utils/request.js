export async function globalReq(url, accept) {
    const response = await fetch(url, {
        headers: {
            "Accept": accept,
            "User-Agent": "Manuk"
        }
    });
    const data = await response.json();

    return data;
}