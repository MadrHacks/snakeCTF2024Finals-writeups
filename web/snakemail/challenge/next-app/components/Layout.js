import clsx from "clsx";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin-ext"] });

export default function Layout({ children }) {
    return (<>
        <main
            className={clsx(
                "grid min-h-screen",
                inter.className
            )}
        >
            {children}
        </main>
    </>);
}