import { deleteCookie } from "cookies-next";
import { useEffect } from "react";

export default function Logout() {
    useEffect(() => {
        deleteCookie("auth");
        window.location.href = "/";
    }, []);

    return null;
};