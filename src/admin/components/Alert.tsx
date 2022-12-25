import React from "react";
import { clsx } from "clsx";

interface Props {
  type: "success" | "error";
  message: string;
  className?: string;
}

export default function Alert({ message, type, className }: Props) {
  return (
    <div
      className={clsx(
        "flex rounded-lg p-4 mb-4 text-sm",
        type === "error" && "bg-red-100 text-red-700",
        type === "success" && "bg-green-100 text-green-700",
        className,
      )}
      role="alert"
    >
      <svg
        className="inline mr-3"
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <circle cx="12" cy="12" r="10"></circle>
        <path d="M12 16L12 12"></path>
        <path d="M12 8L12.01 8"></path>
      </svg>
      <div>
        {message}
      </div>
    </div>
  );
}
