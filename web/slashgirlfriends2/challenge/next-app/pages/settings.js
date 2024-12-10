import { useEffect, useState } from "react";
import Image from "next/image";
import jwt from "jsonwebtoken";

import VideoPreviewComponent from "@/components/VideoPreview";
import PremiumTag from "@/components/PremiumTag";
import Button from "@/components/Button";
import Layout from "@/components/Layout";

import getClientPromise from "@/utils/mongodb";
import Link from "next/link";
import { getCookie } from "cookies-next";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import DOMPurify from "isomorphic-dompurify";
import { useRouter } from "next/router";
import Input from "@/components/Input";

export default function SettingsPage({ me }) {
    const [Settings, setSettings] = useState({
        username: me.username,
        bio: me.bio,
        about: me.about
    });

    const saveSettings = async () => {
        if (!Settings.username) {
            alert("Username is required.");
            return;
        }

        const res = await fetch("/api/settings", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(Settings)
        });

        if (res.status === 200) {
            alert("Settings saved.");
        } else {
            const { message } = await res.json();

            alert(message);
        }
    };

    return (<>
        <Layout>
            <div
                className="bg-gradient-to-br from-primary/90 to-primary/25 relative rounded-lg flex"
            >
                <div className="flex items-center justify-center py-8">
                    <div className="flex-grow px-7 md:px-14">
                        <h1 className="xl:text-5xl md:text-4xl text-3xl font-black max-w-4xl">
                            Settings
                        </h1>
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-y-2 mt-4">
                <p className="text-xl font-bold">Your username</p>
                <Input
                    value={Settings.username}
                    onChange={(e) => setSettings({ ...Settings, username: e.target.value })}
                />

                <p className="text-xl font-bold mt-2">Your bio</p>
                <Input
                    value={Settings.bio}
                    onChange={(e) => setSettings({ ...Settings, bio: e.target.value })}
                />

                <div className="flex flex-col mt-2">
                    <p className="text-xl font-bold">Your about me section</p>
                    <p className="text-sm opacity-75 mb-2">
                        Markdown and HTML styling tags are supported.
                    </p>
                    <textarea
                        rows={5}
                        value={Settings.about}
                        onChange={(e) => setSettings({ ...Settings, about: e.target.value })}
                        className={`placeholder:text-white/50 px-4 py-2 outline-none flex-grow border-2 border-primary/20 bg-white/10 rounded-lg md:mt-0 mt-4 relative`}
                    />
                </div>

                <Button onClick={saveSettings}>
                    Save settings
                </Button>
            </div>
        </Layout>
    </>);
};

export async function getServerSideProps(ctx) {
    const client = await getClientPromise();

    const db = client.db();
    const collection = db.collection("users");

    const token = getCookie("auth", { req: ctx.req });

    if (!token) {
        return {
            redirect: {
                destination: "/login",
                permanent: false
            }
        };
    }

    const { id } = jwt.verify(token, process.env.JWT_SECRET);

    const user = await collection.findOne({ id });

    if (!user) {
        return {
            redirect: {
                destination: "/login",
                permanent: false
            }
        };
    }

    delete user.password;

    return {
        props: {
            me: JSON.parse(JSON.stringify(user)),
        },
    };
}