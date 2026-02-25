"use client" //si no se ponia era use client de todas maneras, porque se está haciendo uso del useState
import { useState, useEffect, useRef } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { LoginFormData, FormErrors } from "./types";
import { useToast } from "@/app/components/Toast";


export function useLogin() {
    const router = useRouter();
    const { showToast } = useToast();
    const { data: session, status } = useSession();
    const hasShownToast = useRef(false);

    useEffect(() => {
        if (status !== "authenticated") return;
        if (hasShownToast.current) return;

        hasShownToast.current = true;
        const role = session.user.role;
        showToast("Bienvenido!", "success");

        const redirectMap: Record<string, string> = {
            ADMIN: "/admin",
            INSPECTOR: "/inspector",
        };
        router.replace(redirectMap[role] || "/perfil");
    }, [status]);


    const [formData, setFormData] = useState<LoginFormData>({
        email: "",
        password: "",
    });

    const [errors, setErrors] = useState<FormErrors>({
        email: "",
        password: "",
    });

    const [generalError, setGeneralError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    function isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

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

    function validateForm(): boolean {
        const newErrors: FormErrors = {
            email: validateField("email", formData.email),
            password: validateField("password", formData.password),
        };

        setErrors(newErrors);

        return !Object.values(newErrors).some((error) => error !== "");
    }

    function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
        const { name, value } = event.target;

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

    function handleBlur(event: React.FocusEvent<HTMLInputElement>) {
        const { name, value } = event.target;
        const error = validateField(name as keyof LoginFormData, value);
        setErrors((prev) => ({
            ...prev,
            [name]: error,
        }));
    };


    async function handleSubmit(event: React.FormEvent) {
        event.preventDefault();

        if (isSubmitting) return;

        if (!validateForm()) return;

        try {
            setIsSubmitting(true);
            setGeneralError(null);

            //Este signIn es parte de nextAuth
            const result = await signIn("credentials", {
                email: formData.email.trim().toLowerCase(),
                password: formData.password,
                redirect: false,
            });

            // Usuario suspendido: el signIn callback redirige con ?suspended=true
            if (result?.url?.includes("suspended=true")) {
                router.replace("/login?suspended=true");
                return;
            }

            if (result?.error) {
                setGeneralError("Credenciales incorrectas. Por favor, verifica tu email y contraseña.");
                return;
            }

        } catch (err) {
            setGeneralError(
                err instanceof Error
                    ? err.message
                    : "Error al iniciar sesión. Por favor, intenta nuevamente."
            );
        } finally {
            setIsSubmitting(false);
        }
    }

    return { formData, errors, generalError, isSubmitting, handleChange, handleBlur, handleSubmit };
}
