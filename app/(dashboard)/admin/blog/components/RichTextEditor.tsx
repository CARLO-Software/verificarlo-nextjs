"use client";

import dynamic from "next/dynamic";
import { useMemo, useEffect } from "react";
import "react-quill-new/dist/quill.snow.css";
import styles from "./RichTextEditor.module.css";

const ReactQuill = dynamic(() => import("react-quill-new"), {
  ssr: false,
  loading: () => <div className={styles.loading}>Cargando editor...</div>,
});

// Tamaños de fuente disponibles (como en Word)
const fontSizes = ["12px", "14px", "16px", "18px", "20px", "24px", "28px", "32px", "36px", "48px"];

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Escribe el contenido del artículo...",
}: RichTextEditorProps) {
  // Registrar tamaños personalizados en Quill
  useEffect(() => {
    if (typeof window !== "undefined") {
      import("react-quill-new").then((module) => {
        const Quill = module.default.Quill;
        if (Quill) {
          const Size = Quill.import("attributors/style/size");
          Size.whitelist = fontSizes;
          Quill.register(Size, true);
        }
      });
    }
  }, []);

  const modules = useMemo(
    () => ({
      toolbar: {
        container: [
          [{ header: [1, 2, 3, 4, false] }],
          [{ size: fontSizes }],
          ["bold", "italic", "underline", "strike"],
          [{ color: [] }, { background: [] }],
          [{ list: "ordered" }, { list: "bullet" }],
          [{ indent: "-1" }, { indent: "+1" }],
          [{ align: [] }],
          ["blockquote"],
          ["link", "image", "video"],
          ["clean"],
        ],
      },
      clipboard: {
        matchVisual: false,
      },
    }),
    []
  );

  const formats = [
    "header",
    "size",
    "bold",
    "italic",
    "underline",
    "strike",
    "color",
    "background",
    "list",
    "bullet",
    "indent",
    "align",
    "blockquote",
    "link",
    "image",
    "video",
  ];

  return (
    <div className={styles.editorWrapper}>
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        className={styles.editor}
      />
    </div>
  );
}
