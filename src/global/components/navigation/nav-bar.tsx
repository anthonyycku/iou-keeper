import React, { useEffect } from 'react';
import { Link } from "react-router-dom";
import { gapi } from "gapi-script";
import GoogleAuthButton from "./components/google-auth-button";

interface LinkButtonProps {
  text: string;
  path: string;
}

const LinkButton = ({ text, path }: LinkButtonProps) => {
  return (
    <Link to={path} className="text-white hover:underline">
      {text}
    </Link>
  )
}
const NavBar = () => {
  const clientId = '260492928179-bfugkb95ptjvit0hg8ooul8quppar8i5.apps.googleusercontent.com';

  useEffect(() => {
    const initClient = () => {
      gapi.client.init({
        clientId: clientId,
        scope: ''
      });
    };
    gapi.load('client:auth2', initClient);
  }, []);

  return (
    <>
      <nav className="flex bg-gray-900 w-full text-white px-4 py-2 justify-between items-center">
        <h1 className="h-6 mr-3 sm:h-9 font-bold text-lg">IOU Keeper</h1>
        <GoogleAuthButton clientId={clientId}/>
      </nav>
      <nav className="bg-gray-700">
        <ul className="flex flex-row mr-6 font-medium space-x-8 px-2">
          <LinkButton text="Home" path="/"/>
          <LinkButton text="Users" path="users"/>
          <LinkButton text="About" path="about"/>
        </ul>
      </nav>
    </>

  )
};

export default NavBar;