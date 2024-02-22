import { useEffect, useRef } from "react";
import type { ExperimentDefinition } from "../types";

import Two from "two.js";

function Component() {
  const divRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const div = divRef.current;
    if (!div) {
      return;
    }

    const two = new Two({
      fullscreen: true,
      autostart: true,
      type: Two.Types.svg,
    }).appendTo(div);

    const rect = two.makeRectangle(two.width / 2, two.height / 2, 50, 50);
    two.bind("update", () => {
      rect.rotation += 0.01;
    });

    return () => {
      two.unbind("update");
      two.pause();
      div.removeChild(two.renderer.domElement);
    };
  }, []);

  return <div ref={divRef} />;
}

const example: ExperimentDefinition = {
  id: "two-hello-world",
  filename: "12-two-hello-world.tsx",
  name: "Two hello world",
  description: "Two.js hello world",
  Component,
};

export default example;
