import React from 'react'
import { Context } from '../server.ts'
import { z } from "zod"
import { validate, ValidatedForm } from '../lib/forms.tsx'
import Input from "$admin/components/form/Input.tsx"
import { appRouterCaller } from '../api/router.server.ts'
import { commitSession, getSession } from '../lib/session.server.ts'
import { json, redirect } from '../lib/server.ts'
import { useLoaderData } from '../lib.tsx'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
})

export async function action(ctx: Context) {
  const result = validate(schema, await ctx.request.formData())
  if (result.errors) return result
  const { values } = result

  const session = await getSession(ctx.request.headers);

  try {
    const user = await appRouterCaller(ctx).login({
      email: values.email,
      password: values.password
    })
    session.set("userId", user.id);
    return redirect("/admin", {
      headers: {
        "Set-Cookie": await commitSession(session)
      }
    })
  } catch (error) {
    session.flash("error", error.message);
    return json({ values }, {
      headers: {
        "Set-Cookie": await commitSession(session)
      }
    })
  }
}

export async function loader(ctx: Context) {
  const session = await getSession(ctx.request.headers);
  const error = session.get("error") as string | undefined;
  return json({
    error
  }, {
    headers: {
      "Set-Cookie": await commitSession(session)
    }
  })
}

export default function Login() {
  const { error } = useLoaderData<typeof loader>();

  return (
    <div>
      <h1 className='text-2xl font-extrabold text-center mb-5'>Login</h1>
      <ValidatedForm
        schema={schema}
        className='flex flex-col gap-y-4'
      >
        <Input name="email" label="Email" type="email" />
        <Input name="password" label="Password" type="password" />

        {error && <div className='text-red-500'>{error}</div>}
        <button className='button !py-2 mt-2' type="submit">Submit</button>
      </ValidatedForm>
    </div>
  )
}
