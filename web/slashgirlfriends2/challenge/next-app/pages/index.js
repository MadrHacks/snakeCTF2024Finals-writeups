/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from "react";
import Image from "next/image";

import VideoPreviewComponent from "@/components/VideoPreview";
import Layout from "@/components/Layout";

import getClientPromise from "@/utils/mongodb";

export default function Home({ girlfriends }) {
  return (<>
    <Layout>
      <div
        className="bg-gradient-to-br from-primary/90 to-primary/25 rounded-lg flex md:h-96 sm:h-64"
      >
        <div className="flex-grow p-7 md:p-14 h-full flex">
          <div className="my-auto">
            <h1 className="xl:text-5xl md:text-4xl text-3xl font-black max-w-4xl">
              Looking for a girlfriend but too busy with CTFs?
            </h1>

            <p className="md:text-2xl text-lg font-bold mt-4 max-w-2xl">
              Experience the future of companionship with AI-powered girlfriends at SlashGirlfriends, the best AI girlfriend directory on the internet.
            </p>
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

      <div className="mt-8 grid xl:grid-cols-4 gap-8 flex-grow">
        <div className="xl:col-span-4 flex lg:flex-row flex-col">
          <h2 className="text-3xl font-bold my-auto flex">
            Available girlfriends
            </h2>
        </div>

        {
          girlfriends?.map((girlfriend, i) => (<>
            <VideoPreviewComponent
              key={girlfriend.id}
              id={girlfriend.id}
              premium={girlfriend.premium}
              title={girlfriend.name}
              preview={girlfriend.image} 
            />
          </>))
        }
      </div>

    </Layout>
  </>);
};

export async function getServerSideProps() {
  const client = await getClientPromise();

  const db = client.db();
  const collection = db.collection("girlfriends");

  const girlfriends = await collection.find({}).toArray();

  return {
    props: {
      girlfriends: JSON.parse(JSON.stringify(girlfriends))
    }
  };
}