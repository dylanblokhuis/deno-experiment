import React from 'react'
import { clsx } from 'clsx'
import { useField } from '$lib/forms.tsx'

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  name: string
  label: string
}
export default function Input({ name, label, className, ...rest }: Props) {
  const field = useField(name)

  return (
    <label className={clsx('flex flex-col', className)}>
      <span className='uppercase font-bold'>{label}</span>
      <input {...rest} {...field} />
      {field.error && <span className='text-red-600'>{field.error}</span>}
    </label>
  )
}
