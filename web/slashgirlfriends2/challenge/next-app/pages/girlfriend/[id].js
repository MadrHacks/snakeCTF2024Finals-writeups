/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from "react";
import Image from "next/image";

import VideoPreviewComponent from "@/components/VideoPreview";
import PremiumTag from "@/components/PremiumTag";
import Button from "@/components/Button";
import Layout from "@/components/Layout";

import getClientPromise from "@/utils/mongodb";
import Link from "next/link";
import { getCookie } from "cookies-next";

export default function GirlfriendPage({ girlfriend }) {
    return (<>
        <Layout>
            <div
                className="bg-gradient-to-br from-primary/90 to-primary/25 relative rounded-lg flex md:h-96 sm:h-64"
            >
                <div className="absolute inset-8 flex">
                    <div className="flex-grow p-7 md:p-14 h-full flex">
                        <div className="my-auto">
                            <h1 className="xl:text-5xl md:text-4xl text-3xl font-black max-w-4xl flex items-center gap-x-4">
                                {girlfriend.name}
                                {girlfriend.premium && <PremiumTag />}
                            </h1>

                            <p className="md:text-2xl text-lg font-bold mt-4 max-w-2xl line-clamp-3">
                                {girlfriend.description}
                            </p>

                            <Link href={`/chat/${girlfriend.id}`}>
                                <Button className="w-full mt-4 bg-white/15 text-white">
                                    Chat with {girlfriend.name} now!
                                </Button>
                            </Link>
                        </div>
                    </div>
                    <Image
                        src={girlfriend.image}
                        width={400}
                        height={400}
                        alt="img"
                        title="Image banner"
                        className="h-full aspect-square object-cover ml-auto lg:block rounded-lg hidden z-10"
                    />
                </div>
                <Image
                    src={girlfriend.image}
                    width={400}
                    height={400}
                    alt="img"
                    title="Image hero banner"
                    className="h-full aspect-square hero-image object-cover mix-blend-screen ml-auto lg:block hidden rounded-lg"
                />
            </div>
        </Layout>
    </>);
};

export async function getServerSideProps(ctx) {
    const client = await getClientPromise();

    const db = client.db();
    const collection = db.collection("girlfriends");

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

    return {
        props: {
            girlfriend: JSON.parse(JSON.stringify(girlfriend))
        }
    };
}