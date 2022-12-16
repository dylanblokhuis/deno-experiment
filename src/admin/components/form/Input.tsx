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
  const { error, props } = useField(name)

  return (
    <label className={clsx('flex flex-col', className)}>
      <Label text={label} />
      <input className={clsx(error && "ha")} {...rest} {...props} />
      {error && <Error text={error} />}
    </label>
  )
}
