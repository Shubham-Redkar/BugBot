import { useEffect, useRef, useState } from "react";

const LERP = 0.09;
const DAMPING = 0.92;
const TOUCH_MULT = 1.6;

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}
function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

export function useSmoothScroll() {
  const [scrollY, setScrollY] = useState(0);
  const currentYRef = useRef(0);
  const targetYRef = useRef(0);
  const velRef = useRef(0);
  const animRef = useRef<number>();
  const touchRef = useRef(0);

  useEffect(() => {
    const wrapper = document.getElementById("smooth-wrapper");
    const content = document.getElementById("smooth-content");
    if (!wrapper || !content) return;

    const prevBodyOverflow = document.body.style.overflow;
    const prevBodyPos = document.body.style.position;
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.width = "100%";

    wrapper.style.position = "fixed";
    wrapper.style.top = "0";
    wrapper.style.left = "0";
    wrapper.style.right = "0";
    wrapper.style.bottom = "0";
    wrapper.style.overflow = "hidden";

    content.style.willChange = "transform";

    const sentinel = document.createElement("div");
    sentinel.id = "smooth-sentinel";
    sentinel.style.cssText = `
      position: fixed; top: 0; right: 0;
      width: 1px; height: 1px; opacity: 0; pointer-events: none;
    `;
    document.body.appendChild(sentinel);

    const ro = new ResizeObserver(() => {
      const maxScroll = content.scrollHeight - window.innerHeight;
      document.documentElement.style.setProperty(
        "--max-scroll",
        `${maxScroll}`,
      );
    });
    ro.observe(content);

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const maxScroll = content.scrollHeight - window.innerHeight;
      velRef.current += e.deltaY;
      targetYRef.current = clamp(targetYRef.current + e.deltaY, 0, maxScroll);
    };

    const onTouchStart = (e: TouchEvent) => {
      touchRef.current = e.touches[0].clientY;
    };
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const dy = (touchRef.current - e.touches[0].clientY) * TOUCH_MULT;
      touchRef.current = e.touches[0].clientY;
      const maxScroll = content.scrollHeight - window.innerHeight;
      targetYRef.current = clamp(targetYRef.current + dy, 0, maxScroll);
    };

    wrapper.addEventListener("wheel", onWheel, { passive: false });
    wrapper.addEventListener("touchstart", onTouchStart, { passive: false });
    wrapper.addEventListener("touchmove", onTouchMove, { passive: false });

    let lastScrollY = -1;
    const tick = () => {
      const maxScroll = content.scrollHeight - window.innerHeight;
      velRef.current *= DAMPING;
      currentYRef.current = lerp(
        currentYRef.current,
        clamp(targetYRef.current, 0, maxScroll),
        LERP,
      );

      const rounded = Math.round(currentYRef.current * 100) / 100;
      content.style.transform = `translate3d(0, ${-rounded}px, 0)`;

      document.documentElement.style.setProperty("--scroll-y", `${rounded}`);

      if (Math.abs(rounded - lastScrollY) > 0.5) {
        lastScrollY = rounded;
        setScrollY(rounded);
      }

      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);

    const onHashChange = () => {
      const hash = window.location.hash;
      if (!hash) return;
      const target = document.querySelector(hash) as HTMLElement | null;
      if (target) {
        const maxScroll = content.scrollHeight - window.innerHeight;
        targetYRef.current = clamp(target.offsetTop, 0, maxScroll);
      }
    };
    window.addEventListener("hashchange", onHashChange);

    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.body.style.position = prevBodyPos;
      document.body.style.width = "";
      wrapper.style.cssText = "";
      content.style.willChange = "";
      content.style.transform = "";
      sentinel.remove();
      ro.disconnect();
      wrapper.removeEventListener("wheel", onWheel);
      wrapper.removeEventListener("touchstart", onTouchStart);
      wrapper.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("hashchange", onHashChange);
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  return { scrollY };
}

export function useScrollY(): number {
  const [y, setY] = useState(0);
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const val = parseFloat(
        document.documentElement.style.getPropertyValue("--scroll-y") || "0",
      );
      setY(val);
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["style"],
    });
    return () => observer.disconnect();
  }, []);
  return y;
}
