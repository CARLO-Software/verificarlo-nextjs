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
  // Registrar tamaños personalizados, divider y anchor en Quill
  useEffect(() => {
    if (typeof window !== "undefined") {
      import("react-quill-new").then((module) => {
        const Quill = module.default.Quill;
        if (Quill) {
          // Registrar tamaños
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const Size = Quill.import("attributors/style/size") as any;
          Size.whitelist = fontSizes;
          Quill.register(Size, true);

          // Registrar bloque de línea divisoria (hr)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const BlockEmbed = Quill.import("blots/block/embed") as any;
          class DividerBlot extends BlockEmbed {
            static blotName = "divider";
            static tagName = "hr";
          }
          Quill.register(DividerBlot, true);

          // Registrar bloque de ancla (span con id)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const Inline = Quill.import("blots/inline") as any;
          class AnchorBlot extends Inline {
            static blotName = "anchor";
            static tagName = "span";

            static create(value: string) {
              const node = super.create();
              node.setAttribute("id", value);
              node.setAttribute("class", "ql-anchor");
              return node;
            }

            static formats(node: HTMLElement) {
              return node.getAttribute("id");
            }
          }
          Quill.register(AnchorBlot, true);
        }
      });
    }
  }, []);

  // Agregar tooltips nativos a los botones del toolbar
  useEffect(() => {
    const tooltips: Record<string, string> = {
      '.ql-bold': 'Negrita (Ctrl+B)',
      '.ql-italic': 'Cursiva (Ctrl+I)',
      '.ql-underline': 'Subrayado (Ctrl+U)',
      '.ql-strike': 'Tachado',
      '.ql-blockquote': 'Cita',
      '.ql-divider': 'Línea divisoria',
      '.ql-link': 'Insertar enlace',
      '.ql-anchor': 'Crear ancla (#id)',
      '.ql-image': 'Insertar imagen',
      '.ql-video': 'Insertar video',
      '.ql-clean': 'Limpiar formato',
      '.ql-list[value="ordered"]': 'Lista numerada',
      '.ql-list[value="bullet"]': 'Lista con viñetas',
      '.ql-indent[value="-1"]': 'Reducir sangría',
      '.ql-indent[value="+1"]': 'Aumentar sangría',
      '.ql-header .ql-picker-label': 'Encabezado',
      '.ql-size .ql-picker-label': 'Tamaño de fuente',
      '.ql-color .ql-picker-label': 'Color de texto',
      '.ql-background .ql-picker-label': 'Color de fondo',
      '.ql-align .ql-picker-label': 'Alineación',
    };

    // Aplicar tooltips después de un breve delay para asegurar que el editor está montado
    const timeoutId = setTimeout(() => {
      Object.entries(tooltips).forEach(([selector, title]) => {
        const elements = document.querySelectorAll(`.ql-toolbar ${selector}`);
        elements.forEach((el) => {
          el.setAttribute('title', title);
        });
      });
    }, 500);

    return () => clearTimeout(timeoutId);
  }, []);

  // Handler para insertar línea divisoria - usa 'this' del contexto del toolbar
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function insertDivider(this: any) {
    const quill = this.quill;
    if (quill) {
      const range = quill.getSelection(true);
      if (range) {
        quill.insertText(range.index, '\n');
        quill.insertEmbed(range.index + 1, 'divider', true);
        quill.insertText(range.index + 2, '\n');
        quill.setSelection(range.index + 3);
      }
    }
  }

  // Handler para insertar ancla (bookmark para hipervínculos internos)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function insertAnchor(this: any) {
    const quill = this.quill;
    if (quill) {
      const range = quill.getSelection(true);
      if (range && range.length > 0) {
        // Hay texto seleccionado - usar como ancla
        const text = quill.getText(range.index, range.length);
        const anchorId = text
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9áéíóúñü\s-]/g, '')
          .replace(/\s+/g, '-')
          .substring(0, 50);

        const finalId = prompt('ID del ancla (para enlazar usa #' + anchorId + '):', anchorId);
        if (finalId) {
          quill.formatText(range.index, range.length, 'anchor', finalId);
        }
      } else {
        // No hay texto seleccionado - pedir ID y texto
        const anchorId = prompt('ID del ancla (ej: seccion-1):');
        if (anchorId) {
          const anchorText = prompt('Texto visible del ancla:', anchorId);
          if (anchorText) {
            const index = range ? range.index : 0;
            quill.insertText(index, anchorText, 'anchor', anchorId);
          }
        }
      }
    }
  }

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
          ["blockquote", "divider"],
          ["link", "anchor", "image", "video"],
          ["clean"],
        ],
        handlers: {
          divider: insertDivider,
          anchor: insertAnchor,
        },
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
    "divider",
    "link",
    "anchor",
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
