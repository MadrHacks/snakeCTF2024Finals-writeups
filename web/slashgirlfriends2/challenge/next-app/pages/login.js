/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from "react";

import Layout from "@/components/Layout";
import Button from "@/components/Button";
import Input from "@/components/Input";

export default function Login() {
    const submitLogin = async (e) => {
        e.preventDefault();

        const entries = [...e.target.elements].filter(el => !!el.value).map((el) => {
            return {
                id: el.getAttribute("id"),
                value: el.value
            };
        });
        const data = entries.reduce((acc, entry) => {
            acc[entry.id] = entry.value;
            return acc;
        }, {});

        const res = await fetch("/api/signin", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        });

        if (res.status === 200) {
            alert("Successfully signed in");
            window.location.href = "/";
        } else {
            alert("An error occurred, check the console for more information");
            console.error(res);
            console.error(await res.json());
        }
    };

    return (<>
        <Layout>
            <h1
                className="xl:text-5xl md:text-4xl text-3xl font-black max-w-4xl"
            >
                Login
            </h1>

            <form className="mt-8 flex flex-col gap-y-4" onSubmit={submitLogin}>
                <Input
                    type="email"
                    id="email"
                    placeholder="Email"
                    className={"w-full"}
                />

                <Input
                    type="password"
                    id="password"
                    placeholder="Password"
                    className={"w-full"}
                />

                <Button
                    type="submit"
                    className={"w-full"}
                >
                    Login
                </Button>
            </form>
        </Layout>
    </>);
};