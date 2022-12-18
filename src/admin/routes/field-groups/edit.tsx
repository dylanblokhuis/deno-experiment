import React, { useState } from 'react'
import { appRouterCaller } from '../../../api/router.server.ts'
import { Context, useActionData, useLoaderData } from "$lib"
import { clsx } from "clsx"
import z from "zod";
import { validate, ValidatedForm } from '$lib/forms.tsx'
import { commitSession, getSession } from '$lib/server.ts';
import Input from '../../components/form/Input.tsx'
import Select from '../../components/form/Select.tsx'
import { json, redirect } from '$lib/server.ts';

const schema = z.object({
  id: z.number().optional(),
  name: z
    .string()
    .min(1),
  postTypes: z.array(z.number()).or(z.number()),
  fields: z.array(
    z.object({
      id: z.number().optional(),
      name: z.string().min(1),
      slug: z.string().min(1),
      type_id: z.number()
    })
  ),
});

export async function action(ctx: Context) {
  const result = validate(schema, await ctx.req.formData());

  console.log(result.errors);

  if (result.errors) return result
  const { values } = result

  const { id } = await appRouterCaller.createOrUpdateFieldGroup({
    id: values.id,
    name: values.name,
    postTypes: Array.isArray(values.postTypes) ? values.postTypes : [values.postTypes],
    fields: values.fields.map(fields => ({
      ...fields,
      type_id: fields.type_id
    }))
  })

  console.log("sdsd", id);


  const session = await getSession(ctx.req.headers);
  session.flash("message", "Field group saved");

  throw redirect(`/admin/field-groups/edit?id=${id}`, {
    headers: {
      "Set-Cookie": await commitSession(session)
    }
  })
}

export async function loader(ctx: Context) {
  const fieldTypes = await appRouterCaller.getFieldTypes();
  const id = new URL(ctx.req.url).searchParams.get("id");
  const postTypes = await appRouterCaller.getPostTypes();

  if (!id) return json({
    fieldTypes: fieldTypes,
    fieldGroup: null,
    postTypes,
    message: null
  })

  const fieldGroup = await appRouterCaller.getFieldGroup({ id: parseInt(id) });

  const session = await getSession(ctx.req.headers);
  const message = session.get("message") as string | null;

  return json({
    fieldTypes: fieldTypes,
    fieldGroup: fieldGroup,
    postTypes,
    message: message
  }, {
    headers: {
      "Set-Cookie": await commitSession(session)
    }
  })
}

type Fields = z.infer<typeof schema>["fields"];
type Field = z.infer<typeof schema>["fields"][0];

export default function EditFieldGroups() {
  const { fieldTypes, fieldGroup, message, postTypes } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [fields, setFields] = useState<Fields>(actionData?.values.fields || fieldGroup?.fields || []);

  return (
    <div>
      {message && (
        <div className="flex bg-green-100 rounded-lg p-4 mb-4 text-sm text-green-700" role="alert">
          <svg className="inline mr-3" xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M12 16L12 12"></path>
            <path d="M12 8L12.01 8"></path>
          </svg>
          <div>
            {message}
          </div>
        </div>
      )}

      <ValidatedForm
        defaultValues={{
          name: fieldGroup?.name,
          postTypes: fieldGroup?.connectedPostTypes,
          fields: fieldGroup?.fields || []
        }}
        middleware={(values) => {
          values.fields?.forEach((field, index) => {
            field.slug = field.slug || field.name.toLowerCase().replace(/ /g, "_")

            if (values.fields) {
              values.fields[index] = field
            }
          });

          if (values.fields) {
            setFields(values.fields)
          }

          return values
        }} schema={schema} className='grid grid-cols-3 gap-x-10 items-start'>
        <div className='col-span-2 rounded-lg border bg-white p-5'>
          <h1 className='text-lg font-bold mb-4'>
            {fieldGroup ? (
              `Edit Field Group: ${fieldGroup.name}`
            ) : "New Field Group"}
          </h1>

          {fieldGroup?.id && <input type="hidden" name='id' value={fieldGroup?.id} />}
          <Input label='Name' type="text" name='name' className='mb-4' />

          {actionData?.errors?.fields && (
            <span className='block'>Required</span>
          )}
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
                  <TableRow index={index} field={field} key={index} />
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
                    }} className='button' type='button'>Add Field</button>
                  </div>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
        <div className="px-4 py-4 bg-white border rounded-lg flex flex-col items-start">
          <Select label='Connect to post types' name='postTypes' multiple className='mb-4'>
            {postTypes.map((postType) => (
              <option key={postType.id} value={postType.id}>{postType.name}</option>
            ))}
          </Select>

          <button className='button' type="submit">
            Save
          </button>
        </div>
      </ValidatedForm>
    </div>

  )
}

function TableRow({ field, index }: { field: Field, index: number }) {
  const [isOpen, setIsOpen] = useState(true)
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
          <div className='flex items-center justify-between gap-x-4'>
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
          <div className='flex flex-col gap-y-4'>
            <Select label='Field type' name={`fields[${index}].type_id`}>
              {fieldTypes.map((fieldType) => (
                <option key={fieldType.id} value={fieldType.id}>{fieldType.name}</option>
              ))}
            </Select>

            <Input type="text" name={`fields[${index}].name`} label='Name' />
            <Input type="text" name={`fields[${index}].slug`} label='Slug' />
            {field.id && <input type="hidden" name={`fields[${index}].id`} value={field.id} />}
          </div>
        </td>
      </tr>
    </>

  )
}