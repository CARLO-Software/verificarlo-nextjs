// ============================================
// TYPES - Define the shape of our form data
// ============================================

/**
 * TypeScript Type Definition
 *
 * This defines what properties our form data object will have.
 * TypeScript will warn us if we try to use a property that doesn't exist
 * or if we assign the wrong type of value.
 *
 * Example: formData.email must be a string, not a number
 */
export type LoginFormData = {
    email: string;
    password: string;
};

/**
 * Type for tracking which fields have errors
 * Each field can have an error message (string) or no error (empty string)
 */
export type FormErrors = {
    email: string;
    password: string;
};
