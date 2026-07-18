import React, { useRef, useState, useEffect } from "react";
import { Camera } from "lucide-react";

const AvatarUpload = ({ initialImage, name, onFileSelect, editable = true, shape = "circle" }) => {
    const fileInputRef = useRef(null);
    const [preview, setPreview] = useState(initialImage);

    useEffect(() => {
        setPreview(initialImage);
    }, [initialImage]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setPreview(URL.createObjectURL(file));
            onFileSelect(file);
        }
    };

    const triggerFileSelect = () => {
        if (editable && fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    return (
        <div className={`avatar-upload ${shape}`}>
            <div className="avatar-preview" onClick={triggerFileSelect} style={{ cursor: editable ? "pointer" : "default" }}>
                {preview ? (
                    <img src={preview} alt="Profile" />
                ) : (
                    <span className="initial">{name ? name.charAt(0) : "U"}</span>
                )}
                {editable && (
                    <div className="overlay">
                        <Camera size={24} />
                    </div>
                )}
            </div>
            {editable && (
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    style={{ display: "none" }}
                />
            )}
        </div>
    );
};

export default AvatarUpload;
