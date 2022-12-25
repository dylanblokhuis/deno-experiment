FROM denoland/deno:1.29.1

EXPOSE 3000

RUN apt-get update && apt-get install -y curl sqlite3 libsqlite3-dev
RUN curl -sLO https://github.com/tailwindlabs/tailwindcss/releases/download/v3.2.4/tailwindcss-linux-arm64
RUN chmod +x tailwindcss-linux-arm64
RUN mv tailwindcss-linux-arm64 /usr/local/bin/tailwindcss

RUN curl -fsSL https://esbuild.github.io/dl/v0.16.10 | sh
RUN mv esbuild /usr/local/bin/esbuild

ENV ESBUILD_BINARY_PATH=/usr/local/bin/esbuild
ENV DENO_SQLITE_PATH=/usr/lib/x86_64-linux-gnu/libsqlite3.so.0

WORKDIR /app

# These steps will be re-run upon each file change in your working directory:
ADD . .
# Compile the main app so that it doesn't need to be compiled each startup/entry.
RUN deno cache src/main.tsx

CMD ["task", "start"]