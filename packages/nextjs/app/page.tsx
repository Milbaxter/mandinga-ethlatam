"use client";

import { RaffleComponent } from "./RaffleComponent";
import type { NextPage } from "next";

const Home: NextPage = () => {
  return (
    <>
      <div className="flex items-center flex-col grow pt-10">
        <div className="grow bg-base-300 w-full mt-16 px-8 py-12">
          <div className="flex justify-center items-center gap-12 flex-col md:flex-row">
            <RaffleComponent />
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
