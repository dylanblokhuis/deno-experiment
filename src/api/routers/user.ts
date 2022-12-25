import { z } from "zod";
import { procedure, router } from "../trpc.server.ts";
import db from "$db.server";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

export const userRouter = router({
  createUser: procedure.role("admin")
    .input(z.object({
      name: z.string(),
      email: z.string().email(),
      password: z.string(),
      role: z.enum(["admin", "editor", "subscriber"]),
    }))
    .mutation(async ({ input }) => {
      const exists = await db.selectFrom("user").select(["email"]).where(
        "email",
        "=",
        input.email,
      ).executeTakeFirst();
      if (exists) {
        throw new Error("User already exists with this email");
      }

      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(input.password, salt);

      const user = await db.insertInto("user")
        .values({
          name: input.name,
          email: input.email,
          password: hash,
          role: input.role,
        })
        .returning("id")
        .executeTakeFirst();

      if (!user) {
        throw new Error("Failed to create user");
      }

      return user.id;
    }),
  updateUser: procedure.role("admin")
    .input(z.object({
      id: z.number(),
      name: z.string(),
      email: z.string().email(),
      password: z.string().optional(),
      role: z.enum(["admin", "editor", "subscriber"]),
    }))
    .mutation(async ({ input }) => {
      const exists = await db.selectFrom("user")
        .select(["id", "email"])
        .where("email", "=", input.email)
        .executeTakeFirst();

      if (exists && exists.id !== input.id) {
        throw new Error(
          "A user already exists with this email, so you can't update this user with this email",
        );
      }

      const user = await db.updateTable("user")
        .set({
          name: input.name,
          email: input.email,
          password: input.password
            ? await bcrypt.hash(
              input.password,
              await bcrypt.genSalt(10),
            )
            : undefined,
          role: input.role,
        })
        .where("id", "=", input.id)
        .returning("id")
        .executeTakeFirst();

      if (!user) {
        throw new Error("Failed to update user");
      }

      return user.id;
    }),
  getUser: procedure.role("admin")
    .input(z.object({
      id: z.number(),
    }))
    .query(async ({ input }) => {
      const user = await db.selectFrom("user").select([
        "id",
        "email",
        "name",
        "role",
      ]).where("id", "=", input.id).executeTakeFirst();
      if (!user) {
        throw new Error("User not found");
      }
      return user;
    }),
  getUsers: procedure.role("admin")
    .query(async () => {
      const users = await db.selectFrom("user").select([
        "id",
        "email",
        "name",
        "role",
      ]).execute();
      return users;
    }),
  login: procedure.public
    .input(z.object({
      email: z.string().email(),
      password: z.string().min(1),
    }))
    .query(async ({ input }) => {
      const user = await db.selectFrom("user").select([
        "id",
        "email",
        "name",
        "role",
        "password",
      ]).where("email", "=", input.email).executeTakeFirst();
      if (!user) {
        throw new Error("Invalid email or password");
      }

      const validPassword = await bcrypt.compare(
        input.password,
        user.password,
      );
      if (!validPassword) {
        throw new Error("Invalid email or password");
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      };
    }),
});
