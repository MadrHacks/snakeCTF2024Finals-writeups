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
}

export default function ChatPage({ girlfriend, user }) {
    const chatRef = useRef(null);
    const [Message, setMessage] = useState("");
    const [Loading, setLoading] = useState(true);
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
            girlfriendId: girlfriend.id,
            message: Message
        }));

        setMessage("");
    };

    useEffect(() => {
        webSocket.onmessage = (event) => {
            const message = JSON.parse(event.data);

            if (message.event == "message") {
                setMessages((prev) => [...prev, ...message.messages]);
                scrollToBottom(chatRef.current);
            }
        };
    }, []);

    const fetchMessages = async () => {
        const res = await fetch(`/api/getMessages?id=${girlfriend.id}`);

        if (res.status !== 200) {
            return alert("Failed to fetch messages");
        }

        const { messages } = await res.json();

        setMessages(messages);
        setLoading(false);

        scrollToBottom(chatRef.current);
    };

    const reportChat = async () => {
        const res = await fetch(`/api/report`, {
            "method": "POST",
            "headers": {
                "Content-Type": "application/json"
            },
            "body": JSON.stringify({
                "chatBot": girlfriend.id
            })
        });

        if (res.status !== 200) {
            const resData = await res.json();
            return alert(resData.message || "Failed to report");
        }

        alert("Reported successfully");
    };

    useEffect(() => {
        fetchMessages();
    }, []);

    return (<>
        <Layout>
            <div
                className="bg-gradient-to-br from-primary/90 to-primary/25 relative rounded-lg flex"
            >
                <div className="flex absolute inset-0 items-center justify-center">
                    <div className="flex-grow px-7 md:px-14">
                        <h1 className="xl:text-5xl md:text-4xl text-3xl font-black max-w-4xl mb-2">
                            {girlfriend.name}
                        </h1>
                        {girlfriend.premium && <PremiumTag />}
                    </div>

                    <Image
                        src={girlfriend.image}
                        width={400}
                        height={400}
                        alt="img"
                        title="Image banner"
                        className="h-32 w-32 object-cover lg:block rounded-lg hidden z-10 my-auto ml-auto mr-8"
                    />
                </div>

                <Image
                    src={girlfriend.image}
                    width={128}
                    height={128}
                    alt="img"
                    title="Image hero banner"
                    className="h-48 aspect-square hero-image object-cover mix-blend-screen ml-auto rounded-lg"
                />
            </div>

            <div className="relative px-8 py-4 mt-4 rounded-lg overflow-hidden bg-white/10">
                {girlfriend.premium && !user.premium &&
                    <p className="flex items-center z-50 px-28 text-center font-bold justify-center text-red-500 absolute inset-0 bg-black/50 backdrop-blur">You need to be a premium user to chat with this girlfriend.</p>
                }
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
                                            <b>{message.girlfriend ? girlfriend.name : "You"}</b>
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
                        Loading && <p>Loading messages...</p>
                    }
                    {
                        Messages.length === 0 && !Loading && <p>No messages yet for this session.<br />Your chat can be monitored for safety purposes by our administrators.</p>
                    }
                </div>

                <form onSubmit={sendMessage} className="flex mt-4">
                    <Input
                        type="text"
                        value={Message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder={`Type your message for ${girlfriend.name} here...`}
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

    const { id } = ctx.params;

    const girlfriend = await collection.findOne({ id });

    if (!girlfriend) {
        return {
            notFound: true
        }
    }


    const { id: uid } = jwt.verify(token, process.env.JWT_SECRET);
    const user = await users.findOne({ id: uid });

    return {
        props: {
            girlfriend: JSON.parse(JSON.stringify(girlfriend)),
            user: JSON.parse(JSON.stringify(user))
        }
    };
}