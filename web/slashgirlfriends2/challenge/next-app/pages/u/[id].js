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

export default function UserPage({
    me,
    user,
    isMe
}) {
    const router = useRouter();

    const reportUser = async () => {
        const res = await fetch("/api/reportUser", {
            "method": "POST",
            "headers": {
                "Content-Type": "application/json"
            },
            "body": JSON.stringify({
                uid: user.id
            })
        });

        if (res.status === 200) {
            alert("User reported to admin.");
        } else {
            const data = await res.json();
            alert(data.message);
        }
    };

    return (<>
        <Layout>
            <div
                className="bg-gradient-to-br from-primary/90 to-primary/25 relative rounded-lg flex"
            >
                <div className="flex items-center justify-center py-8">
                    <div className="flex-grow px-7 md:px-14">
                        <h1 className="xl:text-5xl md:text-4xl text-3xl font-black max-w-4xl mb-2">
                            {user.username}
                        </h1>
                        <p className="md:text-2xl text-lg font-bold mt-2 max-w-2xl line-clamp-3">{user.bio}</p>
                    </div>
                </div>
            </div>

            <div className="px-6 py-6 bg-white/10 rounded-lg flex items-center justify-center mt-4">
                {user.about ?
                    <MarkdownRenderer content={user.about} />
                    : <>
                        <p>
                            No about section.
                        </p>
                    </>
                }
            </div>

            <div className="flex mt-4 gap-4">
                <Button onClick={() => router.push("/settings")} className={"w-full"}>
                    User settings
                </Button>
                <Button
                    onClick={() => {
                        if (!isMe) {
                            reportUser();
                        } else {
                            alert("You can't report yourself.");
                        }
                    }}
                    className={"w-full"}
                >
                    Report user to admin
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

    const userData = await collection.findOne({ id: ctx.params.id });

    if (!userData) {
        return {
            notFound: true
        };
    }

    if (userData.about) {
        const clean = DOMPurify.sanitize(userData.about, {
            ALLOWED_TAGS: ["b", "i", "u", "span", "ul", "li", "a", "p", "h1", "h2", "h3", "h4", "h5", "h6", "br", "hr", "base", "code", "pre"],
            ALLOWED_ATTR: ["href", "target", "rel", "style"]
        });

        userData.about = clean;
    }

    delete userData.password;
    delete user.password;

    return {
        props: {
            me: JSON.parse(JSON.stringify(user)),
            user: JSON.parse(JSON.stringify(userData)),
            isMe: user.id === userData.id,
        },
    };
}