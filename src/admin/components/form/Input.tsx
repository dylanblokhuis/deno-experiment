import React from "react";
import { clsx } from "clsx";
import { useField } from "$lib/forms.tsx";
import FieldError from "./internal/FieldError.tsx";
import Label from "./internal/Label.tsx";

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  name: string;
  label: string;
}
export default function Input(
  { name, label, className, type, ...rest }: Props,
) {
  const { error, props } = useField(name);
  const [hidePassword, setHidePassword] = React.useState(true);

  return (
    <label className={clsx("flex flex-col", className)}>
      <Label
        text={label}
        type={type}
        hidePassword={hidePassword}
        toggleHidePassword={() => setHidePassword(!hidePassword)}
      />
      <input
        className={clsx(error && "ha")}
        type={hidePassword ? type : "text"}
        {...rest}
        {...props}
      />
      {error && <FieldError text={error} />}
    </label>
  );
}
