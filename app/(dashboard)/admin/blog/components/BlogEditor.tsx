"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Save, Eye, EyeOff, ArrowLeft, Monitor, Smartphone, Upload, Loader2 } from "lucide-react";
import styles from "./BlogEditor.module.css";
import RichTextEditor from "./RichTextEditor";

function isValidImageUrl(url: string): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

interface Category {
  id: string;
  name: string;
  slug: string;
  color: string;
}

interface PostData {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  categoryId: string;
  author: string;
  published: boolean;
}

interface BlogEditorProps {
  initialData?: PostData;
  isEditing?: boolean;
  originalSlug?: string;
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export default function BlogEditor({
  initialData,
  isEditing = false,
  originalSlug,
}: BlogEditorProps) {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [imagePosition, setImagePosition] = useState({ x: 50, y: 50 }); // Posición en porcentaje
  const [formData, setFormData] = useState<PostData>(
    initialData || {
      title: "",
      slug: "",
      excerpt: "",
      content: "",
      coverImage: "",
      categoryId: "",
      author: "Verificarlo",
      published: false,
    }
  );

  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await fetch("/api/blog/categories");
        const data = await response.json();
        setCategories(data);
        if (!formData.categoryId && data.length > 0) {
          setFormData((prev) => ({ ...prev, categoryId: data[0].id }));
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    }
    fetchCategories();
  }, [formData.categoryId]);

  const handleChange = useCallback(
    (field: keyof PostData, value: string | boolean) => {
      setFormData((prev) => {
        const updated = { ...prev, [field]: value };
        // Auto-generate slug from title for new posts
        if (field === "title" && !isEditing) {
          updated.slug = generateSlug(value as string);
        }
        return updated;
      });
    },
    [isEditing]
  );

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/blog/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        handleChange("coverImage", data.url);
      } else {
        alert(data.error || "Error al subir la imagen");
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Error al subir la imagen");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(publish: boolean = false) {
    if (!formData.title || !formData.excerpt || !formData.content || !formData.coverImage) {
      alert("Por favor completa todos los campos requeridos");
      return;
    }

    setSaving(true);

    try {
      const url = isEditing
        ? `/api/blog/posts/${originalSlug}`
        : "/api/blog/posts";
      const method = isEditing ? "PUT" : "POST";

      const body = {
        ...formData,
        published: publish,
        ...(isEditing && formData.slug !== originalSlug && { newSlug: formData.slug }),
      };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        router.push("/admin/blog");
        router.refresh();
      } else {
        const data = await response.json();
        alert(data.error || "Error al guardar");
      }
    } catch (error) {
      console.error("Error saving post:", error);
      alert("Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  const selectedCategory = categories.find((c) => c.id === formData.categoryId);

  const formattedDate = new Date().toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div className={styles.editor}>
      {/* Header */}
      <div className={styles.header}>
        <button
          onClick={() => router.push("/admin/blog")}
          className={styles.backButton}
        >
          <ArrowLeft size={20} />
          Volver
        </button>
        <div className={styles.headerActions}>
          <button
            onClick={() => handleSubmit(false)}
            className={styles.draftButton}
            disabled={saving}
          >
            <EyeOff size={18} />
            Guardar borrador
          </button>
          <button
            onClick={() => handleSubmit(true)}
            className={styles.publishButton}
            disabled={saving}
          >
            <Save size={18} />
            {formData.published ? "Actualizar" : "Publicar"}
          </button>
        </div>
      </div>

      {/* Split View */}
      <div className={styles.splitView}>
        {/* Editor Panel */}
        <div className={styles.editorPanel}>
          <h2 className={styles.panelTitle}>Editor</h2>

          <div className={styles.formGroup}>
            <label className={styles.label}>Título *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleChange("title", e.target.value)}
              placeholder="Título del artículo"
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Slug</label>
            <div className={styles.slugInput}>
              <span className={styles.slugPrefix}>/blog/</span>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => handleChange("slug", e.target.value)}
                placeholder="url-del-articulo"
                className={styles.input}
              />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Categoría *</label>
              <select
                value={formData.categoryId}
                onChange={(e) => handleChange("categoryId", e.target.value)}
                className={styles.select}
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Autor</label>
              <input
                type="text"
                value={formData.author}
                onChange={(e) => handleChange("author", e.target.value)}
                placeholder="Nombre del autor"
                className={styles.input}
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Imagen de portada *</label>
            {formData.coverImage ? (
              <div className={styles.imageEditorContainer}>
                <div className={styles.imagePreviewContainer}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={formData.coverImage}
                    alt="Portada"
                    className={styles.imagePreview}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      handleChange("coverImage", "");
                      setImagePosition({ x: 50, y: 50 });
                    }}
                    className={styles.removeImageButton}
                    title="Eliminar imagen"
                  >
                    ✕
                  </button>
                </div>
                <div className={styles.positionControls}>
                  <span className={styles.positionHint}>Ajusta cómo se verá la imagen en la portada</span>
                  <div className={styles.positionControl}>
                    <label>Horizontal</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={imagePosition.x}
                      onChange={(e) => setImagePosition(prev => ({ ...prev, x: Number(e.target.value) }))}
                      className={styles.positionSlider}
                    />
                    <div className={styles.positionLabels}>
                      <span>◀ Izq</span>
                      <span>Der ▶</span>
                    </div>
                  </div>
                  <div className={styles.positionControl}>
                    <label>Vertical</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={imagePosition.y}
                      onChange={(e) => setImagePosition(prev => ({ ...prev, y: Number(e.target.value) }))}
                      className={styles.positionSlider}
                    />
                    <div className={styles.positionLabels}>
                      <span>▲ Arriba</span>
                      <span>Abajo ▼</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <label className={styles.imageDropzone}>
                {uploading ? (
                  <>
                    <Loader2 size={32} className={styles.spinner} />
                    <span>Subiendo imagen...</span>
                  </>
                ) : (
                  <>
                    <Upload size={32} />
                    <span>Haz clic para subir una imagen</span>
                    <span className={styles.dropzoneHint}>JPG, PNG o WebP (máx. 5MB)</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploading}
                  className={styles.fileInput}
                />
              </label>
            )}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Extracto *</label>
            <textarea
              value={formData.excerpt}
              onChange={(e) => handleChange("excerpt", e.target.value)}
              placeholder="Breve descripción del artículo (aparece en las tarjetas)"
              className={styles.textarea}
              rows={3}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Contenido *</label>
            <RichTextEditor
              value={formData.content}
              onChange={(value) => handleChange("content", value)}
              placeholder="Escribe el contenido del artículo..."
            />
          </div>
        </div>

        {/* Preview Panel */}
        <div className={styles.previewPanel}>
          <div className={styles.previewHeader}>
            <h2 className={styles.panelTitle}>Vista previa</h2>
            <div className={styles.previewModeToggle}>
              <button
                onClick={() => setPreviewMode("desktop")}
                className={`${styles.modeButton} ${
                  previewMode === "desktop" ? styles.modeActive : ""
                }`}
                title="Vista desktop"
              >
                <Monitor size={18} />
              </button>
              <button
                onClick={() => setPreviewMode("mobile")}
                className={`${styles.modeButton} ${
                  previewMode === "mobile" ? styles.modeActive : ""
                }`}
                title="Vista móvil"
              >
                <Smartphone size={18} />
              </button>
            </div>
          </div>

          <div
            className={`${styles.previewContent} ${
              previewMode === "mobile" ? styles.previewMobile : ""
            }`}
          >
            <article className={styles.previewArticle}>
              {/* Cover Image */}
              <div className={styles.previewCover}>
                {isValidImageUrl(formData.coverImage) ? (
                  <div
                    className={styles.previewCoverImageWrapper}
                    style={{
                      backgroundImage: `url(${formData.coverImage})`,
                      backgroundPosition: `${imagePosition.x}% ${imagePosition.y}%`
                    }}
                  />
                ) : (
                  <div className={styles.previewCoverPlaceholder}>
                    <Eye size={48} />
                    <span>{formData.coverImage ? "URL inválida" : "Imagen de portada"}</span>
                  </div>
                )}
                {isValidImageUrl(formData.coverImage) && (
                  <div className={styles.positionIndicator}>
                    {imagePosition.x}% H, {imagePosition.y}% V
                  </div>
                )}
              </div>

              {/* Header */}
              <div className={styles.previewBody}>
                {selectedCategory && (
                  <span
                    className={styles.previewCategory}
                    style={{ backgroundColor: selectedCategory.color }}
                  >
                    {selectedCategory.name}
                  </span>
                )}

                <h1 className={styles.previewTitle}>
                  {formData.title || "Título del artículo"}
                </h1>

                <div className={styles.previewMeta}>
                  <span>{formattedDate}</span>
                  <span className={styles.previewDivider}>|</span>
                  <span>Por {formData.author || "Autor"}</span>
                </div>

                <p className={styles.previewExcerpt}>
                  {formData.excerpt || "Extracto del artículo..."}
                </p>

                <div
                  className={styles.previewContentBody}
                  dangerouslySetInnerHTML={{
                    __html:
                      formData.content ||
                      "<p>El contenido del artículo aparecerá aquí...</p>",
                  }}
                />
              </div>
            </article>
          </div>
        </div>
      </div>
    </div>
  );
}
