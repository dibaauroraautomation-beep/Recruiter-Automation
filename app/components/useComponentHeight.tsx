import { useRef, useState, useEffect } from "react";

export function useComponentHeight() {
  const ref = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number>(0);

  useEffect(() => {
    if (!ref.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const measuredHeight = entry.borderBoxSize?.[0]?.blockSize
          ?? entry.target.getBoundingClientRect().height;

        setHeight(measuredHeight);
      }
    });

    resizeObserver.observe(ref.current);

    return () => resizeObserver.disconnect();
  }, []);

  return [ref, height] as const;
}
