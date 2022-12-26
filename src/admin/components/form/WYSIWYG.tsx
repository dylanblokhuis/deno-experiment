import React, { useEffect } from "react";
import { clsx } from "clsx";
import { useField } from "$lib/forms.tsx";
import FieldError from "./internal/FieldError.tsx";
import Label from "./internal/Label.tsx";

import type { } from "npm:@lexical/react";
import { $getRoot, $getSelection } from 'lexical';

import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary';

interface Props {
  name: string;
  label: string;
  className?: string
}
export default function WYSIWYG(
  { name, label, className, ...rest }: Props,
) {
  const { error, props } = useField(name);
  const initialConfig = {
    namespace: 'MyEditor',
    theme,
    onError,
  };


  return (
    <label className={clsx("flex flex-col", className)}>
      <Label
        text={label}
      />

      <LexicalComposer initialConfig={initialConfig}>
        {/* <PlainTextPlugin
          ErrorBoundary={LexicalErrorBoundary}
          contentEditable={<ContentEditable />}
          placeholder={<div>Enter some text...</div>}
        /> */}
        <RichTextPlugin
          contentEditable={<ContentEditable />}
          placeholder={<div>Enter some text...</div>}
          ErrorBoundary={LexicalErrorBoundary}
        />
        <OnChangePlugin onChange={onChange} />
        <HistoryPlugin />
        <MyCustomAutoFocusPlugin />
      </LexicalComposer>

      {error && <FieldError text={error} />}
    </label>
  );
}

const theme = {
  // Theme styling goes here
  // ...
}

// When the editor changes, you can get notified via the
// LexicalOnChangePlugin!
function onChange(editorState: any) {
  editorState.read(() => {
    // Read the contents of the EditorState here.
    const root = $getRoot();
    const selection = $getSelection();

    console.log(root, selection);
  });
}

// Lexical React plugins are React components, which makes them
// highly composable. Furthermore, you can lazy load plugins if
// desired, so you don't pay the cost for plugins until you
// actually use them.
function MyCustomAutoFocusPlugin() {
  const [editor] = useLexicalComposerContext();



  useEffect(() => {
    // Focus the editor when the effect fires!
    editor.focus();
  }, [editor]);

  return null;
}


// Catch any errors that occur during Lexical updates and log them
// or throw them as needed. If you don't throw them, Lexical will
// try to recover gracefully without losing user data.
function onError(error: any) {
  throw error;
}