import React from 'react'
import { validate, ValidatedForm } from '$lib/forms.tsx'
import { z } from 'zod'
import { Context, SerializeFrom, useActionData, useLoaderData } from '$lib';
import { appRouterCaller } from '../../../api/router.server.ts';
import { json, redirect } from '$lib/server.ts';
import Input from '../../components/form/Input.tsx'
import { commitSession, getSession } from '../../../lib/session.server.ts';

const fieldKey = (fieldId: number) => `field_${fieldId}`

const schema = (fieldGroups: FieldGroup[], fieldTypes: FieldType[]) => {
  const objectTypes: Record<string, z.ZodFirstPartySchemaTypes> = {};
  for (const group of fieldGroups) {
    for (const field of group.fields) {
      const key = fieldKey(field.id)

      let shape;
      if (field.type_id === 1) {
        shape = z.string().min(1);
      }

      if (!shape) throw new Error("Field type not found");

      objectTypes[key] = shape
    }
  }

  return z.object({
    title: z.string().min(1),
    ...objectTypes
  });
}

export async function action(ctx: Context) {
  const { fieldGroups, fieldTypes, postType } = await (await loader(ctx)).json();
  const result = validate(schema(fieldGroups, fieldTypes), await ctx.req.formData());
  if (result.errors) return result
  const { values } = result

  const fields: { id: number, value: string }[] = [];
  for (const [key, value] of Object.entries(values)) {
    if (!key.startsWith("field_")) continue;

    fields.push({
      id: parseInt(key.split("_")[1]),
      value: value
    })
  }

  const searchParams = new URL(ctx.req.url).searchParams;

  const id = await appRouterCaller.createOrUpdatePost({
    id: searchParams.has("id") ? parseInt(searchParams.get("id")!) : undefined,
    title: values.title,
    postTypeId: postType.id,
    fields: fields
  })

  const session = await getSession(ctx.req.headers);
  session.flash("message", "Post saved");

  throw redirect(`/admin/posts/edit?postType=${postType.slug}&id=${id}`, {
    headers: {
      "Set-Cookie": await commitSession(session)
    }
  })
}

export async function loader(ctx: Context) {
  const searchParams = new URL(ctx.req.url).searchParams;
  const postTypeSlug = searchParams.get("postType") || "post";
  const postType = await appRouterCaller.getPostType({ slug: postTypeSlug })
  if (!postType) throw redirect("/admin");
  const fieldGroups = await appRouterCaller.getFieldGroups({ postTypeId: postType.id })
  const fieldTypes = await appRouterCaller.getFieldTypes();

  let post;
  if (searchParams.has("id")) {
    const maybePost = await appRouterCaller.getPost({ id: parseInt(searchParams.get("id")!) });
    if (!maybePost) throw redirect("/admin/posts?postType=" + postType.slug);
    post = maybePost;
  }

  const session = await getSession(ctx.req.headers);
  const message = session.get("message");

  return json({
    fieldGroups: fieldGroups,
    fieldTypes: fieldTypes,
    postType: postType,
    post,
    message
  }, {
    headers: {
      "Set-Cookie": await commitSession(session)
    }
  })
}

type FieldGroup = NonNullable<SerializeFrom<typeof loader>["fieldGroups"]>[0];
type Field = NonNullable<SerializeFrom<typeof loader>["fieldGroups"]>[0]["fields"][0];
type FieldType = NonNullable<SerializeFrom<typeof loader>["fieldTypes"]>[0];

export default function Edit() {
  const { fieldGroups, postType, fieldTypes, post, message } = useLoaderData<typeof loader>();

  function fieldType(id: number) {
    const fieldType = fieldTypes.find((fieldType) => fieldType.id === id);
    if (!fieldType) throw new Error("Field type not found");
    return fieldType
  }

  const fieldsMapped = post?.fields.reduce((acc, field) => {
    acc[fieldKey(field.id)] = field.value;
    return acc;
  }, {} as Record<string, string>)

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

      <ValidatedForm defaultValues={{
        title: post?.title,
        ...fieldsMapped
      }} schema={schema(fieldGroups, fieldTypes)} className='grid grid-cols-3 gap-x-10 items-start'>
        <div className='col-span-2 rounded-lg border bg-white p-5'>
          {!post && <h1 className='text-lg font-bold mb-4'>
            New ${postType.name}
          </h1>}

          <Input type="text" name="title" label="Title" className='mb-4' />

          <div className='flex flex-col gap-y-4'>
            {fieldGroups?.map(fieldGroup => {
              return (
                <div key={fieldGroup.id}>
                  <h2 className='text-lg font-bold border-b pb-1 mb-4'>{fieldGroup.name}</h2>

                  <div className='flex flex-col gap-y-4'>
                    {fieldGroup.fields.map((field) => (
                      <PostField key={field.id} fieldType={fieldType(field.type_id)} field={field} />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="px-4 py-4 bg-white border rounded-lg flex flex-col items-start">

          <button className='button' type="submit">
            Save
          </button>
        </div>
      </ValidatedForm>
    </div>
  )
}

type PostFieldProps = { field: Field, fieldType: FieldType };
function PostField(props: PostFieldProps) {
  if (props.fieldType.id === 1) return <TextField {...props} />
  return <div>This field type is unsupported</div>
}

function TextField({ field, fieldType }: PostFieldProps) {
  return (
    <div data-id={`${field.name} - ${fieldType.name} - ${fieldType.id}`}>
      <Input type="text" name={fieldKey(field.id)} label={field.name} />
    </div>
  )
}
