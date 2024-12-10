import { CheckBadgeIcon } from "@heroicons/react/24/solid";
import Image from "next/legacy/image";
import Link from "next/link";
import { useState } from "react";
import PremiumTag from "./PremiumTag";

Math.seed = function (s) {
    return function () {
        s = Math.sin(s) * 10000; return s - Math.floor(s);
    };
};

function numberize_string(txt) {
    txt = txt.toLowerCase();
    return Number(txt.split('').map(function (c) {
        return 'abcdefghijklmnopqrstuvwxyz'.indexOf(c) + 1 || '';
    }).join(''));
}

export default function VideoPreviewComponent({
    id,
    preview,
    premium,
    title,
    username,
    verified,
}) {
    const [src, setSrc] = useState(preview);

    const convertImage = (w, h) => `
  <svg width="${w}" height="${h}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <defs>
      <linearGradient id="g">
        <stop stop-color="#333" offset="20%" />
        <stop stop-color="#222" offset="50%" />
        <stop stop-color="#333" offset="70%" />
      </linearGradient>
    </defs>
    <rect width="${w}" height="${h}" fill="#333" />
    <rect id="r" width="${w}" height="${h}" fill="url(#g)" />
    <animate xlink:href="#r" attributeName="x" from="-${w}" to="${w}" dur="1s" repeatCount="indefinite"  />
  </svg>`;

    const toBase64 = (str) =>
        typeof window === 'undefined'
            ? Buffer.from(str).toString('base64')
            : window.btoa(str);

    return (<>
        <a
            href={`/girlfriend/${id}`}
            hrefLang="en"
        >
            <div
                className={`
                  rounded-lg border-2
                  text-secondary border-primary/20 hover:text-primary hover:border-primary/40 bg-white/10
                  transition cursor-pointer
                `}
            >
                <div className="relative rounded-t-md bg-gray-900 border-b-2 border-primary/20 w-full aspect-square">
                    <Image
                        key={src}
                        id={src}
                        src={src}
                        alt="Preview"
                        layout="fill"
                        title={title}
                        className="rounded-t-md object-cover"
                        placeholder="blur"
                        blurDataURL={`data:image/svg+xml;base64,${toBase64(
                            convertImage(300, 140)
                        )}`}
                        onError={() => setSrc('https://i.marco.win/image-not-available-slashpankakes.png')}
                    />
                    {
                        premium && (
                            <div className="z-10 absolute top-0 right-0 rounded-bl-lg bg-black text-sm px-2 py-1">
                                <PremiumTag
                                    className="inline-flex text-primary items-center justify-center"
                                />
                            </div>
                        )
                    }
                </div>
                <div className="p-4">
                    <h2
                        className="font-bold line-clamp-1"
                        title={title}
                    >
                        {title.endsWith("min") ? title.split(" ").slice(0, -2).join(" ") : title}
                    </h2>
                    {
                        false && (
                            <p className="text-sm flex mt-1">
                                <span>
                                    {username}
                                </span>

                                {
                                    premium && (<>
                                        <span className="ml-1 my-auto inline-flex text-primary">
                                            <CheckBadgeIcon className="w-4 h-4" />
                                        </span>
                                    </>)
                                }
                            </p>
                        )
                    }
                </div>
            </div>
        </a>
    </>);
};
