import type { ExperimentDefinition } from "../types";

function Component() {
  return <div>...</div>;
}

const example: ExperimentDefinition = {
  id: "blank",
  filename: "00-blank.tsx",
  name: "Blank experiment",
  description: "Duplicate this to make new experiments.",
  Component,
};

export default example;
