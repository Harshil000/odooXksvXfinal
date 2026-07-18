import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:3000/api",
    withCredentials: true,
});

export const getProfile = async () => {
    const response = await api.get("/profile");
    return response.data;
};

export const updateUserProfile = async (data) => {
    const response = await api.put("/profile/user", data, {
        headers: { "Content-Type": "multipart/form-data" }
    });
    return response.data;
};

export const updateCompanyProfile = async (data) => {
    const response = await api.put("/profile/company", data, {
        headers: { "Content-Type": "multipart/form-data" }
    });
    return response.data;
};

export const addAddress = async (data) => {
    const response = await api.post("/profile/address", data);
    return response.data;
};

export const updateAddress = async (id, data) => {
    const response = await api.put(`/profile/address/${id}`, data);
    return response.data;
};

export const deleteAddress = async (id) => {
    const response = await api.delete(`/profile/address/${id}`);
    return response.data;
};

export const changePassword = async (data) => {
    const response = await api.put("/profile/change-password", data);
    return response.data;
};
