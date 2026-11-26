import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

type ScaleToFitProps = {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
};

/**
 * Renders children at their natural (viewport-unit-driven) size, then
 * uniformly scales the result to fit this box. Lets stage-sized components
 * — built with vw/vh so they fill the actual LED wall — drop into a small
 * preview card without their own CSS knowing it's being shrunk.
 */
export const ScaleToFit = ({ children, className, style }: ScaleToFitProps) => {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;

    const recompute = () => {
      const outerWidth = outer.clientWidth;
      const outerHeight = outer.clientHeight;
      const innerWidth = inner.scrollWidth;
      const innerHeight = inner.scrollHeight;
      if (!innerWidth || !innerHeight) return;
      setScale(Math.min(outerWidth / innerWidth, outerHeight / innerHeight));
    };

    recompute();
    const observer = new ResizeObserver(recompute);
    observer.observe(outer);
    observer.observe(inner);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={outerRef} className={`relative overflow-hidden ${className ?? ""}`} style={style}>
      <div
        ref={innerRef}
        className="absolute left-1/2 top-1/2"
        style={{ transform: `translate(-50%, -50%) scale(${scale})` }}
      >
        {children}
      </div>
    </div>
  );
};
