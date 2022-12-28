import React, { useCallback, useEffect, useState } from "react";
import { clsx } from "clsx";
import { useField } from "$lib/forms.tsx";
import FieldError from "./internal/FieldError.tsx";
import Label from "./internal/Label.tsx";

import type { } from "npm:@lexical/react";

import {
  $getRoot,
  $getSelection,
  $insertNodes,
  $isRangeSelection,
  $isRootOrShadowRoot,
  $isTextNode,
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
  DEPRECATED_$isGridSelection,
  ElementNode,
  FORMAT_ELEMENT_COMMAND,
  FORMAT_TEXT_COMMAND,
  INDENT_CONTENT_COMMAND,
  NodeKey,
  OUTDENT_CONTENT_COMMAND,
  RangeSelection,
  REDO_COMMAND,
  SELECTION_CHANGE_COMMAND,
  TextNode,
  UNDO_COMMAND,
  type LexicalEditor,
  $createParagraphNode
} from "lexical";

// @deno-types="https://esm.sh/@lexical/react@0.7.5/LexicalComposer"
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";

// @deno-types="https://esm.sh/@lexical/react@0.7.5/LexicalComposerContext"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import LexicalErrorBoundary from "@lexical/react/LexicalErrorBoundary";
// @deno-types="https://esm.sh/@lexical/html@0.7.5"
import { $generateHtmlFromNodes, $generateNodesFromDOM } from "@lexical/html";
import {
  $isListNode,
  INSERT_CHECK_LIST_COMMAND,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  ListItemNode,
  ListNode,
  REMOVE_LIST_COMMAND,
} from "@lexical/list";
import { $isLinkNode, LinkNode } from "@lexical/link";
import { ClientOnly } from "$lib";
import { Menu, Transition } from "@headlessui/react";
import {
  $createHeadingNode,
  $createQuoteNode,
  $isHeadingNode,
  HeadingNode,
  QuoteNode,
  HeadingTagType,
} from "@lexical/rich-text";
import {
  $getSelectionStyleValueForProperty,
  $isAtNodeEnd,
  $isParentElementRTL,
  $patchStyleText,
  $selectAll,
  $setBlocksType_experimental,
} from "@lexical/selection";
import {
  $findMatchingParent,
  $getNearestBlockElementAncestorOrThrow,
  $getNearestNodeOfType,
  mergeRegister,
} from "@lexical/utils";
import {
  $createCodeNode,
  $isCodeNode,
  CodeHighlightNode,
  CodeNode,
  CODE_LANGUAGE_FRIENDLY_NAME_MAP,
  CODE_LANGUAGE_MAP,
  getLanguageFriendlyName,
} from "@lexical/code";

function getSelectedNode(
  selection: RangeSelection,
): TextNode | ElementNode {
  const anchor = selection.anchor;
  const focus = selection.focus;
  const anchorNode = selection.anchor.getNode();
  const focusNode = selection.focus.getNode();
  if (anchorNode === focusNode) {
    return anchorNode;
  }
  const isBackward = selection.isBackward();
  if (isBackward) {
    return $isAtNodeEnd(focus) ? anchorNode : focusNode;
  } else {
    return $isAtNodeEnd(anchor) ? anchorNode : focusNode;
  }
}

interface Props {
  name: string;
  label: string;
  className?: string;
}
export default function WYSIWYG(
  { name, label, className, ...rest }: Props,
) {
  const { error, props } = useField(name);
  const initialConfig = {
    namespace: name,
    theme: {
      blockCursor: "wysiwyg__blockCursor",
      characterLimit: "wysiwyg__characterLimit",
      code: "wysiwyg__code",
      codeHighlight: {
        atrule: "wysiwyg__tokenAttr",
        attr: "wysiwyg__tokenAttr",
        boolean: "wysiwyg__tokenProperty",
        builtin: "wysiwyg__tokenSelector",
        cdata: "wysiwyg__tokenComment",
        char: "wysiwyg__tokenSelector",
        class: "wysiwyg__tokenFunction",
        "class-name": "wysiwyg__tokenFunction",
        comment: "wysiwyg__tokenComment",
        constant: "wysiwyg__tokenProperty",
        deleted: "wysiwyg__tokenProperty",
        doctype: "wysiwyg__tokenComment",
        entity: "wysiwyg__tokenOperator",
        function: "wysiwyg__tokenFunction",
        important: "wysiwyg__tokenVariable",
        inserted: "wysiwyg__tokenSelector",
        keyword: "wysiwyg__tokenAttr",
        namespace: "wysiwyg__tokenVariable",
        number: "wysiwyg__tokenProperty",
        operator: "wysiwyg__tokenOperator",
        prolog: "wysiwyg__tokenComment",
        property: "wysiwyg__tokenProperty",
        punctuation: "wysiwyg__tokenPunctuation",
        regex: "wysiwyg__tokenVariable",
        selector: "wysiwyg__tokenSelector",
        string: "wysiwyg__tokenSelector",
        symbol: "wysiwyg__tokenProperty",
        tag: "wysiwyg__tokenProperty",
        url: "wysiwyg__tokenOperator",
        variable: "wysiwyg__tokenVariable",
      },
      embedBlock: {
        base: "wysiwyg__embedBlock",
        focus: "wysiwyg__embedBlockFocus",
      },
      hashtag: "wysiwyg__hashtag",
      heading: {
        h1: "wysiwyg__h1",
        h2: "wysiwyg__h2",
        h3: "wysiwyg__h3",
        h4: "wysiwyg__h4",
        h5: "wysiwyg__h5",
        h6: "wysiwyg__h6",
      },
      image: "editor-image",
      link: "wysiwyg__link",
      list: {
        listitem: "wysiwyg__listItem",
        listitemChecked: "wysiwyg__listItemChecked",
        listitemUnchecked: "wysiwyg__listItemUnchecked",
        nested: {
          listitem: "wysiwyg__nestedListItem",
        },
        olDepth: [
          "wysiwyg__ol1",
          "wysiwyg__ol2",
          "wysiwyg__ol3",
          "wysiwyg__ol4",
          "wysiwyg__ol5",
        ],
        ul: "wysiwyg__ul",
      },
      ltr: "wysiwyg__ltr",
      mark: "wysiwyg__mark",
      markOverlap: "wysiwyg__markOverlap",
      paragraph: "wysiwyg__paragraph",
      quote: "wysiwyg__quote",
      rtl: "wysiwyg__rtl",
      table: "wysiwyg__table",
      tableAddColumns: "wysiwyg__tableAddColumns",
      tableAddRows: "wysiwyg__tableAddRows",
      tableCell: "wysiwyg__tableCell",
      tableCellActionButton: "wysiwyg__tableCellActionButton",
      tableCellActionButtonContainer: "wysiwyg__tableCellActionButtonContainer",
      tableCellEditing: "wysiwyg__tableCellEditing",
      tableCellHeader: "wysiwyg__tableCellHeader",
      tableCellPrimarySelected: "wysiwyg__tableCellPrimarySelected",
      tableCellResizer: "wysiwyg__tableCellResizer",
      tableCellSelected: "wysiwyg__tableCellSelected",
      tableCellSortedIndicator: "wysiwyg__tableCellSortedIndicator",
      tableResizeRuler: "wysiwyg__tableCellResizeRuler",
      tableSelected: "wysiwyg__tableSelected",
      text: {
        bold: "wysiwyg__textBold",
        code: "wysiwyg__textCode",
        italic: "wysiwyg__textItalic",
        strikethrough: "wysiwyg__textStrikethrough",
        subscript: "wysiwyg__textSubscript",
        superscript: "wysiwyg__textSuperscript",
        underline: "wysiwyg__textUnderline",
        underlineStrikethrough: "wysiwyg__textUnderlineStrikethrough",
      },
    },
    onError: (error: Error) => {
      throw error;
    },
    nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode, CodeNode, CodeHighlightNode, LinkNode],
  };

  return (
    <div className={clsx("flex flex-col", className)}>
      <Label
        text={label}
      />

      <ClientOnly>
        {() => (
          <LexicalComposer initialConfig={initialConfig}>
            <ToolbarPlugin />
            <RichTextPlugin
              contentEditable={
                <ContentEditable className="outline-none rounded-t-none border-l border-b border-r rounded-bl rounded-br px-4 py-2 wysiwyg wysiwyg-sm" />
              }
              // placeholder={<div>Enter some text...</div>}
              ErrorBoundary={LexicalErrorBoundary}
            />
            <HistoryPlugin />
            <ListPlugin />
            <LinkPlugin />
            <WriteToInput name={props.name} />
          </LexicalComposer>
        )}
      </ClientOnly>

      {error && <FieldError text={error} />}
    </div>
  );
}

function WriteToInput({ name }: { name: string }) {
  const [editor] = useLexicalComposerContext();
  const { props } = useField(name);
  const [html, setHtml] = useState<string>(props.defaultValue);

  useEffect(() => {
    // @ts-expect-error - types dont work
    editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        props.onBlur();
        setHtml($generateHtmlFromNodes(editor));
      });
    });

    editor.update(() => {
      if (!props.defaultValue) return;
      const parser = new DOMParser();
      const dom = parser.parseFromString(props.defaultValue, "text/html");
      const nodes = $generateNodesFromDOM(editor, dom);

      // Select the root
      $getRoot().select();

      // Insert them at a selection.
      $insertNodes(nodes);
    });
  }, []);

  return <input type="hidden" name={name} value={html} />;
}


const blocks = {
  paragraph: {
    name: "Paragraph",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        fill="currentColor"
        className="bi bi-text-paragraph"
      >
        <path
          fillRule="evenodd"
          d="M2 12.5a.5.5 0 01.5-.5h7a.5.5 0 010 1h-7a.5.5 0 01-.5-.5zm0-3a.5.5 0 01.5-.5h11a.5.5 0 010 1h-11a.5.5 0 01-.5-.5zm0-3a.5.5 0 01.5-.5h11a.5.5 0 010 1h-11a.5.5 0 01-.5-.5zm4-3a.5.5 0 01.5-.5h7a.5.5 0 010 1h-7a.5.5 0 01-.5-.5z"
        >
        </path>
      </svg>
    ),
  },
  h1: {
    name: "Heading 1",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        fill="currentColor"
        className="bi bi-type-h1"
      >
        <path d="M8.637 13V3.669H7.379V7.62H2.758V3.67H1.5V13h1.258V8.728h4.62V13h1.259zm5.329 0V3.669h-1.244L10.5 5.316v1.265l2.16-1.565h.062V13h1.244z">
        </path>
      </svg>
    ),
  },
  h2: {
    name: "Heading 2",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        fill="currentColor"
        className="bi bi-type-h2"
      >
        <path d="M7.638 13V3.669H6.38V7.62H1.759V3.67H.5V13h1.258V8.728h4.62V13h1.259zm3.022-6.733v-.048c0-.889.63-1.668 1.716-1.668.957 0 1.675.608 1.675 1.572 0 .855-.554 1.504-1.067 2.085l-3.513 3.999V13H15.5v-1.094h-4.245v-.075l2.481-2.844c.875-.998 1.586-1.784 1.586-2.953 0-1.463-1.155-2.556-2.919-2.556-1.941 0-2.966 1.326-2.966 2.74v.049h1.223z">
        </path>
      </svg>
    ),
  },
  h3: {
    name: "Heading 3",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        fill="currentColor"
        className="bi bi-type-h3"
      >
        <path d="M7.637 13V3.669H6.379V7.62H1.758V3.67H.5V13h1.258V8.728h4.62V13h1.259zm3.625-4.272h1.018c1.142 0 1.935.67 1.949 1.674.013 1.005-.78 1.737-2.01 1.73-1.08-.007-1.853-.588-1.935-1.32H9.108c.069 1.327 1.224 2.386 3.083 2.386 1.935 0 3.343-1.155 3.309-2.789-.027-1.51-1.251-2.16-2.037-2.249v-.068c.704-.123 1.764-.91 1.723-2.229-.035-1.353-1.176-2.4-2.954-2.385-1.873.006-2.857 1.162-2.898 2.358h1.196c.062-.69.711-1.299 1.696-1.299.998 0 1.695.622 1.695 1.525.007.922-.718 1.592-1.695 1.592h-.964v1.074z">
        </path>
      </svg>
    ),
  },
  bullet: {
    name: "Bulleted List",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        fill="currentColor"
        className="bi bi-list-ul"
      >
        <path
          fillRule="evenodd"
          d="M5 11.5a.5.5 0 01.5-.5h9a.5.5 0 010 1h-9a.5.5 0 01-.5-.5zm0-4a.5.5 0 01.5-.5h9a.5.5 0 010 1h-9a.5.5 0 01-.5-.5zm0-4a.5.5 0 01.5-.5h9a.5.5 0 010 1h-9a.5.5 0 01-.5-.5zm-3 1a1 1 0 100-2 1 1 0 000 2zm0 4a1 1 0 100-2 1 1 0 000 2zm0 4a1 1 0 100-2 1 1 0 000 2z"
        >
        </path>
      </svg>
    ),
  },
  number: {
    name: "Numbered List",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        fill="currentColor"
        className="bi bi-list-ol"
      >
        <path
          fillRule="evenodd"
          d="M5 11.5a.5.5 0 01.5-.5h9a.5.5 0 010 1h-9a.5.5 0 01-.5-.5zm0-4a.5.5 0 01.5-.5h9a.5.5 0 010 1h-9a.5.5 0 01-.5-.5zm0-4a.5.5 0 01.5-.5h9a.5.5 0 010 1h-9a.5.5 0 01-.5-.5z"
        >
        </path>
        <path d="M1.713 11.865v-.474H2c.217 0 .363-.137.363-.317 0-.185-.158-.31-.361-.31-.223 0-.367.152-.373.31h-.59c.016-.467.373-.787.986-.787.588-.002.954.291.957.703a.595.595 0 01-.492.594v.033a.615.615 0 01.569.631c.003.533-.502.8-1.051.8-.656 0-1-.37-1.008-.794h.582c.008.178.186.306.422.309.254 0 .424-.145.422-.35-.002-.195-.155-.348-.414-.348h-.3zm-.004-4.699h-.604v-.035c0-.408.295-.844.958-.844.583 0 .96.326.96.756 0 .389-.257.617-.476.848l-.537.572v.03h1.054V9H1.143v-.395l.957-.99c.138-.142.293-.304.293-.508 0-.18-.147-.32-.342-.32a.33.33 0 00-.342.338v.041zM2.564 5h-.635V2.924h-.031l-.598.42v-.567l.629-.443h.635V5z">
        </path>
      </svg>
    ),
  },
  quote: {
    name: "Quote",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        fill="currentColor"
        className="bi bi-chat-square-quote"
      >
        <path d="M14 1a1 1 0 011 1v8a1 1 0 01-1 1h-2.5a2 2 0 00-1.6.8L8 14.333 6.1 11.8a2 2 0 00-1.6-.8H2a1 1 0 01-1-1V2a1 1 0 011-1h12zM2 0a2 2 0 00-2 2v8a2 2 0 002 2h2.5a1 1 0 01.8.4l1.9 2.533a1 1 0 001.6 0l1.9-2.533a1 1 0 01.8-.4H14a2 2 0 002-2V2a2 2 0 00-2-2H2z"></path>
        <path d="M7.066 4.76A1.665 1.665 0 004 5.668a1.667 1.667 0 002.561 1.406c-.131.389-.375.804-.777 1.22a.417.417 0 10.6.58c1.486-1.54 1.293-3.214.682-4.112zm4 0A1.665 1.665 0 008 5.668a1.667 1.667 0 002.561 1.406c-.131.389-.375.804-.777 1.22a.417.417 0 10.6.58c1.486-1.54 1.293-3.214.682-4.112z"></path>
      </svg>
    ),
  },
  code: {
    name: "Code",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        fill="currentColor"
        className="bi bi-code"
      >
        <path d="M5.854 4.854a.5.5 0 10-.708-.708l-3.5 3.5a.5.5 0 000 .708l3.5 3.5a.5.5 0 00.708-.708L2.707 8l3.147-3.146zm4.292 0a.5.5 0 01.708-.708l3.5 3.5a.5.5 0 010 .708l-3.5 3.5a.5.5 0 01-.708-.708L13.293 8l-3.147-3.146z"></path>
      </svg>
    )
  }
}

const buttonSmall = (active: boolean) =>
  clsx(
    active ? "bg-gray-200" : "transparent",
    "p-1 rounded w-8 h-8 flex items-center justify-center",
  );

function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const [blockType, setBlockType] = useState<keyof typeof blocks>(
    "paragraph",
  );

  const [selectedElementKey, setSelectedElementKey] = useState<NodeKey | null>(
    null,
  );
  const [fontSize, setFontSize] = useState<string>("15px");
  const [fontColor, setFontColor] = useState<string>("#000");
  const [bgColor, setBgColor] = useState<string>("#fff");
  const [fontFamily, setFontFamily] = useState<string>("Arial");
  const [isLink, setIsLink] = useState(false);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [isSubscript, setIsSubscript] = useState(false);
  const [isSuperscript, setIsSuperscript] = useState(false);
  const [isCode, setIsCode] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  // const [modal, showModal] = useModal();
  const [isRTL, setIsRTL] = useState(false);
  const [codeLanguage, setCodeLanguage] = useState<string>("");
  const [isEditable, setIsEditable] = useState(() => editor.isEditable());

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      const anchorNode = selection.anchor.getNode();
      let element = anchorNode.getKey() === "root"
        ? anchorNode
        : $findMatchingParent(anchorNode, (e: any) => {
          const parent = e.getParent();
          return parent !== null && $isRootOrShadowRoot(parent);
        });

      if (element === null) {
        element = anchorNode.getTopLevelElementOrThrow();
      }

      const elementKey = element.getKey();
      const elementDOM = editor.getElementByKey(elementKey);

      // Update text format
      setIsBold(selection.hasFormat("bold"));
      setIsItalic(selection.hasFormat("italic"));
      setIsUnderline(selection.hasFormat("underline"));
      setIsStrikethrough(selection.hasFormat("strikethrough"));
      setIsSubscript(selection.hasFormat("subscript"));
      setIsSuperscript(selection.hasFormat("superscript"));
      setIsCode(selection.hasFormat("code"));
      setIsRTL($isParentElementRTL(selection));

      // Update links
      const node = getSelectedNode(selection);
      const parent = node.getParent();
      if ($isLinkNode(parent) || $isLinkNode(node)) {
        setIsLink(true);
      } else {
        setIsLink(false);
      }

      if (elementDOM !== null) {
        setSelectedElementKey(elementKey);
        if ($isListNode(element)) {
          const parentList = $getNearestNodeOfType<ListNode>(
            anchorNode,
            ListNode,
          );
          const type = parentList
            ? parentList.getListType()
            : element.getListType();
          setBlockType(type);
        } else {
          const type = $isHeadingNode(element)
            ? element.getTag()
            : element.getType();
          if (type in blocks) {
            setBlockType(type as keyof typeof blocks);
          }
          if ($isCodeNode(element)) {
            const language = element
              .getLanguage() as keyof typeof CODE_LANGUAGE_MAP;
            setCodeLanguage(
              language ? CODE_LANGUAGE_MAP[language] || language : "",
            );
            return;
          }
        }
      }
      // Handle buttons
      setFontSize(
        $getSelectionStyleValueForProperty(selection, "font-size", "15px"),
      );
      setFontColor(
        $getSelectionStyleValueForProperty(selection, "color", "#000"),
      );
      setBgColor(
        $getSelectionStyleValueForProperty(
          selection,
          "background-color",
          "#fff",
        ),
      );
      setFontFamily(
        $getSelectionStyleValueForProperty(selection, "font-family", "Arial"),
      );
    }
  }, [editor]);

  useEffect(() => {
    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      (_payload, newEditor) => {
        updateToolbar();
        return false;
      },
      COMMAND_PRIORITY_CRITICAL,
    );
  }, [editor, updateToolbar]);

  const formatList = (listType: string) => {
    console.log(blockType);
    if (listType === "number" && blockType !== "number") {
      editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
      setBlockType("number");
    } else if (listType === "bullet" && blockType !== "bullet") {
      editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
      setBlockType("bullet");
    } else {
      editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
      setBlockType("paragraph");
    }
  };

  const formatText = (textType: string) => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, textType);
  };

  return (
    <div className="flex gap-x-3 border-l border-t border-r rounded-tr rounded-tl p-1 border-b">
      <BlockFormatting editor={editor} blockType={blockType} />

      <button
        onClick={() => formatText("bold")}
        type="button"
        className={buttonSmall(isBold)}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
        >
          <path
            fill="currentColor"
            fillRule="evenodd"
            d="M7.761 19c-.253 0-.44-.06-.56-.18-.12-.12-.18-.307-.18-.56l-.02-12.52c0-.267.08-.457.2-.57.12-.113.307-.17.56-.17h5.019c1.56 0 2.723.317 3.49.95.767.633 1.15 1.497 1.15 2.59 0 .667-.21 1.283-.63 1.85-.42.567-.937.963-1.55 1.19l.02.08c.387.067.793.247 1.22.54.427.293.787.677 1.08 1.15.293.473.44 1.01.44 1.61 0 1.32-.427 2.323-1.28 3.01-.853.687-2.12 1.03-3.8 1.03H7.761zm4.969-8.26c.687 0 1.237-.17 1.65-.51.414-.34.621-.77.621-1.29 0-1.147-.757-1.72-2.271-1.72H9.28v3.52h3.45zm.59 6.02c.725 0 1.283-.17 1.674-.51.39-.34.586-.823.586-1.45 0-.587-.223-1.037-.67-1.35-.446-.313-1.088-.47-1.925-.47H9.28v3.78h4.04z"
          >
          </path>
        </svg>
      </button>

      <button
        onClick={() => formatText("italic")}
        type="button"
        className={buttonSmall(isItalic)}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
        >
          <path
            fill="currentColor"
            fillRule="evenodd"
            d="M16.746 4.723l-.176.84h-.263c-.638 0-1.097.12-1.377.36-.28.242-.47.6-.567 1.075l-2.07 9.805c-.059.28-.088.465-.088.556 0 .534.482.801 1.445.801h.254l-.175.84h-5.82l.155-.84h.264c1.107 0 1.761-.478 1.963-1.435l2.08-9.805c.052-.247.078-.433.078-.557 0-.534-.482-.8-1.445-.8h-.254l.176-.84h5.82z"
          >
          </path>
        </svg>
      </button>

      <button
        onClick={() => formatText("underline")}
        type="button"
        className={buttonSmall(isUnderline)}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
        >
          <path
            fill="currentColor"
            fillRule="evenodd"
            d="M16 5a1 1 0 011 1v5.5c0 .625-.13 1.208-.39 1.75a4.476 4.476 0 01-1.07 1.438 5.013 5.013 0 01-1.587.953A5.33 5.33 0 0112 16a5.33 5.33 0 01-1.953-.36 5.013 5.013 0 01-1.586-.953 4.476 4.476 0 01-1.07-1.437A3.986 3.986 0 017 11.5V6a1 1 0 112 0v5.5c0 .313.07.615.21.906.142.292.337.558.587.797A3.418 3.418 0 0012 14a3.418 3.418 0 002.203-.797c.25-.24.445-.505.586-.797.14-.291.211-.593.211-.906V6a1 1 0 011-1zM8 17h8a1 1 0 010 2H8a1 1 0 010-2z"
          >
          </path>
        </svg>
      </button>
    </div>
  );
}

function BlockFormatting({ blockType, editor }: {
  blockType: keyof typeof blocks;
  editor: LexicalEditor
}) {

  const formatParagraph = () => {
    if (blockType !== 'paragraph') {
      editor.update(() => {
        const selection = $getSelection();
        if (
          $isRangeSelection(selection) ||
          DEPRECATED_$isGridSelection(selection)
        )
          $setBlocksType_experimental(selection, () => $createParagraphNode());
      });
    }
  };

  const formatHeading = (headingSize: HeadingTagType) => {
    if (blockType !== headingSize) {
      editor.update(() => {
        const selection = $getSelection();
        if (
          $isRangeSelection(selection) ||
          DEPRECATED_$isGridSelection(selection)
        ) {
          $setBlocksType_experimental(selection, () =>
            $createHeadingNode(headingSize),
          );
        }
      });
    }
  };

  const formatBulletList = () => {
    if (blockType !== 'bullet') {
      editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
    } else {
      editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
    }
  };

  const formatNumberedList = () => {
    if (blockType !== 'number') {
      editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
    } else {
      editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
    }
  };

  const formatQuote = () => {
    if (blockType !== 'quote') {
      editor.update(() => {
        const selection = $getSelection();
        if (
          $isRangeSelection(selection) ||
          DEPRECATED_$isGridSelection(selection)
        ) {
          $setBlocksType_experimental(selection, () => $createQuoteNode());
        }
      });
    }
  };

  const formatCode = () => {
    if (blockType !== 'code') {
      editor.update(() => {
        let selection = $getSelection();

        if (
          $isRangeSelection(selection) ||
          DEPRECATED_$isGridSelection(selection)
        ) {
          if (selection.isCollapsed()) {
            $setBlocksType_experimental(selection, () => $createCodeNode());
          } else {
            const textContent = selection.getTextContent();
            const codeNode = $createCodeNode();
            selection.insertNodes([codeNode]);
            selection = $getSelection();
            if ($isRangeSelection(selection))
              selection.insertRawText(textContent);
          }
        }
      });
    }
  };

  const block = blocks[blockType];

  return (
    <Menu as="div" className="relative">
      <div>
        <Menu.Button className="flex items-center text-sm h-8 pl-2 pr-3 border-r">
          {block.icon}
          <span className="ml-2">{block.name}</span>
        </Menu.Button>
      </div>
      <Transition
        as={React.Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute left-0 z-10 mt-2 w-40 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="px-1 py-1 ">
            {Object.entries(blocks).map(([type, block]) => (
              <Menu.Item key={type}>
                {({ active }) => (
                  <button
                    type="button"
                    onClick={() => {
                      console.log(type);

                      if (type === 'paragraph') formatParagraph();
                      if (type === 'h1') formatHeading('h1');
                      if (type === 'h2') formatHeading('h2');
                      if (type === 'h3') formatHeading('h3');
                      if (type === 'bullet') formatBulletList();
                      if (type === 'number') formatNumberedList();
                      if (type === 'quote') formatQuote();
                      if (type === 'code') formatCode();
                    }}
                    className={clsx(
                      active ? "bg-blue-500 text-white" : "text-gray-900",
                      "group flex w-full items-center rounded-md px-2 py-2 text-sm",
                    )}
                  >
                    {block.icon}
                    <span className="ml-2">{block.name}</span>
                  </button>
                )}
              </Menu.Item>
            ))}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}
