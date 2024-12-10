import { useEffect, useState } from "react";
import { getCookie } from "cookies-next";
import { useRouter } from "next/router";
import Link from "next/link";

import StaticContent from "./StaticContent.js";
import LogoVector from "./Logo.js";

import { ArrowLeftOnRectangleIcon, Bars3Icon, HeartIcon, HomeIcon, UserIcon, UserPlusIcon, XMarkIcon } from "@heroicons/react/24/solid";
import { Transition } from "@headlessui/react";

import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export default function Layout({ children }) {
    const router = useRouter();
    const [Links, setLinks] = useState([
        {
            href: "/",
            name: "Home",
            icon: HomeIcon
        },
    ]);
    const [ShowMobileNavMenu, setShowMobileNavMenu] = useState(false);

    useEffect(() => {
        if (getCookie("auth")) {
            setLinks(o => [
                ...o,
                {
                    href: "/premium",
                    name: "Premium",
                    icon: HeartIcon
                },
                {
                    href: "/u/me",
                    name: "Profile",
                    icon: UserIcon
                },
                {
                    href: "/logout",
                    name: "Logout",
                    icon: ArrowLeftOnRectangleIcon
                },
            ]);
        } else {
            setLinks(o => [
                ...o,
                {
                    href: "/login",
                    name: "Login",
                    icon: UserIcon
                },
                {
                    href: "/register",
                    name: "Register",
                    icon: UserPlusIcon
                },
            ]);
        }
    }, []);

    return (<>
        <Transition
            show={ShowMobileNavMenu}
            enter="transition-opacity duration-75"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
        >
            <div className={`${inter.className} fixed inset-0 bg-black z-[99999999] xl:hidden xl:pointer-events-none`}>
                <div className="container mx-auto py-6 px-8 max-h-screen h-screen flex flex-col">
                    <div className="relative">
                        <LogoVector className="h-8 text-primary mx-auto" />

                        <div className="absolute inset-y-0 grid">
                            <button
                                className="my-auto p-2 bg-white/10 rounded-lg text-secondary"
                                onClick={() => setShowMobileNavMenu(false)}
                            >
                                <XMarkIcon className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div className="mb-8 mt-16 flex flex-col gap-4 h-full overflow-y-auto">
                        {
                            Links.map((item, i) => (
                                <Link
                                    key={i}
                                    href={item.href}
                                    onClick={() => setShowMobileNavMenu(false)}
                                >
                                    <div className="bg-white/5 p-4 rounded-lg flex relative overflow-hidden text-primary">
                                        <h3 className="text-xl font-bold my-auto">
                                            {item.name}
                                        </h3>

                                        <item.icon className="h-8 w-8 ml-auto text-primary" />
                                    </div>
                                </Link>
                            ))
                        }
                    </div>

                    <div className="mt-auto border-t-2 border-[#451d1c] pt-4">
                        <p className="text-white/75 text-sm text-center">
                            &copy; 2024 SlashGirlfriends.
                            <br />
                            All rights reserved.
                        </p>
                    </div>
                </div>
            </div>
        </Transition>

        <header
            className={`
                ${inter.className}
                border-b-2 border-white/20 bg-white/5
            `}
        >
            <div
                className={`
                    container mx-auto py-6 px-8 flex relative
                `}
            >
                <Link
                    href={"/"}
                    className="my-auto mx-auto"
                >
                    <LogoVector className="h-8 text-primary mx-auto" />
                </Link>

                <div className="absolute left-8 inset-y-0 grid xl:hidden">
                    <button
                        className="my-auto p-2 bg-white/10 rounded-lg text-secondary"
                        onClick={() => setShowMobileNavMenu(true)}
                    >
                        <Bars3Icon className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </header>
        <div
            className={`
                ${inter.className}
                border-b-2 border-white/20 xl:flex hidden bg-white/5
            `}
        >
            <div
                className={`
                    mx-auto inline-flex lg:w-auto w-full
                    lg:flex-row flex-col
                `}
            >
                {
                    Links.map((l, i) => (
                        <Link
                            key={i}
                            href={l.href}
                            className={`
                            text-primary/75 py-3 px-12 text-center box-border
                            font-extrabold text-sm uppercase transition-colors hover:bg-primary/20
                            ${router.pathname === l.href ? "border-b-2 border-primary" : ""}
                        `}
                        >
                            {l.name}
                        </Link>
                    ))
                }
            </div>
        </div>
        <main
            className={`
                ${inter.className}
                container mx-auto p-8
            `}
        >
            {children}
        </main>
        <footer
            className={`
                ${inter.className}
                border-t-2 border-white/20 mt-auto
            `}
        >
            <div
                className={`
                    container mx-auto py-6 px-8 xl:flex gap-8
                `}
            >
                <div>
                    {/* <LogoVector className="h-8 text-primary" /> */}
                    <p className="mt-2 text-white/75 text-sm">
                        &copy; 2024 SlashGirlfriends.
                        <br />
                        All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    </>);
};