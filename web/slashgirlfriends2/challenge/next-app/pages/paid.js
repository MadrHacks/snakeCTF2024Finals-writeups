/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from "react";
import Image from "next/image";
import jwt from "jsonwebtoken";

import Layout from "@/components/Layout";
import Button from "@/components/Button";

import getClientPromise from "@/utils/mongodb";
import { getCookie } from "cookies-next";

export default function PaymentDone() {
    return (<>
        <Layout>
            <div
                className="bg-gradient-to-br from-primary/90 to-primary/25 rounded-lg flex md:h-96 sm:h-64"
            >
                <div className="flex-grow p-7 md:p-14 h-full flex">
                    <div className="my-auto">
                        <h1 className="xl:text-5xl md:text-4xl text-3xl font-black max-w-4xl">
                            You now are a premium user!
                        </h1>

                        <p className="md:text-2xl text-lg font-bold mt-4 max-w-2xl">
                            Thanks for your purchase.
                        </p>
                    </div>
                </div>

                <Image
                    src="/chrome_UfrvfkLTNt.png"
                    width={400}
                    height={400}
                    alt="img"
                    title="Image banner"
                    className="h-full w-96 hero-image object-cover mix-blend-screen ml-auto lg:block hidden rounded-lg"
                />
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

    const { token: paymentToken } = ctx.query;
    
    if (!paymentToken) {
        return {
            redirect: {
                destination: "/",
                permanent: false
            }
        };
    }

    const { id: paymentId, notes } = jwt.verify(paymentToken, process.env.JWT_SECRET);

    if (paymentId !== id) {
        return {
            redirect: {
                destination: "/",
                permanent: false
            }
        };
    }

    await collection.updateOne({ id }, {
        $set: {
            premium: true,
            paymentNotes: notes,
        }
    });

    return {
        props: {
            isPremium: !!user.premium,
        }
    };
}