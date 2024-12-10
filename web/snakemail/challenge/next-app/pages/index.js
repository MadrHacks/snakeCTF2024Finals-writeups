import { useState, useEffect } from "react";
import { deleteCookie } from "cookies-next";
import jwt from "jsonwebtoken";
import clsx from "clsx";

import Input from "@/components/Input";
import Button from "@/components/Button";

export default function Home() {
  const [ShowSignup, setShowSignup] = useState(false);
  const [SigninData, setSigninData] = useState({
    username: "",
    password: "",
  });
  const [SignupData, setSignupData] = useState({
    username: "",
    password: "",
    passwordConfirm: "",
  });

  const toggleShowSignup = () => setShowSignup(o => !o);
  const handleFormSubmit = async (isSignup) => {
    let checkData = isSignup ? SignupData : SigninData;

    if (isSignup) {
      if (checkData.password !== checkData.passwordConfirm) {
        alert("Passwords do not match.");
        return;
      }
    }

    if (checkData.password.length < 8) {
      alert("Password must be at least 8 characters long.");
      return;
    }

    if (checkData.username.length < 3) {
      alert("Username must be at least 3 characters long.");
      return;
    }

    if (checkData.username.length > 16) {
      alert("Username must be at most 16 characters long.");
      return;
    }

    if (checkData.password.length > 32) {
      alert("Password must be at most 32 characters long.");
      return;
    }

    try {
      const res = await fetch(`/api/auth/${isSignup ? "signup" : "signin"}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(checkData),
      });

      const data = await res.json();

      if (data.error) {
        alert(data.error);
        return;
      }

      alert("Successfully signed in!");
      window.location.reload();
    } catch (e) {
      console.error(e);
      alert("An error occurred while trying to sign in.\nCheck console for more information.");
    }
  };

  if (ShowSignup) return (<>
    <div
      className={clsx(
        "p-6 max-w-xl w-full m-auto flex flex-col justify-center items-center",
        "rounded-xl border-2 border-white/10 bg-containerBackground",
      )}
    >
      <h1 className="text-2xl font-extrabold">Sign up for Snakemail</h1>
      <p className="text-sm opacity-85">Hello there! We&apos;re happy to see you want to create a Snakemail account!</p>

      <div className="mt-4 flex flex-col gap-y-2 w-full">
        <Input
          onChange={e => setSignupData({ ...SignupData, username: e.target.value })}
          value={SignupData.username}
          placeholder="zuck"
          label="Username"
          type="text"
        />

        <Input
          onChange={e => setSignupData({ ...SignupData, password: e.target.value })}
          value={SignupData.password}
          placeholder="m37a_<3"
          label="Password"
          type="password"
        />

        <Input
          onChange={e => setSignupData({ ...SignupData, passwordConfirm: e.target.value })}
          value={SignupData.passwordConfirm}
          label="Confirm your password"
          placeholder="m37a_<3"
          type="password"
        />

        <Button onClick={() => handleFormSubmit(true)}>Sign up</Button>
      </div>

      <p className="text-sm mt-4 opacity-85">Already have an account? <a onClick={toggleShowSignup}>Sign in.</a></p>
    </div>
  </>);

  return (<>
    <div
      className={clsx(
        "p-6 max-w-xl w-full m-auto flex flex-col justify-center items-center",
        "rounded-xl border-2 border-white/10 bg-containerBackground",
      )}
    >
      <h1 className="text-2xl font-extrabold">Sign in into Snakemail</h1>
      <p className="text-sm opacity-85">Welcome back! Sign in to your account to continue.</p>

      <div className="mt-4 flex flex-col gap-y-2 w-full">
        <Input
          onChange={e => setSigninData({ ...SigninData, username: e.target.value })}
          value={SigninData.username}
          placeholder="zuck"
          label="Username"
          type="text"
        />

        <Input
          onChange={e => setSigninData({ ...SigninData, password: e.target.value })}
          value={SigninData.password}
          placeholder="m37a_<3"
          label="Password"
          type="password"
        />

        <Button onClick={() => handleFormSubmit(false)}>Sign in</Button>
      </div>
      <p className="text-sm mt-4 opacity-85">Don&apos;t have an account? <a onClick={toggleShowSignup}>Create one!</a></p>
    </div>
  </>);
};

export async function getServerSideProps({ req, res }) {
  const { token } = req.cookies;

  if (token) {
    try {
      jwt.verify(token, process.env.JWT_SECRET);

      return {
        redirect: {
          destination: "/app",
          permanent: false,
        },
      };
    } catch {
      deleteCookie("token", { req, res });
    }
  }

  return {
    props: {},
  };
}