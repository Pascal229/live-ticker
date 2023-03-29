import React from "react";
import { Team } from "../../../server/src/trpc";

function Ticker() {
  return (
    <div className="flex h-10 justify-center bg-white">
      <div className="flex gap-5 p-5">
        <TeamImage teamKey="uhc_elgg" />
        <div>Elgg</div>
        <div className="bg- flex gap-5">
          <span>3</span>
          <span>:</span>
          <span>3</span>
        </div>
        <div>Elgg</div>
        <TeamImage teamKey="tvmelingen" />
      </div>
    </div>
  );
}

const TeamImage = (props: { teamKey: Team["key"] }) => {
  return (
    <div className="h-20 w-20 rounded-xl bg-black p-1">
      <img
        className="object-contain"
        src={`/teams/${props.teamKey}.png`}
        alt=""
      />
    </div>
  );
};

export default Ticker;
