import { readCurrentUserId } from "./identity";

type JsonBody = Record<string, unknown> | unknown[];

async function request<T>(method: string, path: string, body?: JsonBody): Promise<T> {
  const headers: Record<string, string> = { "content-type": "application/json" };
  const uid = readCurrentUserId();
  if (uid) headers["x-user-id"] = uid;

  const res = await fetch(path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const message = (data && (data.error || data.message)) || res.statusText;
    throw new Error(message);
  }
  return data as T;
}

export const api = {
  get: <T>(p: string) => request<T>("GET", p),
  post: <T>(p: string, body: JsonBody) => request<T>("POST", p, body),
  patch: <T>(p: string, body: JsonBody) => request<T>("PATCH", p, body),
  delete: <T>(p: string) => request<T>("DELETE", p),
};
