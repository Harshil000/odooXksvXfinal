import { useState } from "react";

export function useForm(intialValues) {
    const [formValues, setFormValues] = useState(intialValues);

    function handleChange(e) {
        setFormValues({ ...formValues, [e.target.name]: e.target.value });
    }
    
    return { formValues , handleChange };
}