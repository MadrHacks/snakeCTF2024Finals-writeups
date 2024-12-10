import { useState } from "react";
import { format } from "timeago.js";
import clsx from "clsx";

import { ArrowDownOnSquareIcon } from "@heroicons/react/24/outline";
import { XMarkIcon } from "@heroicons/react/20/solid";

import Input from "@/components/Input";
import Button from "@/components/Button";
import SnakeIcon from "@/components/SnakeIcon";

export default function Inbox({
    sent = false,
    emailsFrom = [],
    emailsFor = [],
}) {
    const [Loading, setLoading] = useState(false);
    const [EmbedUrl, setEmbedUrl] = useState(null);
    const [EmailDetails, setEmailDetails] = useState(null);
    const previewAvailableMimes = [
        "image/png",
        "image/jpeg",
        "image/gif",
        "image/webp",
        "application/pdf",
    ];

    const onClickEmail = async (emailId) => {
        setLoading(true);
        const res = await fetch(`/api/email?id=${emailId}`);
        const { email } = await res.json();

        setEmailDetails(email);
        setLoading(false);
    };

    const openFile = async (emailId, attachmentId) => {
        const attachment = EmailDetails.attachments[attachmentId];
        console.log(attachment);
        
        if (attachment.mime === "application/pdf") {
            setEmbedUrl(`/pdf?email=${emailId}&id=${attachmentId}`);
        } else if (previewAvailableMimes.includes(attachment.mime)) {
            setEmbedUrl(`/api/attachment?email=${emailId}&id=${attachmentId}`);
        } else {
            window.open(`/api/attachment?email=${emailId}&id=${attachmentId}&download=true`);
        }
    };

    if (!EmailDetails) {
        return (<>
            {Loading && <div className="absolute top-0 left-0 w-full h-full bg-black/50 flex items-center justify-center z-10"><SnakeIcon className="h-12 w-12 animate-bounce" /></div>}

            <div
                className={clsx(
                    "relative overflow-hidden",
                    "flex flex-col divide-y-2 divide-white/10 border-b-2 border-white/10",
                )}
            >
                {
                    (!sent ? emailsFor : emailsFrom).map((email, i) => (
                        <div
                            key={email.id}
                            onClick={() => onClickEmail(email.id)}
                            data-email-id={email.id}
                            className={clsx(
                                "flex flex-grow items-center justify-between px-4 py-2",
                                "hover:bg-white/10 cursor-pointer",
                                i == 0 && "rounded-t-[0.66rem]",
                            )}
                        >
                            <span className="font-medium w-[17.5%] truncate text-ellipsis">{email.sender}</span>
                            <span className="ml-16 truncate text-ellipsis">{email.excerpt}</span>
                            <span className="text-sm opacity-75 ml-auto">{format(email.date)}</span>
                        </div>
                    ))
                }

                {
                    (!sent ? emailsFor : emailsFrom).length === 0 && (
                        <div className="px-4 py-2 text-center">
                            <p className="opacity-75">No emails yet!</p>
                        </div>
                    )
                }
            </div>
        </>);
    } else {
        return (<>
            {Loading && <div className="absolute top-0 left-0 w-full h-full bg-black/50 flex items-center justify-center z-10"><SnakeIcon className="h-12 w-12 animate-bounce" /></div>}
            {EmbedUrl &&
                <div className="absolute top-0 left-0 w-full h-full bg-black/50 z-10 flex flex-col">
                    <p
                        onClick={() => setEmbedUrl(null)}
                        className="cursor-pointer py-2 text-center font-bold bg-black"
                    >
                            Exit
                    </p>
                    <embed src={EmbedUrl} className="h-full w-full" />
                </div>
            }
            
            <div
                onClick={() => setEmailDetails(null)}
                className={clsx(
                    "absolute top-4 right-4 w-10 h-10 rounded-full",
                    "bg-white/5 flex items-center justify-center cursor-pointer",
                    "transition-colors hover:bg-white/10",
                )}
            >
                <XMarkIcon className="h-6 w-6" />
            </div>

            <div className="h-full flex-col">
                <div className="px-6 py-4">
                    <h2 className="text-xl font-semibold">
                        {EmailDetails.subject}
                    </h2>
                    <p>
                        <span className="font-semibold">From:</span> {EmailDetails.sender}
                    </p>
                    <p>
                        <span className="font-semibold">To:</span> {EmailDetails.recipient}
                    </p>
                    <p>
                        <span className="font-semibold">Sent:</span> {new Date(EmailDetails.date).toLocaleString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                    </p>

                    {
                        EmailDetails.snakeify ? (
                            <p className="text-green-500 font-semibold flex items-center gap-x-2">
                                <SnakeIcon className="h-5 w-5" />
                                Snakeified
                            </p>
                        ) : (<></>)
                    }
                </div>

                <div className="px-6 py-4 border-t-2 border-white/10">
                    <p>
                        {EmailDetails.body.split("\n").map((line, i) => (
                            <span key={i} className="block">{line}</span>
                        ))}
                    </p>

                    {
                        EmailDetails.attachments?.length > 0 && (<>
                            <p className="text-sm opacity-75 mb-2 mt-6 font-semibold uppercase">
                                Attachments
                            </p>
                            <div className="flex flex-wrap gap-4">
                                {
                                    EmailDetails.attachments.map(attachment => (
                                        <div
                                            data-mime={attachment.mime}
                                            data-id={attachment.id}
                                            key={attachment.id}
                                            name={attachment.filename}
                                            onClick={() => openFile(EmailDetails.id, attachment.id)}
                                            className={clsx(
                                                "px-4 py-1 border-2 border-white/10 rounded-xl bg-white/5 w-48",
                                                "flex gap-x-4 items-center cursor-pointer hover:bg-white/10 transition-colors"
                                            )}
                                        >
                                            <ArrowDownOnSquareIcon className="h-6 w-6 min-w-6 min-h-6" />
                                            <p className="leading-4 truncate text-ellipsis">
                                                <span className="truncate text-ellipsis">{attachment.filename}</span>
                                                <br />
                                                <span className="text-xs opacity-50">{attachment.readableType}</span>
                                            </p>
                                        </div>
                                    ))
                                }
                            </div>
                        </>)
                    }
                </div>
            </div>
        </>);
    }
};