import { initials } from "../utils/format.js";

const PALETTE = ["#1d4e6b", "#805600", "#4b2c00", "#356381", "#614000"];

function colorFor(seed = "") {
  const hash = [...seed].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return PALETTE[hash % PALETTE.length];
}

export default function Avatar({ name = "", src, size = 32 }) {
  const dimension = `${size}px`;
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className="rounded-full object-cover border border-outline-variant/40"
        style={{ width: dimension, height: dimension }}
      />
    );
  }
  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-label-caps flex-shrink-0"
      style={{ width: dimension, height: dimension, backgroundColor: colorFor(name), fontSize: size * 0.35 }}
      title={name}
    >
      {initials(name)}
    </div>
  );
}
