const API = import.meta.env.VITE_API_URL || "";

// Photos are stored as "/uploads/..." on our server; absolute URLs (e.g. Cloudinary) pass through
export const imgUrl = (p) => (!p ? "" : p.startsWith("http") ? p : API + p);

export async function api(path, { method = "GET", body, form } = {}) {
  const token = localStorage.getItem("token");
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body) headers["Content-Type"] = "application/json";
  const res = await fetch(`${API}/api${path}`, {
    method,
    headers,
    body: form || (body ? JSON.stringify(body) : undefined),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Something went wrong, please try again");
  return data;
}

export function getPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error("Your browser doesn't support location"));
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      (e) =>
        reject(new Error(e.code === 1
          ? "Location is blocked. Allow it in your browser's site settings, then try again."
          : "Couldn't get your location. Check your connection and try again.")),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 5 * 60 * 1000 }
    );
  });
}

export async function shareLocation() {
  const pos = await getPosition();
  return api("/users/me/location", { method: "PUT", body: pos });
}
