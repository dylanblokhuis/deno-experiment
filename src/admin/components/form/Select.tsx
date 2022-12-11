import React from 'react'
import { clsx } from 'clsx'
import { useField } from '$lib/forms.tsx'
import Label from './internal/Label.tsx'
import Error from './internal/Error.tsx'

interface Props extends React.InputHTMLAttributes<HTMLSelectElement> {
  name: string
  label: string
  children: React.ReactNode
}
export default function Select({ name, label, className, children, ...rest }: Props) {
  const field = useField(name)

  return (
    <label className={clsx('flex flex-col', className)}>
      <Label text={label} />
      <select {...rest} {...field}>
        {children}
      </select>
      {field.error && <Error text={field.error} />}
    </label>
  )
}
