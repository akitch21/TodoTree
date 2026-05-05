import { RouterProvider } from "react-router-dom";
import { router } from "@/routes";
import { AuthProvider } from "@/store/AuthContext";
import { ThemeProvider } from "@/store/ThemeContext";

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </ThemeProvider>
  );
}
