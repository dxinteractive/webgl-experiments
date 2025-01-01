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

async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve) => {
    const image = new Image();
    image.src = src;
    image.onload = () => resolve(image);
  });
}

export function createCanvasComponentWithImages(
  onMount: (
    canvas: HTMLCanvasElement,
    images: HTMLImageElement[]
  ) => () => void,
  imageSrcs: string[],
  props = {}
) {
  return createCanvasComponent((canvas: HTMLCanvasElement) => {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    let cleanup = () => {};

    Promise.all(imageSrcs.map((img) => loadImage(img))).then(
      (images: HTMLImageElement[]) => {
        cleanup = onMount(canvas, images);
      }
    );

    return () => cleanup();
  }, props);
}
