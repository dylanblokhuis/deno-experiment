import React from 'react'
import { z } from "zod"
import { appRouterCaller } from '../../../api/router.server.ts';
import { useLoaderData } from '../../../lib.tsx';
import { validate, ValidatedForm } from '../../../lib/forms.tsx';
import { json, redirect } from '../../../lib/server.ts';
import { commitSession, getSession } from '../../../lib/session.server.ts';
import { Context } from '../../../server.ts';
import Input from '../../components/form/Input.tsx';
import Select from '../../components/form/Select.tsx';
import Alert from '../../components/Alert.tsx'

const schema = (update: boolean) => z.object({
  id: z.number().optional(),
  name: z.string().min(1),
  email: z.string().email(),
  password: update ? z.string().optional() : z.string().min(1),
  role: z.enum(["admin", "editor", "subscriber"])
});


export async function loader(context: Context) {
  const roles = [
    {
      value: "admin",
      label: "Admin"
    },
    {
      value: "editor",
      label: "Editor"
    },
    {
      value: "subscriber",
      label: "Subscriber"
    }
  ]

  const id = new URL(context.request.url).searchParams.get("id") as string | undefined
  let user;
  if (id) {
    user = await appRouterCaller(context).getUser({ id: parseInt(id) })
  }

  const session = await getSession(context.request.headers)
  const message = session.get("message") as string | undefined;
  const error = session.get("error") as string | undefined;

  return json({
    roles: roles,
    message,
    error,
    user
  }, {
    headers: {
      "Set-Cookie": await commitSession(session)
    }
  })
}

export async function action(ctx: Context) {
  let id: string | undefined | number = new URL(ctx.request.url).searchParams.get("id") as string | undefined
  id = id ? parseInt(id) : undefined

  const result = validate(schema(!!id), await ctx.request.formData());
  if (result.errors) return result;
  const { values } = result;

  const session = await getSession(ctx.request.headers);

  try {
    if (!id) {
      id = await appRouterCaller(ctx).createUser({
        name: values.name,
        email: values.email,
        password: values.password as string,
        role: values.role
      })
      session.flash("message", "User created successfully");

    } else {
      await appRouterCaller(ctx).updateUser({
        id: id as number,
        name: values.name,
        email: values.email,
        password: values.password,
        role: values.role,
      })
      session.flash("message", "User updated successfully");
    }

    return redirect(`/admin/users/edit?id=${id}`, {
      headers: {
        "Set-Cookie": await commitSession(session)
      }
    })
  } catch (error) {
    session.flash("error", error.message);

    return json({
      values
    }, {
      headers: {
        "Set-Cookie": await commitSession(session)
      }
    })
  }
}

export default function EditUser() {
  const { roles, message, error, user } = useLoaderData<typeof loader>();

  return (
    <div>
      {message && (
        <Alert type="success" message={message} />
      )}
      {error && (
        <Alert type="error" message={error} />
      )}
      <h1 className='text-xl font-bold mb-2'>Create user</h1>

      <ValidatedForm
        defaultValues={{
          name: user?.name,
          email: user?.email,
          role: user?.role,
        }}
        // defaultValues={{
        //   title: post?.title,
        //   slug: post?.slug,
        //   status: post?.status || "draft",
        //   ...fieldsMapped
        // }}
        schema={schema(!!user)}
        className='grid grid-cols-3 gap-x-10 items-start'
      >
        <div className='col-span-2 rounded-lg border bg-white p-5 gap-y-4 flex flex-col'>
          <Input type="text" name="name" label="Name" />
          <Input type="email" name="email" label="E-mail" />
          <Input type="password" name="password" label="Password" placeholder={user && "Fill to change password"} />
          <Select label='Role' name='role' className='mb-1'>
            {roles.map(({ label, value }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </Select>

          <button className='button mr-auto' type='submit'>
            Create
          </button>
        </div>
      </ValidatedForm>
    </div>
  )
}
