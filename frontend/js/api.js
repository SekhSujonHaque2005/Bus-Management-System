const BASE_URL = "/api";

export async function apiFetch(endpoint, method = "GET", body = null) {
    const options = {
        method,
        headers: {
            "Content-Type": "application/json"
        }
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    const response = await fetch(BASE_URL + endpoint, options);

    const text = await response.text();

    try {
        return JSON.parse(text);
    } catch (error) {
        console.error("Invalid JSON Response:", text);
        throw new Error("Backend not responding properly");
    }
}

export function setToken(token) {
    localStorage.setItem("token", token);
}

export function setUserData(user) {
    localStorage.setItem("user", JSON.stringify(user));
}

export function showToast(msg) {
    alert(msg);
}