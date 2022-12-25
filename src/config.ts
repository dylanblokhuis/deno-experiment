import { Config } from "./lib.tsx";

const config: Config = {
  mode: "development",
  livereloadWsPort: 8282,
  admin: {
    email: "info@example.org",
    password: "password"
  }
}

export default config