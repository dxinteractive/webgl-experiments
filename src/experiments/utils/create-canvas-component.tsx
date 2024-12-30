import { useEffect, useRef } from "react";

export function createCanvasComponent(
  onMount: (canvas: HTMLCanvasElement) => () => void,
  props = {}
) {
  return function CanvasComponent() {
    const ref = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
      const canvas = ref.current;
      if (!canvas) {
        return;
      }
      return onMount(canvas);
    }, []);

    return <canvas ref={ref} {...props} />;
  };
}
