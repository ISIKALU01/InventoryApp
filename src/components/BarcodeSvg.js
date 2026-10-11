// Draws a scannable barcode as SVG (EAN-13 for retail codes, Code 128 otherwise).
import { useEffect, useRef, useState } from "react";
import { barcodeFormat } from "../../utils/barcode";

export default function BarcodeSvg({ value, height = 40, width = 1.6, fontSize = 12, className = "" }) {
  const ref = useRef(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setFailed(false);

    // Loaded in the browser only; the library draws into the <svg>
    import("jsbarcode")
      .then(({ default: JsBarcode }) => {
        if (cancelled || !ref.current) return;
        JsBarcode(ref.current, String(value), {
          format: barcodeFormat(value),
          height,
          width,
          fontSize,
          margin: 0,
          background: "transparent",
        });
      })
      .catch(() => !cancelled && setFailed(true));

    return () => {
      cancelled = true;
    };
  }, [value, height, width, fontSize]);

  if (failed) {
    return <span className={`font-mono text-xs ${className}`}>{value}</span>;
  }

  return <svg ref={ref} role="img" aria-label={`Barcode ${value}`} className={className} />;
}
