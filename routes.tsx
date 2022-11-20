type Module = [string, string | string[]]

const modules: Module[] = [
  ["/", "./app/routes/home.tsx"],
  ["/admin", ["./app/layout/admin.tsx", "./app/routes/admin.tsx"]],
  ["/admin/*", "./app/routes/admin.tsx"],
]

export default modules;