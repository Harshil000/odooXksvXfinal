import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import * as profileApi from "../services/profile.api";

export function useProfile() {
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const data = await profileApi.getProfile();
            setProfileData(data);
        } catch (error) {
            toast.error(error?.message || "Failed to fetch profile");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    const saveAll = async (formData, companyFormData, isVendor, isAdmin) => {
        try {
            setIsSaving(true);

            // 1. Save User Profile
            const userRes = await profileApi.updateUserProfile(formData);

            // 2. Save Company Profile (if applicable)
            let companyRes = null;
            if (isVendor && isAdmin && companyFormData) {
                companyRes = await profileApi.updateCompanyProfile(companyFormData);
            }

            setProfileData((prev) => ({
                ...prev,
                user: userRes.user,
                ...(companyRes ? { company: companyRes.company } : {})
            }));

            toast.success("Profile saved successfully!");
        } catch (error) {
            toast.error(error?.message || "Failed to save profile");
        } finally {
            setIsSaving(false);
        }
    };

    const handleUserImageDelete = async (firstName, lastName) => {
        try {
            setIsSaving(true);
            const formData = new FormData();
            formData.append("firstName", firstName);
            formData.append("lastName", lastName);
            formData.append("profileImage", "null");
            
            const userRes = await profileApi.updateUserProfile(formData);
            setProfileData((prev) => ({ 
                ...prev, 
                user: userRes.user
            }));
            toast.success("Profile image removed!");
        } catch (error) {
            toast.error(error?.message || "Failed to remove image");
        } finally {
            setIsSaving(false);
        }
    };

    const handleCompanyImageDelete = async (compData) => {
        try {
            setIsSaving(true);
            const formData = new FormData();
            formData.append("companyName", compData.companyName);
            formData.append("productCategory", compData.productCategory);
            formData.append("gstNo", compData.gstNo);
            formData.append("pincode", compData.pincode);
            formData.append("city", compData.city);
            formData.append("state", compData.state);
            formData.append("addressLine1", compData.addressLine1);
            formData.append("addressLine2", compData.addressLine2 || "");
            formData.append("companyProfileImage", "null");
            
            const companyRes = await profileApi.updateCompanyProfile(formData);
            setProfileData((prev) => ({ 
                ...prev, 
                company: companyRes.company
            }));
            toast.success("Company logo removed!");
        } catch (error) {
            toast.error(error?.message || "Failed to remove company logo");
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddAddress = async (data) => {
        try {
            const res = await profileApi.addAddress(data);
            setProfileData((prev) => ({ ...prev, addresses: [...prev.addresses, res.address] }));
            toast.success("Address added successfully!");
        } catch (error) {
            toast.error(error?.message || "Failed to add address");
        }
    };

    const handleDeleteAddress = async (id) => {
        try {
            await profileApi.deleteAddress(id);
            setProfileData((prev) => ({
                ...prev,
                addresses: prev.addresses.filter(addr => addr.address_id !== id)
            }));
            toast.success("Address deleted successfully!");
        } catch (error) {
            toast.error(error?.message || "Failed to delete address");
        }
    };

    return {
        profileData,
        loading,
        isSaving,
        saveAll,
        handleUserImageDelete,
        handleCompanyImageDelete,
        handleAddAddress,
        handleDeleteAddress
    };
}
