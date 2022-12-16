import React from 'react'

export default function Error({ text }: { text: string }) {
  return (
    <span className='text-red-600 text-sm mt-1'>{text}</span>
  )
}
