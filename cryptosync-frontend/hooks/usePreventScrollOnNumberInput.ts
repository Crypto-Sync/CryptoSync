import { useEffect } from "react";

const usePreventScrollOnNumberInput = () => {
  useEffect(() => {
    const handleWheel = (event: WheelEvent) => {
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" &&
        (target as HTMLInputElement).type === "number"
      ) {
        event.preventDefault(); // Prevent default scroll behavior for number inputs
      }
    };

    // Attach event listener to prevent scrolling
    document.addEventListener("wheel", handleWheel, { passive: false });

    // Clean up event listener when component unmounts
    return () => {
      document.removeEventListener("wheel", handleWheel);
    };
  }, []);
};

export default usePreventScrollOnNumberInput;
