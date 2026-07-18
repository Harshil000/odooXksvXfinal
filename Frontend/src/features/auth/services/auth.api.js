import httpClient, { getErrorPayload } from "../../../shared/api/httpClient";

const AUTH_BASE = "/auth";

export async function register(data) {
  try {
    const response = await httpClient.post(`${AUTH_BASE}/register`, data);
    return response.data;
  } catch (error) {
    throw getErrorPayload(error, "Registration failed");
  }
}

export async function adminRegister(data) {
  try {
    const response = await httpClient.post(`${AUTH_BASE}/admin/register`, data);
    return response.data;
  } catch (error) {
    throw getErrorPayload(error, "Admin registration failed");
  }
}

export async function staffRegister(data) {
  try {
    const response = await httpClient.post(`${AUTH_BASE}/staff/register`, data);
    return response.data;
  } catch (error) {
    throw getErrorPayload(error, "Staff registration failed");
  }
}

export async function login(data) {
  try {
    const response = await httpClient.post(`${AUTH_BASE}/login`, data);
    return response.data;
  } catch (error) {
    throw getErrorPayload(error, "Login failed");
  }
}

export async function getCurrentUser() {
  try {
    const response = await httpClient.get(`${AUTH_BASE}/me`);
    return response.data;
  } catch (error) {
    throw getErrorPayload(error, "Unable to load session");
  }
}

export async function logout() {
  try {
    const response = await httpClient.get(`${AUTH_BASE}/logout`);
    return response.data;
  } catch (error) {
    throw getErrorPayload(error, "Logout failed");
  }
}
