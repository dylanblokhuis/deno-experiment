import React from "react";
import { clsx } from "clsx";
import { useField } from "$lib/forms.tsx";
import FieldError from "./internal/FieldError.tsx";
import Label from "./internal/Label.tsx";

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  name: string;
  label: string;
}
export default function Checkbox(
  { name, label, className, type, ...rest }: Props,
) {
  const { error, props } = useField(name);

  return (
    <label className={clsx("flex flex-col", className)}>
      <Label
        text={label}
        type={type}
      />
      <input
        className={clsx(error && "ha", "mr-auto")}
        type="checkbox"
        name={props.name}
        onBlur={props.onBlur}
        defaultChecked={props.defaultValue &&
          (props.defaultValue === rest.value || props.defaultValue === "on")}
        {...rest}
      />
      {error && <FieldError text={error} />}
    </label>
  );
}
