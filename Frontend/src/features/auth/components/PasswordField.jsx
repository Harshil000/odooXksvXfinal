import { useState } from 'react'
import { Lock, Eye, EyeOff } from 'lucide-react'

const PasswordField = ({ onChange }) => {
    const [showPassword, setShowPassword] = useState(false);
    return (
        <div className="input-wrapper">
            <div className="input-icon">
                <Lock size={16} />
            </div>
            <input 
                required 
                onChange={onChange} 
                name="password" 
                type={showPassword ? "text" : "password"} 
                placeholder="Enter your password" 
            />
            <button 
                type="button" 
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
            >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
        </div>
    )
}

export default PasswordField