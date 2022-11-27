import React, { useState, useRef } from 'react'
import { appRouter } from '../../../api/router.server.ts'
import { FieldTable } from '$db'
import { Context, useLoaderData } from "$lib"
import { clsx } from "clsx"
import z from "zod";
import { formDataToObject } from '../../utils/validation.ts'

// import { zodResolver } from '@hookform/resolvers/zod';

const schema = z.object({
  firstName: z
    .string()
    .min(1, { message: "First name is required" }),
  lastName: z
    .string()
    .min(1, { message: "Last name is required" }),
  email: z
    .string()
    .min(1, { message: "Email is required" })
    .email("Must be a valid email"),
});

export async function action(ctx: Context) {

  // const fieldValues = await validator.validate(await ctx.request.formData());

  // const caller = appRouter.createCaller({})
  // await caller.createFieldGroup({
  //   name: formData.get("name") as string,
  //   fields: []
  // })
}

export async function loader() {
  const caller = appRouter.createCaller({})
  const fieldTypes = await caller.getFieldTypes({});
  return {
    fieldTypes: fieldTypes
  }
}

interface Field extends Omit<FieldTable, "id" | "created_at" | "field_group_id"> {
  id?: number
}

export default function EditFieldGroups() {
  const { fieldTypes } = useLoaderData<typeof loader>();
  const [fields, setFields] = useState<Field[]>([]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    // console.log(formDataObj);

    console.log(formDataToObject(formData));
    // const fieldValues = schema.safeParse(formDataObj);


    // console.log(fieldValues);
  }

  return (
    <form onSubmit={handleSubmit} method='post' className='grid grid-cols-3 gap-x-10'>
      <div className='col-span-2 rounded-lg border bg-white p-5'>
        <h1 className='text-lg font-bold mb-4'>New Field Group</h1>

        <input type="text" name="name" className='border mb-4' />

        <table className='w-full'>
          <thead>
            <tr>
              {["Order", "Label", "Name", "Type"].map((title) => (
                <th key={title} className='text-left py-2 px-4 bg-slate-200 first:rounded-l last:rounded-r'>{title}</th>
              ))}
            </tr>
          </thead>
          <tbody className='py-5'>
            {fields?.length === 0 && (
              <tr>
                <td colSpan={4} className='text-center py-10 bg-slate-50'>No fields</td>
              </tr>
            )}

            {fields.map((field, index) => {
              return (
                <TableRow index={index} field={field} key={field.name} />
              )
            })}
          </tbody>
          <tfoot>
            <tr>
              <td className='py-2 px-2 bg-slate-200 rounded' colSpan={4}>
                <div className="flex justify-end">
                  <button onClick={() => {
                    setFields([...fields, {
                      name: "Title",
                      slug: "title",
                      type_id: fieldTypes[0].id
                    }])
                  }} className='bg-blue-500 text-white px-4 ml-auto text-sm py-1 rounded-lg' type='button'>Add Field</button>
                </div>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
      <div className="px-4 py-2 bg-white border rounded-lg">
        <button type="submit">
          Save
        </button>
      </div>
    </form>

  )
}

function TableRow({ field, index }: { field: Field, index: number }) {
  const [isOpen, setIsOpen] = useState(false)
  const classes = 'py-5 border-b border-slate-200 px-4';
  const { fieldTypes } = useLoaderData<typeof loader>();
  function getFieldType(fieldTypeId: number) {
    return fieldTypes.find((fieldType) => fieldType.id === fieldTypeId);
  }

  return (
    <>
      <tr>
        <td className={classes}>
          {index + 1}
        </td>
        <td className={classes}>

          <span>{field.name}</span>
        </td>
        <td className={classes}>{field.slug}</td>
        <td className={classes}>
          <div className='flex items-center gap-x-4'>
            <span>{getFieldType(field.type_id)?.name}</span>

            <button className={isOpen ? '' : 'transform -rotate-90'} onClick={() => setIsOpen(!isOpen)} type='button'>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="M6 9L12 15 18 9"></path>
              </svg>
            </button>

          </div>

        </td>
      </tr>
      <tr className={clsx(!isOpen && "hidden")}>
        <td colSpan={4} className='py-5 px-4'>
          Hey
          <input type="text" name={`field[${index}]label`} />
        </td>
      </tr>
    </>

  )
}