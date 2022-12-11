import React from 'react'

export default function Label({ text }: { text: string }) {
  return (
    <span className='font-bold mb-1'>{text}</span>
  )
}
