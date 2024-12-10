import { useState } from "react";
import clsx from "clsx";

import { ArrowDownOnSquareIcon } from "@heroicons/react/24/outline";
import { EyeIcon, EyeSlashIcon, PaperAirplaneIcon, PlusIcon, XMarkIcon } from "@heroicons/react/20/solid";

import Input from "@/components/Input";
import Button from "@/components/Button";
import SnakeIcon from "@/components/SnakeIcon";

export default function Compose({
    data
}) {
    const [Loading, setLoading] = useState(false);
    const [EmailDetails, setEmailDetails] = useState({
        attachments: [],
        subject: "",
        recipient: "",
        body: "",
        snakeify: false,
        readReceipt: false
    });

    const send = async () => {
        setLoading(true);

        const formData = new FormData();
        formData.append("subject", EmailDetails.subject);
        formData.append("recipient", EmailDetails.recipient);
        formData.append("body", EmailDetails.body);
        formData.append("snakeify", EmailDetails.snakeify);
        formData.append("readReceipt", EmailDetails.readReceipt);

        EmailDetails.attachments.forEach((file, index) => {
            formData.append("attachments", file);
        });

        const res = await fetch("/api/email", {
            method: "POST",
            body: formData,
        });

        const data = await res.json();

        if (data.error) {
            alert(data.error);
        } else {
            setEmailDetails({
                attachments: [],
                subject: "",
                recipient: "",
                body: "",
                snakeify: false,
                readReceipt: false
            });
            alert("Email sent successfully!");
        }

        setLoading(false);
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.some(file => file.size > 3 * 1024 * 1024)) {
            alert("File is too large.");
            return;
        }

        const allowedMimes = [
            "image/png",
            "image/jpeg",
            "image/gif",
            "image/webp",
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ];

        if (files.some(file => !allowedMimes.includes(file.type))) {
            alert("Invalid file type.\nAllowed types: PNG, JPEG, GIF, WEBP, PDF, DOC, DOCX, XLS, XLSX");
            return;
        }

        setEmailDetails(o => ({
            ...o,
            attachments: [...o.attachments, ...files].slice(0, 3) // Ensure only 3 files
        }));
    };

    return (<>
        {Loading && <div className="absolute top-0 left-0 w-full h-full bg-black/50 flex items-center justify-center z-10"><SnakeIcon className="h-12 w-12 animate-bounce" /></div>}

        <div className="h-full flex-col divide-y-2 divide-white/10">
            <div className="px-6 py-4 flex flex-col gap-y-2">
                <Input
                    value={EmailDetails.subject}
                    onChange={(e) => setEmailDetails(o => ({ ...o, subject: e.target.value }))}
                    label="Subject"
                    placeholder="Hello my friend!"
                />
                <Input
                    value={EmailDetails.recipient}
                    onChange={(e) => setEmailDetails(o => ({ ...o, recipient: e.target.value }))}
                    label="To (only one recipient)"
                    placeholder="zuck@mail.snakectf.org"
                />
            </div>

            <textarea
                onChange={(e) => setEmailDetails(o => ({ ...o, body: e.target.value }))}
                value={EmailDetails.body}
                placeholder="Type your email here..."
                className={clsx(
                    "px-6 py-4 outline-none placeholder:text-white/50",
                    "bg-transparent w-full resize-none custom-scrollbar",
                    // "focus:border-white/20 transition-colors",
                )}
                rows={10}
            />

            <div className="flex flex-wrap px-6 py-4 gap-4">
                {
                    EmailDetails.attachments.map((attachment, index) => (
                        <div
                            key={attachment.id}
                            onClick={() => setEmailDetails(o => ({
                                ...o,
                                attachments: o.attachments.filter((_, i) => i !== index)
                            }))}
                            className={clsx(
                                "px-4 py-1 border-2 border-white/10 rounded-xl bg-white/5 w-48",
                                "flex gap-x-4 items-center cursor-pointer hover:bg-white/10 transition-colors"
                            )}
                        >
                            <ArrowDownOnSquareIcon className="h-6 w-6 min-w-6 min-h-6" />
                            <p className="leading-4 truncate text-ellipsis">
                                <span className="truncate text-ellipsis">{attachment.name}</span>
                                <br />
                                <span className="text-xs opacity-50">{Math.floor(((attachment.size / 1024) / 1024) * 10) / 10} mb</span>
                            </p>
                        </div>
                    ))
                }

                {
                    EmailDetails.attachments.length < 3 && (
                        <div className="flex items-center">
                            <input
                                type="file"
                                multiple
                                onChange={handleFileChange}
                                className="hidden"
                                id="fileUpload"
                                accept=".png,.jpeg,.jpg,.gif,.webp,.pdf,.doc,.docx,.xls,.xlsx"
                            />
                            <label
                                htmlFor="fileUpload"
                                className={clsx(
                                    "px-4 py-1 border-2 border-white/10 rounded-xl bg-white/5 w-48",
                                    "flex gap-x-4 items-center cursor-pointer hover:bg-white/10 transition-colors"
                                )}
                            >
                                <PlusIcon className="h-6 w-6 min-w-6 min-h-6" />
                                <p className="leading-4 truncate text-ellipsis">
                                    <span className="truncate text-ellipsis">Add file</span>
                                    <br />
                                    <span className="text-xs opacity-50">up to 3MB</span>
                                </p>
                            </label>
                        </div>
                    )
                }
            </div>

            <div className="flex gap-4 px-6 py-4">
                <Button
                    onClick={() => setEmailDetails(o => ({ ...o, snakeify: !o.snakeify }))}
                    className={"relative flex items-center"}
                >
                    <SnakeIcon crossed={EmailDetails.snakeify} className="h-6 w-6 absolute left-6" />
                    <span className="ml-12">{EmailDetails.snakeify ? "Desnakeify" : "Snakeify"} email</span>
                </Button>
                <Button
                    onClick={() => setEmailDetails(o => ({ ...o, readReceipt: !o.readReceipt }))}
                    className={"relative flex items-center"}
                >
                    {
                        EmailDetails.readReceipt ? (
                            <EyeSlashIcon className="h-6 w-6 absolute left-6" />
                        ) : (
                            <EyeIcon className="h-6 w-6 absolute left-6" />
                        )
                    }
                    <span className="ml-12">{EmailDetails.readReceipt ? "Disable" : "Enable"} read receipt</span>
                </Button>
                <Button
                    onClick={send}
                    className={"relative flex items-center"}
                >
                    <PaperAirplaneIcon className="h-6 w-6 absolute left-6" />
                    <span className="ml-12">Send</span>
                </Button>
            </div>
        </div>
    </>);
};