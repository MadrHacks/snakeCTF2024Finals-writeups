import { useState, useEffect } from "react";
import { deleteCookie } from "cookies-next";
import { open } from "sqlite";
import sqlite3 from "sqlite3";
import jwt from "jsonwebtoken";
import clsx from "clsx";

import {
  InboxIcon,
  PaperAirplaneIcon,
  PencilIcon
} from "@heroicons/react/20/solid";

import Input from "@/components/Input";
import Button from "@/components/Button";

import Inbox from "@/tabs/Inbox";
import Compose from "@/tabs/Compose";
import SnakeIcon from "@/components/SnakeIcon";

let db = null;

export default function Home({
  user,
  emailsFor,
  emailsFrom,
}) {
  const [CurrentTab, setCurrentTab] = useState(0);
  const Tabs = [
    {
      name: "Inbox",
      icon: InboxIcon,
      component: Inbox,
    },
    {
      name: "Sent",
      icon: PaperAirplaneIcon,
      component: (props) => <Inbox {...props} sent />,
    },
    {
      name: "Compose",
      icon: PencilIcon,
      component: Compose
    },
  ];

  return (<>
    <div
      className={clsx(
        "flex h-screen w-screen",
      )}
    >
      <div
        className={clsx(
          "w-[20%] py-4 pl-6 text-center",
          "flex flex-col gap-y-2"
        )}
      >
        <h1 className="text-2xl font-extrabold mb-2 flex items-center justify-center gap-x-4">
          <SnakeIcon className="h-8 w-8 inline-block" />
          <span>Snakemail</span>
        </h1>

        {
          Tabs.map((tab, i) => (
            <Button
              key={i}
              onClick={() => setCurrentTab(i)}
              className={clsx(
                "relative flex items-center rounded-r-none border-r-0",
                CurrentTab === i && "bg-white/15 border-transparent focus:border-transparent hover:bg-white/15",
              )}
            >
              <tab.icon className="h-6 w-6 absolute left-6" />
              <span className="ml-12">{tab.name}</span>
            </Button>
          ))
        }

        <div className="mr-6 mt-auto">
          <div
            className={clsx(
              "px-4 py-2 w-full text-left backdrop-blur cursor-pointer",
              "rounded-xl border-2 border-white/10 bg-white/5",
            )}
            onClick={() => {
              navigator.clipboard.writeText(user.username + "@mail.snakectf.org");
              alert("Copied to clipboard!");
            }}
          >
            <span className="text-base opacity-75">{user.username}@mail.snakectf.org</span>
            <br />
            <span className="text-sm text-white text-opacity-50 flex items-center">
              Click to copy
            </span>
          </div>
        </div>
      </div>
      <div
        className={clsx(
          "flex-grow bg-white/5 mt-4 mr-4 grid overflow-hidden",
          "rounded-t-xl border-2 border-white/10"
        )}
      >
        <div
          className={clsx(
            "overflow-y-auto backdrop-blur",
            "relative custom-scrollbar"
          )}
        >
          {(() => {
            const Tab = Tabs[CurrentTab].component;

            return <Tab
              user={user}
              emailsFor={emailsFor}
              emailsFrom={emailsFrom}
            />;
          })()}
        </div>
      </div>
    </div>
  </>);
};

export async function getServerSideProps({ req, res }) {
  const { token } = req.cookies;

  if (!token) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!db) {
      db = await open({
        filename: "/tmp/data.db",
        driver: sqlite3.Database,
      });
    }

    const user = await db.get("SELECT * FROM users WHERE id = ?", [decoded.id]);
    delete user.password;

    const emailsFor = await db.all("SELECT * FROM emails WHERE recipient = ?", [user.username + "@mail.snakectf.org"]);
    const emailsFrom = await db.all("SELECT * FROM emails WHERE sender = ?", [user.username + "@mail.snakectf.org"]);

    const normalizeEmails = (emails) => emails ? emails.map(email => {
      email.excerpt = email.body.slice(0, 50).trim();
      if (email.body.length > 50) email.excerpt += "...";
      delete email.body;
      delete email.attachments;
      delete email.snakeify;
      delete email.readReceipt;

      return email;
    }).sort((a, b) => new Date(b.date) - new Date(a.date)) : [];

    return {
      props: {
        user,
        emailsFor: normalizeEmails(emailsFor),
        emailsFrom: normalizeEmails(emailsFrom),
      },
    };
  } catch {
    deleteCookie("token", { req, res });

    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }
}