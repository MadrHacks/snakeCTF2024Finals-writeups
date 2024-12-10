/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import jwt from "jsonwebtoken";

import VideoPreviewComponent from "@/components/VideoPreview";
import PremiumTag from "@/components/PremiumTag";
import Layout from "@/components/Layout";

import getClientPromise from "@/utils/mongodb";
import Input from "@/components/Input";
import Button from "@/components/Button";
import { getCookie } from "cookies-next";

let webSocket;
if (typeof window !== "undefined") {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";

    webSocket = new WebSocket(`${protocol}//${window.location.host}/api/ws`);
    setInterval(() => {
        if (webSocket.readyState !== webSocket.OPEN) {
            webSocket = new WebSocket(`${protocol}//${window.location.host}/api/ws`);
            return;
        }

        webSocket.send(JSON.stringify({
            command: "login",
            token: getCookie("auth")
        }))
    }, 2000);
};

const UID2Name = ({ uid }) => {
    const [Name, setName] = useState("Loading name...");

    const fetchName = async () => {
        const res = await fetch("/api/getUsernameFromUid?id=" + uid);
        const data = await res.json();

        if (data.username) {
            setName(`${data.username} (${uid})`);
        } else {
            setName(uid);
        }
    };

    useEffect(() => {
        fetchName();
    }, []);

    return (<><a className="underline" href={`/u/${uid}`}>{Name}</a></>);
};

export default function AdminPage({ }) {
    const chatRef = useRef(null);
    const [Message, setMessage] = useState("");
    const [GirlfriendID, setGirlfriendID] = useState("");
    const [Messages, setMessages] = useState([]);

    const scrollToBottom = (el) => {
        setTimeout(() => {
            el.scrollTop = el.scrollHeight;
        }, 100);
    };

    const sendMessage = async (e) => {
        e.preventDefault();

        if (!Message?.trim()) {
            return;
        }

        webSocket.send(JSON.stringify({
            command: "message",
            girlfriendId: GirlfriendID,
            message: Message,
            toAll: true
        }));

        setMessage("");
    };

    useEffect(() => {
        webSocket.onmessage = (event) => {
            const message = JSON.parse(event.data);

            if (message.event == "messageSent") {
                console.log(message.messages)
                setMessages((prev) => [...prev, ...message.messages]);
                scrollToBottom(chatRef.current);
            }

            if (message.event == "bulkMessageDone") {
                alert("Bulk message sent.");
            }
        };
    }, []);

    return (<>
        <Layout>
            <h1 className="xl:text-5xl md:text-4xl text-3xl font-black max-w-4xl mb-2">
                Admin panel
            </h1>
            <p>
                This it the admin panel. You can see all messages sent by users here.
            </p>

            <div className="relative px-8 py-4 mt-4 rounded-lg overflow-hidden bg-white/10">
                <div className="h-96 overflow-y-auto other-scrollbar flex flex-col divide-y-2 divide-white/20" ref={chatRef}>
                    {
                        Messages.map((message, i) => {
                            try {
                                return (
                                    <div
                                        key={i}
                                        className="py-2"
                                    >
                                        <p>
                                            <b>{message.girlfriend ? "girlfriend id: " + message.to : <UID2Name uid={message.from} />}</b>
                                            <span className="text-sm opacity-75 ml-4">
                                                {new Date(message.timestamp).toLocaleString()}
                                            </span>
                                        </p>
                                        <p>
                                            {message.content}
                                        </p>
                                    </div>
                                )
                            } catch {
                                return null;
                            }
                        })
                    }
                    {
                        Messages.length === 0 && <p>No messages yet for this session.</p>
                    }
                </div>

                <form onSubmit={sendMessage} className="flex mt-4">
                    <Input
                        required
                        type="text"
                        value={GirlfriendID}
                        onChange={(e) => setGirlfriendID(e.target.value)}
                        placeholder={`Send from girlfriend id`}
                        className="w-full mr-2"
                    />

                    <Input
                        required
                        type="text"
                        value={Message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder={`Type your message to send to everyone here...`}
                        className="w-full rounded-r-none"
                    />
                    <Button type="submit" className={"rounded-l-none"}>
                        Send
                    </Button>
                </form>
            </div>
        </Layout>
    </>);
};

export async function getServerSideProps(ctx) {
    const client = await getClientPromise();
    const db = client.db();
    const collection = db.collection("girlfriends");
    const users = db.collection("users");

    const token = getCookie("auth", { req: ctx.req });

    if (!token) {
        return {
            redirect: {
                destination: "/login",
                permanent: false
            }
        };
    }

    const { id: uid, admin } = jwt.verify(token, process.env.JWT_SECRET);
    const user = await users.findOne({ id: uid });

    if (!user || !admin) {
        return {
            redirect: {
                destination: "/",
                permanent: false
            }
        };
    }

    return {
        props: {}
    };
}