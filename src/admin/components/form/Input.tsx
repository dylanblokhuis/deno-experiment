import React from 'react'
import { clsx } from 'clsx'
import { useField } from '$lib/forms.tsx'
import Error from './internal/Error.tsx'
import Label from './internal/Label.tsx'

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  name: string
  label: string
}
export default function Input({ name, label, className, ...rest }: Props) {
  const field = useField(name)

  return (
    <label className={clsx('flex flex-col', className)}>
      <Label text={label} />
      <input {...rest} {...field} />
      {field.error && <Error text={field.error} />}
    </label>
  )
}
