import React from 'react'
import { clsx } from 'clsx'
import { useField } from '$lib/forms.tsx'
import Label from './internal/Label.tsx'
import FieldError from './internal/FieldError.tsx'

interface Props extends React.InputHTMLAttributes<HTMLSelectElement> {
  name: string
  label: string
  children: React.ReactNode
}
export default function Select({ name, label, className, children, ...rest }: Props) {
  const { error, props } = useField(name)

  return (
    <label className={clsx('flex flex-col', className)}>
      <Label text={label} />
      <select {...rest} {...props}>
        {children}
      </select>
      {error && <FieldError text={error} />}
    </label>
  )
}
