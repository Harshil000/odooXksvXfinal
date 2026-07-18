import { useState } from "react"
import { toast } from "react-toastify";

const FileInput = ({ onChange, onFileSelect }) => {
    const [fileName, setFileName] = useState("no file selected");

    const validateFile = (file) => {
        const validTypes = ["image/jpeg", "image/png", "image/gif"];
        return validTypes.includes(file.type);
    }

    const handleFileChange = (e) => {
        const file = e.target.files[0];

        if (file && validateFile(file)) {
            setFileName(file.name);
            if (onChange) {
                onChange(e);
            }
            if (onFileSelect) {
                onFileSelect(file);
            }
        } else {
            setFileName("no file selected");
            if (onFileSelect) {
                onFileSelect(null);
            }
            toast.error("Invalid file type. Please select an image.");
        }
    };

    return (
        <div className="profile_input_container">
            <label htmlFor="profile_picture" className="profile_picture_button">Add Profile Picture</label>
            <input type="file" id="profile_picture" name="profile_picture" onChange={handleFileChange} />
            <span>{fileName}</span>
        </div>
    )
}

export default FileInput