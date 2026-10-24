import { QRCodeSVG } from "qrcode.react";

const UPI_ID = import.meta.env.VITE_UPI_ID;
const UPI_NAME = import.meta.env.VITE_UPI_NAME || "Support";
const QR_IMAGE = import.meta.env.VITE_QR_IMAGE;

// No amount in the link, so the person types whatever they want in their UPI app
const upiLink = UPI_ID
  ? `upi://pay?pa=${encodeURIComponent(UPI_ID)}&pn=${encodeURIComponent(UPI_NAME)}&cu=INR`
  : "";

export default function CoffeeModal({ onClose }) {
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" role="dialog" aria-label="Buy me a coffee" onClick={(e) => e.stopPropagation()}>
        <h2>Buy me a coffee ☕</h2>
        <p className="muted">The app is free. If you enjoy it, scan with any UPI app and pay what you like.</p>
        <div className="qr">
          {QR_IMAGE ? (
            <img src={QR_IMAGE} alt="UPI QR code" width="220" height="220" />
          ) : upiLink ? (
            <QRCodeSVG value={upiLink} size={220} />
          ) : (
            <p className="muted">Add VITE_UPI_ID (or VITE_QR_IMAGE) in client/.env to show your QR here.</p>
          )}
        </div>
        {upiLink && !QR_IMAGE && (
          <a className="btn ghost" href={upiLink}>On your phone? Open your UPI app</a>
        )}
        <p className="tiny muted">Support is voluntary and non-refundable. It doesn't unlock any features.</p>
        <button className="btn" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
