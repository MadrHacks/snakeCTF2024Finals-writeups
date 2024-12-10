import jwt from "jsonwebtoken";

import getClientPromise from "@/utils/mongodb";
import { getCookie } from "cookies-next";

export default function UserRedirect() {
    return (<></>);
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
        redirect: {
            destination: "/u/" + user.id,
            permanent: false
        }
    };
}