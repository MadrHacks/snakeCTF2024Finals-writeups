"use client";

import { deleteCookie } from "cookies-next";
import { useRouter } from "next/router";
import jwt from "jsonwebtoken";
import clsx from "clsx";

import { PDFCanvas } from "@/components/PDFCanvas";

export default function PDFViewer() {
  const { query } = useRouter();

  return (<>
    <div className="grid min-h-screen min-w-screen items-center justify-center bg-black">
      <PDFCanvas
        attachmentId={query.id}
        emailId={query.email}
      />
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

    return {
      props: {},
    };
  } catch (e) {
    deleteCookie("token", { req, res });

    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }
}