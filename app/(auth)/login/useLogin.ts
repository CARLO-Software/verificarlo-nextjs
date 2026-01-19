import { useState } from "react";
import { LoginFormData, FormErrors } from "./types";
import { login } from "@/helpers/authFetch";
// ------------------------------------------
// STATE VARIABLES
// ------------------------------------------

/**
 * useState Hook Explanation
 *
 * useState is a React Hook that lets you add state to functional components.
 *
 * Syntax: const [value, setValue] = useState(initialValue)
 *
 * - value: The current state value
 * - setValue: Function to update the state
 * - initialValue: What the state starts as
 *
 * When you call setValue(), React re-renders the component with the new value.
 */
export function useLogin() {
    // Form data state - stores what the user types
    const [formData, setFormData] = useState<LoginFormData>({
        email: "",
        password: "",
    });

    // Error state - stores validation error messages for each field
    const [errors, setErrors] = useState<FormErrors>({
        email: "",
        password: "",
    });

    // General error message (for API errors, etc.)
    const [generalError, setGeneralError] = useState<string | null>(null);

    // Loading state - true while form is submitting
    const [isSubmitting, setIsSubmitting] = useState(false);

    // ------------------------------------------
    // VALIDATION FUNCTIONS
    // ------------------------------------------

    /**
     * Email Validation
     *
     * This regex (Regular Expression) checks if the email format is valid.
     * It's a simple check - for production, you'd want more robust validation.
     *
     * The regex breakdown:
     * - ^[^\s@]+ : Starts with one or more characters that aren't spaces or @
     * - @        : Must have exactly one @
     * - [^\s@]+  : Followed by characters that aren't spaces or @
     * - \.       : Must have a dot
     * - [^\s@]+$ : Ends with characters that aren't spaces or @
     */
    function isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Validate a single field
     *
     * This function validates one field at a time and returns the error message.
     * It's called when the user leaves a field (onBlur) and on form submit.
     */
    function validateField(name: keyof LoginFormData, value: string): string {
        switch (name) {
            case "email":
                if (!value.trim()) {
                    return "El correo electrónico es requerido";
                }
                if (!isValidEmail(value)) {
                    return "Ingresa un correo electrónico válido";
                }
                return "";

            case "password":
                if (!value) {
                    return "La contraseña es requerida";
                }
                if (value.length < 6) {
                    return "La contraseña debe tener al menos 6 caracteres";
                }
                return "";

            default:
                return "";
        }
    }

    /**
     * Validate all fields before submission
     *
     * Returns true if all fields are valid, false otherwise.
     * Also updates the errors state to show all error messages.
     */
    function validateForm(): boolean {
        const newErrors: FormErrors = {
            email: validateField("email", formData.email),
            password: validateField("password", formData.password),
        };

        setErrors(newErrors);

        // Check if any error exists
        // Object.values() gets all values from the object
        // .some() returns true if any value matches the condition
        return !Object.values(newErrors).some((error) => error !== "");
    }

    // ------------------------------------------
    // EVENT HANDLERS
    // ------------------------------------------

    /**
     * Handle Input Changes
     *
     * This function runs every time the user types in an input field.
     *
     * event.target gives us the input element that triggered the event.
     * We destructure { name, value } to get the input's name and current value.
     *
     * The spread operator (...formData) copies all existing values,
     * then [name]: value overwrites just the changed field.
     */
    function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
        const { name, value } = event.target;

        // Clear errors when user starts typing
        if (generalError) setGeneralError(null);
        if (errors[name as keyof FormErrors]) {
            setErrors((prev) => ({
                ...prev,
                [name]: "",
            }));
        }

        setFormData({
            ...formData,
            [name]: value,
        });
    }

    /**
     * Handle Input Blur (when user leaves a field)
     *
     * This validates the field when the user clicks/tabs away from it.
     * Provides immediate feedback without waiting for form submission.
     */
    function handleBlur(event: React.FocusEvent<HTMLInputElement>) {
        const { name, value } = event.target;
        const error = validateField(name as keyof LoginFormData, value);
        setErrors((prev) => ({
            ...prev,
            [name]: error,
        }));
    }

    function setShowRegisterModal(show: boolean) {
        if (show) {
            alert("Usuario no registrado. Mostrar modal de registro.");
        }
    }
    /**
     * Handle Form Submission
     *
     * async/await explanation:
     * - async: Marks the function as asynchronous (can wait for operations)
     * - await: Pauses execution until the Promise resolves
     *
     * event.preventDefault() stops the browser from doing its default
     * form submission (which would reload the page).
     */
    async function handleSubmit(event: React.FormEvent) {
        event.preventDefault();

        // Don't submit if already submitting
        if (isSubmitting) return;

        // Validate all fields first
        if (!validateForm()) return;

        try {
            setIsSubmitting(true);
            setGeneralError(null);

            // Prepare data for API
            const dataToSend = {
                email: formData.email.trim().toLowerCase(),
                password: formData.password,
            };

            // TODO: Replace with actual API call when backend is ready
            // Example API call:
            await login(dataToSend);

            // Success - redirect or show success message
            alert("¡Inicio de sesión exitoso!");

        } catch (err) {
            // Handle errors
            setGeneralError(
                err instanceof Error
                    ? err.message
                    : "Error al iniciar sesión. Por favor, intenta nuevamente."
            );
        } finally {
            // This runs whether the try block succeeded or failed
            setIsSubmitting(false);
        }
    }
    return { formData, errors, generalError, isSubmitting, handleChange, handleBlur, handleSubmit };

}