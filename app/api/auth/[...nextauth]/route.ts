import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

//NextAuth indica que va a arrancar lo que está dentro del parametro (la configuración de autenticación)
const handler = NextAuth(authOptions);

// api/auth/[...nextauth] es un endpoint que maneja tanto las solicitudes GET como POST para la autenticación
export { handler as GET, handler as POST };
