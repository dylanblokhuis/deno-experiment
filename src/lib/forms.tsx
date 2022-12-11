// deno-lint-ignore-file no-explicit-any
import React, { createContext, useEffect, useRef } from "react"
import { formDataToObject, pathToString } from "../admin/utils/validation.ts"
import { z } from "zod";

interface FormContextValues {
  isSubmitting: boolean
  touched: Record<string, boolean>,
  setTouched: (values: Record<string, boolean>) => void,
  errors: Record<string, string>,
  setErrors: (values: Record<string, string>) => void,
  defaultValues?: Record<string, any>,
}
const FormContext = createContext<FormContextValues | null>(null)

export function ValidatedForm(
  props: {
    defaultValues?: Record<string, any>,
    className?: string,
    children: React.ReactNode,
    schema: z.ZodObject<any>,
  }
) {
  const [touched, setTouched] = React.useState<FormContextValues["touched"]>({});
  const [errors, setErrors] = React.useState<FormContextValues["errors"]>({});
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    if (Object.keys(touched).length === 0) return;

    const obj = formDataToObject(new FormData(ref.current));
    console.log("Form Data obj", obj);

    try {
      props.schema.parse(obj)
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        for (const issue of error.issues) {
          const path = pathToString(issue.path);
          console.log(path);

          if (!errors[path]) errors[path] = issue.message;
        }

        console.log(errors);

        setErrors(errors)
      }
    }
  }, [touched]);

  return (
    <FormContext.Provider value={{
      isSubmitting: false,
      touched,
      setTouched,
      defaultValues: props.defaultValues,
      errors,
      setErrors,
    }}>
      <form ref={ref} method="post">{props.children}</form>
    </FormContext.Provider>
  )
}

export function useField(name: string) {
  const context = React.useContext(FormContext)
  if (!context) throw new Error("useField must be used inside a FormContext")

  return {
    name,
    defaultValue: context.defaultValues?.[name],
    error: context.touched[name] && context.errors[name],
    onBlur: () => context.setTouched({ ...context.touched, [name]: true }),
  }
}