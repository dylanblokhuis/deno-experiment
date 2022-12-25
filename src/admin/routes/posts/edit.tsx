import React, { useRef, useState } from "react";
import { useField, validate, ValidatedForm } from "$lib/forms.tsx";
import { z } from "zod";
import { Context, SerializeFrom, useLoaderData } from "$lib";
import { appRouterCaller } from "../../../api/router.server.ts";
import { json, redirect } from "$lib/server.ts";
import Input from "../../components/form/Input.tsx";
import { commitSession, getSession } from "$lib/session.server.ts";
import Select from "../../components/form/Select.tsx";
import { titleToSlug } from "$lib/utils/slugify.ts";
import FieldError from "../../components/form/internal/FieldError.tsx";
import { clsx } from "clsx";
import Alert from "../../components/Alert.tsx";
import { zfd } from "$lib/forms.tsx";

const fieldKey = (fieldId: number) => `field_${fieldId}`;

const schema = (fieldGroups: FieldGroup[], fieldTypes: FieldType[]) => {
  const objectTypes: Record<string, z.ZodFirstPartySchemaTypes> = {};
  for (const group of fieldGroups) {
    for (const field of group.fields) {
      const key = fieldKey(field.id);

      let shape;
      if (field.type_id === 1) {
        shape = zfd.text();
      } else if (field.type_id === 2) {
        shape = zfd.numeric();
      } else if (field.type_id === 3) {
        shape = zfd.text(z.preprocess((arg) => {
          if (typeof arg == "string" || arg instanceof Date) {
            return new Date(arg);
          }
        }, z.date()));
      } else if (field.type_id === 4) {
        shape = zfd.checkbox();
      }

      if (!shape) throw new Error("Field type not found");

      objectTypes[key] = shape;
    }
  }

  return zfd.formData({
    title: zfd.text(),
    status: zfd.text(z.enum(["draft", "trash", "published"])),
    slug: zfd.text(),
    ...objectTypes,
  });
};

export async function action(ctx: Context) {
  const { fieldGroups, fieldTypes, postType, post } = await (await loader(ctx))
    .json();
  const result = validate(
    schema(fieldGroups, fieldTypes),
    await ctx.request.formData(),
  );
  if (result.errors) return result;
  const { values } = result;

  const fields: { id: number; value: string }[] = [];
  for (const [key, value] of Object.entries(values)) {
    if (!key.startsWith("field_")) continue;

    fields.push({
      id: parseInt(key.split("_")[1]),
      value: JSON.stringify(value),
    });
  }

  const searchParams = new URL(ctx.request.url).searchParams;

  if (values.status === "trash") {
    throw new Error("You can't make a post that has trash as a status");
  }
  const session = await getSession(ctx.request.headers);

  let id = searchParams.has("id")
    ? parseInt(searchParams.get("id")!)
    : undefined;
  try {
    id = await appRouterCaller(ctx).createOrUpdatePost({
      id: id,
      status: values.status,
      title: values.title,
      slug: post?.slug !== values.slug ? values.slug : undefined,
      postTypeId: postType.id,
      fields: fields,
    });
    session.flash("message", "Post saved");
    return redirect(
      `/admin/posts/edit?postType=${postType.slug}&id=${id}`,
      {
        headers: {
          "Set-Cookie": await commitSession(session),
        },
      },
    );
  } catch (error) {
    session.flash("error", error.message);

    return json({
      values,
    }, {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    });
  }
}

export async function loader(ctx: Context) {
  const searchParams = new URL(ctx.request.url).searchParams;
  const postTypeSlug = searchParams.get("postType") || "post";
  const caller = appRouterCaller(ctx);
  const postType = await caller.getPostType({ slug: postTypeSlug });
  if (!postType) throw redirect("/admin");
  const fieldGroups = await caller.getFieldGroups({
    postTypeId: postType.id,
  });
  const fieldTypes = await caller.getFieldTypes();

  let post;
  if (searchParams.has("id")) {
    const maybePost = await caller.getPost({
      id: parseInt(searchParams.get("id")!),
    });
    if (!maybePost) {
      throw redirect("/admin/posts?postType=" + postType.slug);
    }
    post = maybePost;
  }

  const session = await getSession(ctx.request.headers);
  const message = session.get("message") as string | undefined;
  const error = session.get("error") as string | undefined;

  return json({
    fieldGroups: fieldGroups,
    fieldTypes: fieldTypes,
    postType: postType,
    post,
    message,
    error,
  }, {
    headers: {
      "Set-Cookie": await commitSession(session),
    },
  });
}

type FieldGroup = NonNullable<SerializeFrom<typeof loader>["fieldGroups"]>[0];
type Field = NonNullable<
  SerializeFrom<typeof loader>["fieldGroups"]
>[0]["fields"][0];
type FieldType = NonNullable<SerializeFrom<typeof loader>["fieldTypes"]>[0];

export default function Edit() {
  const { fieldGroups, postType, fieldTypes, post, message, error } =
    useLoaderData<typeof loader>();

  function fieldType(id: number) {
    const fieldType = fieldTypes.find((fieldType) => fieldType.id === id);
    if (!fieldType) throw new Error("Field type not found");
    return fieldType;
  }

  const fieldsMapped = post?.fields.reduce((acc, field) => {
    acc[fieldKey(field.id)] = JSON.parse(field.value);
    return acc;
  }, {} as Record<string, string>);

  return (
    <div>
      {message && <Alert type="success" message={message} className="mb-4" />}

      {error && <Alert type="error" message={error} className="mb-4" />}

      <ValidatedForm
        defaultValues={{
          title: post?.title,
          slug: post?.slug,
          status: post?.status || "draft",
          ...fieldsMapped,
        }}
        middleware={(values, touched) => {
          if (
            values.title && !post?.slug &&
            touched?.slug === undefined
          ) {
            values.slug = titleToSlug(values.title);
          }
          return values;
        }}
        schema={schema(fieldGroups, fieldTypes)}
        className="grid grid-cols-3 gap-x-10 items-start"
      >
        <div className="col-span-2 rounded-lg border bg-white p-5">
          {!post && (
            <h1 className="text-lg font-bold mb-4">
              New {postType.name}
            </h1>
          )}

          <SlugEditor postType={postType} />
          <Input
            type="text"
            name="title"
            label="Title"
            className="mb-4"
          />

          <div className="flex flex-col gap-y-4">
            {fieldGroups?.map((fieldGroup) => {
              return (
                <div key={fieldGroup.id}>
                  <h2 className="text-lg font-bold border-b pb-1 mb-4">
                    {fieldGroup.name}
                  </h2>

                  <div className="flex flex-col gap-y-4">
                    {fieldGroup.fields.map((field) => (
                      <PostField
                        key={field.id}
                        fieldType={fieldType(
                          field.type_id,
                        )}
                        field={field}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="px-4 py-4 bg-white border rounded-lg flex flex-col items-start gap-y-4">
          <Select name="status" label="Status">
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </Select>

          <button className="button" type="submit">
            Save
          </button>
        </div>
      </ValidatedForm>
    </div>
  );
}

function SlugEditor(
  { postType }: { postType: SerializeFrom<typeof loader>["postType"] },
) {
  const { props, error } = useField("slug");
  const [editing, setEditing] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  const value = ref.current?.value || props.defaultValue;
  const userShownPath = postType.path_prefix
    ? `${postType.path_prefix}/${value}/`
    : `/${value}/`;

  return (
    <div className="mb-4 flex items-center gap-x-3">
      {(value && !editing) && (
        <a
          href={userShownPath}
          target="_blank"
          className="underline text-blue-500"
        >
          {userShownPath}
        </a>
      )}
      {(value && editing && postType.path_prefix) && (
        <span className="text-gray-500">{postType.path_prefix}/</span>
      )}

      <input
        className={clsx("w-full", !editing && "hidden")}
        type="text"
        name="slug"
        onBlur={props.onBlur}
        defaultValue={value}
        ref={ref}
      />

      {value && (
        <button
          title={editing ? "Save" : "Edit"}
          onClick={() => {
            setEditing(!editing);
          }}
          type="button"
        >
          {editing
            ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="text-blue-500"
                viewBox="0 0 24 24"
              >
                <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z">
                </path>
                <path d="M17 21L17 13 7 13 7 21"></path>
                <path d="M7 3L7 8 15 8"></path>
              </svg>
            )
            : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="feather feather-edit-2"
                viewBox="0 0 24 24"
              >
                <path d="M17 3a2.828 2.828 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z">
                </path>
              </svg>
            )}
        </button>
      )}

      {error && <FieldError text={error} />}
    </div>
  );
}

type PostFieldProps = { field: Field; fieldType: FieldType };
function PostField(props: PostFieldProps) {
  if (props.fieldType.id === 1) return <TextField {...props} />;
  if (props.fieldType.id === 2) return <NumberField {...props} />;
  if (props.fieldType.id === 3) return <DateField {...props} />;
  return <div>This field type is unsupported</div>;
}

function TextField({ field, fieldType }: PostFieldProps) {
  return (
    <div data-id={`${field.name} - ${fieldType.name} - ${fieldType.id}`}>
      <Input type="text" name={fieldKey(field.id)} label={field.name} />
    </div>
  );
}

function NumberField({ field, fieldType }: PostFieldProps) {
  return (
    <div data-id={`${field.name} - ${fieldType.name} - ${fieldType.id}`}>
      <Input type="number" name={fieldKey(field.id)} label={field.name} />
    </div>
  );
}

function DateField({ field, fieldType }: PostFieldProps) {
  return (
    <div data-id={`${field.name} - ${fieldType.name} - ${fieldType.id}`}>
      <Input type="date" name={fieldKey(field.id)} label={field.name} />
    </div>
  );
}
