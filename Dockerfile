FROM denoland/deno:1.29.0

EXPOSE 3000

WORKDIR /app

# These steps will be re-run upon each file change in your working directory:
ADD . .
# Compile the main app so that it doesn't need to be compiled each startup/entry.
RUN deno cache main.tsx

CMD ["task", "start"]