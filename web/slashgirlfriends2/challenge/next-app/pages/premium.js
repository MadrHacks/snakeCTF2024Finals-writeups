/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from "react";
import Image from "next/image";
import jwt from "jsonwebtoken";

import Layout from "@/components/Layout";
import Button from "@/components/Button";

import getClientPromise from "@/utils/mongodb";
import { getCookie } from "cookies-next";

export default function Premium({ isPremium, notes }) {
  const goToPaymentProcessor = async () => {
    const res = await fetch("/api/getPaymentIntent", {
      method: "POST",
      body: JSON.stringify({
        host: window.location.host
      }),
      headers: {
        "Content-Type": "application/json"
      },
    });
    const { paymentIntent } = await res.json();

    if (res.status === 200) {
      // get current domain and set the port to 3002
      const domain = window.location.host.split(":")[0];
      window.location.href = `http://${domain}:3002/?pi=${paymentIntent}`;
    } else {
      alert("uhh something went wrong, try again later.");
    }
  };

  if (!isPremium) {
    return (<>
      <Layout>
        <div
          className="bg-gradient-to-br from-primary/90 to-primary/25 rounded-lg flex md:h-96 sm:h-64"
        >
          <div className="flex-grow p-7 md:p-14 h-full flex">
            <div className="my-auto">
              <h1 className="xl:text-5xl md:text-4xl text-3xl font-black max-w-4xl">
                Get more from your AI girlfriend with SlashGirlfriends premium
              </h1>

              <p className="md:text-2xl text-lg font-bold mt-4 max-w-2xl">
                Get the best AI girlfriends with premium features like premium characters, custom personalities and more only for $13.37/month.
              </p>

              <Button className="w-full mt-4 bg-white/15 text-white max-w-lg" onClick={goToPaymentProcessor}>
                Buy now!
              </Button>
            </div>
          </div>
          
          <Image
            src="/hero.jpg"
            width={400}
            height={400}
            alt="img"
            title="Image banner"
            className="h-full w-96 hero-image object-cover mix-blend-screen ml-auto lg:block hidden rounded-lg"
          />
        </div>
      </Layout>
    </>);
  } else {
    return (<>
      <Layout>
        <div
          className="bg-gradient-to-br from-primary/90 to-primary/25 rounded-lg flex md:h-96 sm:h-64"
        >
          <div className="flex-grow p-7 md:p-14 h-full flex">
            <div className="my-auto">
              <h1 className="xl:text-5xl md:text-4xl text-3xl font-black max-w-4xl">
                You are a premium user!
              </h1>

              <p className="md:text-2xl text-lg font-bold mt-4 max-w-2xl">
                Congrats.
                <br />
                Payment notes: <code>{notes || "No notes provided."}</code>
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
  }
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

  return {
    props: {
      isPremium: !!user.premium,
      notes: user.paymentNotes || ""
    }
  };
}