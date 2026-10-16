// The demo card machine. Open this on a phone or tablet next to the till and
// enter the terminal's code (Settings > POS terminals). When the cashier sends
// a card payment, the amount appears here; the "customer" enters any 4-digit
// PIN to pay (0000 is declined as a wrong PIN) or declines. No login needed:
// the terminal code is the key.
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import http from "../../services/http";

const naira = (value) => `₦${Number(value || 0).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const errorText = (err, fallback) => {
  const errors = err.response?.data?.errors;
  return (errors && Object.values(errors)[0]?.[0]) || err.response?.data?.message || fallback;
};

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "clear", "0", "back"];

export default function PosDevice() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [typedCode, setTypedCode] = useState("");
  const [screen, setScreen] = useState(null); // { terminal, payment }
  const [pin, setPin] = useState("");
  const [result, setResult] = useState(null); // { status, message }
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // ?code=... opens straight on the terminal
  useEffect(() => {
    if (router.isReady && typeof router.query.code === "string") setCode(router.query.code.toUpperCase());
  }, [router.isReady, router.query.code]);

  const poll = useCallback(async () => {
    if (!code) return;
    try {
      const { data } = await http.get(`/pos-device/${code}`);
      setScreen(data);
      setError("");
    } catch (err) {
      setError(errorText(err, "Can't reach SellaPad."));
      if (err.response?.status === 404) setScreen(null);
    }
  }, [code]);

  useEffect(() => {
    if (!code) return undefined;
    poll();
    const timer = window.setInterval(poll, 2000);
    return () => window.clearInterval(timer);
  }, [code, poll]);

  // A new payment clears the last result and PIN
  const paymentId = screen?.payment?.id;
  useEffect(() => {
    if (paymentId) {
      setPin("");
      setResult(null);
    }
  }, [paymentId]);

  const press = (key) => {
    if (busy) return;
    if (key === "clear") setPin("");
    else if (key === "back") setPin((p) => p.slice(0, -1));
    else setPin((p) => (p.length < 4 ? p + key : p));
  };

  const answer = async (approve) => {
    setBusy(true);
    try {
      const { data } = approve
        ? await http.post(`/pos-device/${code}/payments/${paymentId}/approve`, { pin })
        : await http.post(`/pos-device/${code}/payments/${paymentId}/decline`);
      setResult(data);
      await poll();
    } catch (err) {
      setResult({ status: "declined", message: errorText(err, "Something went wrong.") });
    } finally {
      setBusy(false);
      setPin("");
    }
  };

  const shell = (children) => (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gray-900 font-raleway">
      <Head>
        <title>Card machine · SellaPad</title>
      </Head>
      <div className="w-full max-w-sm overflow-hidden text-white bg-gray-800 border-4 border-gray-700 shadow-2xl rounded-3xl">{children}</div>
    </div>
  );

  if (!code) {
    return shell(
      <form
        className="p-6 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (typedCode.trim()) setCode(typedCode.trim().toUpperCase());
        }}
      >
        <p className="text-lg font-semibold">SellaPad card machine</p>
        <p className="text-sm text-gray-300">Enter this terminal&apos;s code from Settings → POS terminals.</p>
        <input
          value={typedCode}
          onChange={(e) => setTypedCode(e.target.value)}
          autoFocus
          aria-label="Terminal code"
          placeholder="e.g. Q7KX2M9PLA"
          className="w-full px-4 py-3 font-mono text-lg tracking-widest text-center text-gray-900 uppercase bg-white rounded-lg"
        />
        <button type="submit" className="w-full py-3 font-semibold bg-green-600 rounded-lg hover:bg-green-700">Connect</button>
      </form>
    );
  }

  const payment = screen?.payment;

  return shell(
    <>
      <div className="flex items-center justify-between px-5 py-3 text-xs bg-gray-900">
        <span>{screen?.terminal ? `${screen.terminal.name} · ${screen.terminal.store}` : "Connecting…"}</span>
        <span className={`flex items-center gap-1 ${error ? "text-red-400" : "text-green-400"}`}>
          <span className={`w-2 h-2 rounded-full ${error ? "bg-red-400" : "bg-green-400"}`} /> {error ? "Offline" : "Online"}
        </span>
      </div>

      <div className="px-6 py-6 text-center min-h-[11rem] flex flex-col items-center justify-center">
        {error && !screen ? (
          <>
            <p className="font-semibold text-red-300">{error}</p>
            <button type="button" onClick={() => setCode("")} className="mt-3 text-sm underline">Use another code</button>
          </>
        ) : result && !payment ? (
          <>
            <p className={`text-3xl font-bold ${result.status === "approved" ? "text-green-400" : "text-red-400"}`}>{result.status === "approved" ? "APPROVED" : "DECLINED"}</p>
            <p className="mt-2 text-sm text-gray-300">{result.message}</p>
            <p className="mt-4 text-xs text-gray-400">Waiting for the next payment…</p>
          </>
        ) : payment ? (
          <>
            <p className="text-sm text-gray-300">Amount to pay</p>
            <p className="mt-1 text-4xl font-bold tabular-nums">{naira(payment.amount)}</p>
            <p className="mt-2 text-xs text-gray-400">{payment.reference} · Insert or tap card, then enter PIN</p>
            <div className="flex justify-center gap-3 mt-4" aria-label={`${pin.length} of 4 PIN digits entered`}>
              {[0, 1, 2, 3].map((i) => (
                <span key={i} className={`w-4 h-4 rounded-full border-2 border-white ${i < pin.length ? "bg-white" : ""}`} />
              ))}
            </div>
          </>
        ) : (
          <>
            <p className="text-2xl font-semibold">Ready</p>
            <p className="mt-2 text-sm text-gray-300">Waiting for the cashier to send an amount…</p>
          </>
        )}
      </div>

      {payment && (
        <div className="px-6 pb-6 space-y-3">
          <div className="grid grid-cols-3 gap-2">
            {KEYS.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => press(key)}
                disabled={busy}
                className="py-3 text-lg font-semibold bg-gray-700 rounded-lg hover:bg-gray-600 disabled:opacity-50"
                aria-label={key === "clear" ? "Clear" : key === "back" ? "Delete" : key}
              >
                {key === "clear" ? "C" : key === "back" ? "⌫" : key}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => answer(false)} disabled={busy} className="py-3 font-semibold bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50">Decline</button>
            <button type="button" onClick={() => answer(true)} disabled={busy || pin.length !== 4} className="py-3 font-semibold bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50">Pay</button>
          </div>
          <p className="text-[11px] text-center text-gray-400">Demo card machine: any 4-digit PIN pays; 0000 is declined as a wrong PIN.</p>
        </div>
      )}
    </>
  );
}
