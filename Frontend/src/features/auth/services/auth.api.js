import axios from "axios";

const api = axios.create({
    baseURL : "http://localhost:3000/api/auth",
    withCredentials: true,
})

export async function register(data){
    // data contains: firstName, lastName, email, password
    try {
        const response = await api.post("/register", data);
        console.log("✅ Registration Response:", response);
        return response.data;
    } catch (error) {
        console.log(error);
        throw error.response.data;
    }
}

export async function vendorRegister(data){
    // data contains: firstName, lastName, companyName, productCategory, gstNo, email, password
    try {
        const response = await api.post("/vendor/register", data);
        console.log("✅ Vendor Registration Response:", response);
        return response.data;
    } catch (error) {
        console.log(error);
        throw error.response.data;
    }
}

export async function login(data){
    try {
        const response = await api.post("/login", data);
        return response.data;
    } catch (error) {
        console.log(error);
        throw error.response.data;
    }
}

export async function getCurrentUser() {
    try {
        const response = await api.get("/me");
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: "Unable to load session" };
    }
}

export async function logout() {
    try {
        const response = await api.get("/logout");
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: "Logout failed" };
    }
}