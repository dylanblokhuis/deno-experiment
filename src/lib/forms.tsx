// deno-lint-ignore-file no-explicit-any
import React, { createContext, useEffect, useRef } from "react"
import { formDataToObject, getPath, pathToString } from "../admin/utils/validation.ts"
import { z } from "zod";
import { useActionData } from "../lib.tsx";

interface FormContextValues {
  isSubmitting: boolean
  touched: Record<string, boolean>,
  setTouched: (values: Record<string, boolean>) => void,
  errors: Record<string, string> | null,
  setErrors: (values: Record<string, string> | null) => void,
  defaultValues?: Record<string, any>,
}
const FormContext = createContext<FormContextValues | null>(null)

export function ValidatedForm<T, U extends z.ZodTypeDef>(
  props: {
    defaultValues?: Partial<T>,
    className?: string,
    children: React.ReactNode,
    schema: z.Schema<T, U, unknown>,
    middleware?: (values: Partial<T>) => Partial<T>
  }
) {
  const actionData = useActionData();
  const [touched, setTouched] = React.useState<FormContextValues["touched"]>(actionData?.errors || {});
  const [errors, setErrors] = React.useState<FormContextValues["errors"]>(actionData?.errors || {});
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    if (Object.keys(touched).length === 0) return;

    const { errors } = validate(props.schema, new FormData(ref.current))
    setErrors(errors)
  }, [touched]);

  useEffect(() => {
    if (!ref.current) return;

    function handleFormChange(form: HTMLFormElement) {
      if (!props.middleware) return;
      const formData = new FormData(form);
      const obj = formDataToObject(formData) as T
      const values = props.middleware(obj)

      for (const key of formData.keys()) {
        const value = getPath(values, key)
        // @ts-ignore - elements is typed weirdly
        const htmlElement = form.elements[key];
        if (!htmlElement) continue;

        if (htmlElement instanceof HTMLInputElement) {
          htmlElement.value = value
        }
        if (htmlElement instanceof HTMLSelectElement) {
          for (const option of htmlElement.options) {
            const optionValue = option.value ? !isNaN(option.value as any) ? parseInt(option.value) : option.value : String(option.value)
            option.selected = Array.isArray(value) ? value.includes(optionValue) : value === optionValue
          }
        }
      }
    }

    ref.current.addEventListener("change", (event) => {
      const input = event.target as HTMLInputElement
      if (!input.name) return;
      if (!input.form) return;
      if (!props.middleware) return;

      handleFormChange(input.form)
    })
    handleFormChange(ref.current)
  }, [])

  return (
    <FormContext.Provider value={{
      isSubmitting: false,
      touched,
      setTouched,
      defaultValues: actionData?.values || props.defaultValues,
      errors,
      setErrors,
    }}>
      <form className={props.className} ref={ref} method="post">{props.children}</form>
    </FormContext.Provider>
  )
}

export function useField(name: string) {
  const context = React.useContext(FormContext)
  if (!context) throw new Error("useField must be used inside a FormContext")

  return {
    error: context.errors && context.errors[name],
    props: {
      name,
      defaultValue: getPath(context.defaultValues, name),
      onBlur: () => context.setTouched({ ...context.touched, [name]: true }),
    }
  }
}

export function validate<T, U extends z.ZodTypeDef>(schema: z.Schema<T, U, unknown>, formData: FormData): {
  errors: Record<string, string> | null,
  values: T,
} {
  const obj = formDataToObject(formData);

  try {
    schema.parse(obj)
    return {
      errors: null,
      values: obj as T,
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      for (const issue of error.issues) {
        const path = pathToString(issue.path);
        if (!errors[path]) errors[path] = issue.message;
      }

      return {
        errors,
        values: obj as T,
      }
    }

    throw new Error(error)
  }
}