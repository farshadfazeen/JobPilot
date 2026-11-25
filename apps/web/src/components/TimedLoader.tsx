
import { useEffect, useState } from "react";
import { FlightLoader } from "./Brand";

export default function TimedLoader({
  loading,
  children,
}: {
  loading: boolean;
  children: React.ReactNode;
}) {
  const [introComplete, setIntroComplete] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setIntroComplete(true);
    }, 2500);

    return () => window.clearTimeout(timer);
  }, []);

  if (loading || !introComplete) {
    return <FlightLoader />;
  }

  return <>{children}</>;
}
