"use client";

import { useState, useEffect, use, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Play,
  Instagram,
  Youtube,
  Loader2,
  Upload,
  X,
  ImageIcon,
  Video,
} from "lucide-react";
import styles from "../../nuevo/ReelForm.module.css";

// ============================================
// TIPOS
// ============================================

type EmbedType = "INSTAGRAM" | "TIKTOK" | "YOUTUBE_SHORTS";
type ReelCategory = "TIPS" | "FRAUDES" | "PROCESO" | "TESTIMONIOS";

interface FormData {
  title: string;
  description: string;
  embedUrl: string;
  embedType: EmbedType;
  thumbnailUrl: string;
  videoUrl: string;
  category: ReelCategory;
  isActive: boolean;
}

// ============================================
// HELPERS
// ============================================

const categories: { value: ReelCategory; label: string }[] = [
  { value: "TIPS", label: "Tips para comprar" },
  { value: "FRAUDES", label: "Detectar fraudes" },
  { value: "PROCESO", label: "Proceso de inspección" },
  { value: "TESTIMONIOS", label: "Testimonios" },
];

const platforms: { value: EmbedType; label: string; icon: JSX.Element }[] = [
  { value: "INSTAGRAM", label: "Instagram", icon: <Instagram size={18} /> },
  { value: "TIKTOK", label: "TikTok", icon: <Play size={18} /> },
  { value: "YOUTUBE_SHORTS", label: "YouTube Shorts", icon: <Youtube size={18} /> },
];

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function EditarReelPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [dragActiveVideo, setDragActiveVideo] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    embedUrl: "",
    embedType: "INSTAGRAM",
    thumbnailUrl: "",
    videoUrl: "",
    category: "TIPS",
    isActive: true,
  });

  // Cargar datos del reel
  useEffect(() => {
    async function fetchReel() {
      try {
        const response = await fetch(`/api/admin/reels/${id}`);
        if (!response.ok) {
          throw new Error("Reel no encontrado");
        }
        const data = await response.json();
        setFormData({
          title: data.title || "",
          description: data.description || "",
          embedUrl: data.embedUrl || "",
          embedType: data.embedType || "INSTAGRAM",
          thumbnailUrl: data.thumbnailUrl || "",
          videoUrl: data.videoUrl || "",
          category: data.category || "TIPS",
          isActive: data.isActive ?? true,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error cargando reel");
      } finally {
        setLoading(false);
      }
    }

    fetchReel();
  }, [id]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  // ============================================
  // UPLOAD DE THUMBNAIL
  // ============================================

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("El archivo debe ser una imagen");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("La imagen no debe superar 5MB");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // 1. Obtener firma para subida directa a Cloudinary
      const signatureRes = await fetch("/api/admin/reels/upload-signature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resourceType: "image" }),
      });

      if (!signatureRes.ok) {
        const signatureData = await signatureRes.json();
        throw new Error(signatureData.error || "Error al obtener firma");
      }

      const { signature, timestamp, cloudName, apiKey, folder } =
        await signatureRes.json();

      // 2. Subir directamente a Cloudinary
      const cloudinaryFormData = new FormData();
      cloudinaryFormData.append("file", file);
      cloudinaryFormData.append("signature", signature);
      cloudinaryFormData.append("timestamp", timestamp.toString());
      cloudinaryFormData.append("api_key", apiKey);
      cloudinaryFormData.append("folder", folder);

      const cloudinaryRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: "POST",
          body: cloudinaryFormData,
        }
      );

      const cloudinaryData = await cloudinaryRes.json();

      if (!cloudinaryRes.ok) {
        console.error("Cloudinary error:", cloudinaryData);
        throw new Error(cloudinaryData.error?.message || "Error al subir la imagen a Cloudinary");
      }

      setFormData((prev) => ({ ...prev, thumbnailUrl: cloudinaryData.secure_url }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al subir imagen");
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const removeThumbnail = () => {
    setFormData((prev) => ({ ...prev, thumbnailUrl: "" }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // ============================================
  // UPLOAD DE VIDEO NATIVO
  // ============================================

  const handleVideoSelect = async (file: File) => {
    const validVideoTypes = ["video/mp4", "video/webm", "video/quicktime"];
    if (!validVideoTypes.includes(file.type)) {
      setError("El archivo debe ser un video (MP4, WebM o MOV)");
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setError("El video no debe superar 50MB");
      return;
    }

    setUploadingVideo(true);
    setError(null);

    try {
      // 1. Obtener firma para subida directa a Cloudinary
      const signatureRes = await fetch("/api/admin/reels/upload-signature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resourceType: "video" }),
      });

      if (!signatureRes.ok) {
        const signatureData = await signatureRes.json();
        throw new Error(signatureData.error || "Error al obtener firma");
      }

      const { signature, timestamp, cloudName, apiKey, folder } =
        await signatureRes.json();

      // 2. Subir directamente a Cloudinary (evita timeout del servidor)
      const cloudinaryFormData = new FormData();
      cloudinaryFormData.append("file", file);
      cloudinaryFormData.append("signature", signature);
      cloudinaryFormData.append("timestamp", timestamp.toString());
      cloudinaryFormData.append("api_key", apiKey);
      cloudinaryFormData.append("folder", folder);

      const cloudinaryRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`,
        {
          method: "POST",
          body: cloudinaryFormData,
        }
      );

      const cloudinaryData = await cloudinaryRes.json();

      if (!cloudinaryRes.ok) {
        console.error("Cloudinary error:", cloudinaryData);
        throw new Error(cloudinaryData.error?.message || "Error al subir el video a Cloudinary");
      }

      setFormData((prev) => ({ ...prev, videoUrl: cloudinaryData.secure_url }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al subir video");
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleDragVideo = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActiveVideo(true);
    } else if (e.type === "dragleave") {
      setDragActiveVideo(false);
    }
  };

  const handleDropVideo = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActiveVideo(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleVideoSelect(e.dataTransfer.files[0]);
    }
  };

  const handleVideoInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleVideoSelect(e.target.files[0]);
    }
  };

  const removeVideo = () => {
    setFormData((prev) => ({ ...prev, videoUrl: "" }));
    if (videoInputRef.current) {
      videoInputRef.current.value = "";
    }
  };

  // ============================================
  // SUBMIT
  // ============================================

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.title.trim()) {
      setError("El título es obligatorio");
      return;
    }
    // Validar que tenga al menos un video (nativo o embed)
    if (!formData.videoUrl?.trim() && !formData.embedUrl.trim()) {
      setError("Debes subir un video o proporcionar una URL de embed");
      return;
    }
    if (!formData.thumbnailUrl.trim()) {
      setError("Debes subir una imagen de thumbnail");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(`/api/admin/reels/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al actualizar el reel");
      }

      router.push("/admin/reels");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setSaving(false);
    }
  };

  // Generar URL de embed para preview
  const getEmbedPreviewUrl = () => {
    if (!formData.embedUrl) return null;

    try {
      const url = formData.embedUrl;

      if (formData.embedType === "INSTAGRAM") {
        if (url.includes("instagram.com")) {
          const cleanUrl = url.split("?")[0];
          return cleanUrl.endsWith("/")
            ? `${cleanUrl}embed`
            : `${cleanUrl}/embed`;
        }
      }

      if (formData.embedType === "TIKTOK") {
        const match = url.match(/video\/(\d+)/);
        if (match) {
          return `https://www.tiktok.com/embed/v2/${match[1]}`;
        }
      }

      if (formData.embedType === "YOUTUBE_SHORTS") {
        const match = url.match(/(?:shorts\/|v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
        if (match) {
          return `https://www.youtube.com/embed/${match[1]}`;
        }
      }
    } catch {
      return null;
    }

    return null;
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "4rem",
            color: "#666",
            gap: "0.5rem",
          }}
        >
          <Loader2 size={20} className={styles.spinner} />
          Cargando reel...
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link href="/admin/reels" className={styles.backButton}>
          <ArrowLeft size={20} />
          Volver
        </Link>
        <h1 className={styles.title}>Editar Reel</h1>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGrid}>
          {/* Columna izquierda: Formulario */}
          <div className={styles.formFields}>
            {error && <div className={styles.error}>{error}</div>}

            {/* Título */}
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Título <span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Ej: Cómo detectar kilometraje alterado"
                className={styles.input}
                maxLength={100}
              />
              <span className={styles.charCount}>
                {formData.title.length}/100
              </span>
            </div>

            {/* Descripción */}
            <div className={styles.formGroup}>
              <label className={styles.label}>Descripción</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Breve descripción del contenido del video..."
                className={styles.textarea}
                rows={3}
                maxLength={300}
              />
              <span className={styles.charCount}>
                {formData.description.length}/300
              </span>
            </div>

            {/* Plataforma */}
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Plataforma <span className={styles.required}>*</span>
              </label>
              <div className={styles.platformSelector}>
                {platforms.map((platform) => (
                  <button
                    key={platform.value}
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        embedType: platform.value,
                      }))
                    }
                    className={`${styles.platformButton} ${
                      formData.embedType === platform.value
                        ? styles.platformActive
                        : ""
                    }`}
                  >
                    {platform.icon}
                    {platform.label}
                  </button>
                ))}
              </div>
            </div>

            {/* URL del video */}
            <div className={styles.formGroup}>
              <label className={styles.label}>
                URL de embed <span className={styles.optional}>(opcional si hay video nativo)</span>
              </label>
              <input
                type="url"
                name="embedUrl"
                value={formData.embedUrl}
                onChange={handleChange}
                placeholder={
                  formData.embedType === "INSTAGRAM"
                    ? "https://www.instagram.com/reel/ABC123/"
                    : formData.embedType === "TIKTOK"
                    ? "https://www.tiktok.com/@user/video/1234567890"
                    : "https://www.youtube.com/shorts/ABC123"
                }
                className={styles.input}
              />
              <span className={styles.hint}>
                Pega la URL completa del video desde{" "}
                {formData.embedType === "INSTAGRAM"
                  ? "Instagram"
                  : formData.embedType === "TIKTOK"
                  ? "TikTok"
                  : "YouTube"}
              </span>
            </div>

            {/* Thumbnail Upload */}
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Thumbnail <span className={styles.required}>*</span>
              </label>

              {formData.thumbnailUrl ? (
                <div className={styles.uploadedPreview}>
                  <img src={formData.thumbnailUrl} alt="Thumbnail" />
                  <button
                    type="button"
                    onClick={removeThumbnail}
                    className={styles.removeButton}
                    title="Cambiar imagen"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div
                  className={`${styles.uploadZone} ${dragActive ? styles.uploadZoneActive : ""} ${uploading ? styles.uploadZoneUploading : ""}`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => !uploading && fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileInput}
                    className={styles.fileInput}
                    disabled={uploading}
                  />

                  {uploading ? (
                    <>
                      <Loader2 size={32} className={styles.spinner} />
                      <span>Subiendo imagen...</span>
                    </>
                  ) : (
                    <>
                      <div className={styles.uploadIcon}>
                        <ImageIcon size={28} />
                        <Upload size={16} className={styles.uploadArrow} />
                      </div>
                      <span className={styles.uploadText}>
                        Arrastra una imagen aquí o haz clic para seleccionar
                      </span>
                      <span className={styles.uploadHint}>
                        PNG, JPG o WebP (máx. 5MB)
                      </span>
                    </>
                  )}
                </div>
              )}
              <span className={styles.hint}>
                La imagen se recortará automáticamente a formato vertical (9:16)
              </span>
            </div>

            {/* Video Nativo Upload (opcional) */}
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Video Nativo <span className={styles.optional}>(opcional)</span>
              </label>

              {formData.videoUrl ? (
                <div className={styles.videoPreview}>
                  <video
                    src={formData.videoUrl}
                    controls
                  />
                  <button
                    type="button"
                    onClick={removeVideo}
                    className={styles.removeButton}
                    title="Eliminar video"
                  >
                    <X size={18} />
                  </button>
                </div>
              ) : (
                <div
                  className={`${styles.uploadZone} ${dragActiveVideo ? styles.uploadZoneActive : ""} ${uploadingVideo ? styles.uploadZoneUploading : ""}`}
                  onDragEnter={handleDragVideo}
                  onDragLeave={handleDragVideo}
                  onDragOver={handleDragVideo}
                  onDrop={handleDropVideo}
                  onClick={() => !uploadingVideo && videoInputRef.current?.click()}
                >
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime"
                    onChange={handleVideoInput}
                    className={styles.fileInput}
                    disabled={uploadingVideo}
                  />

                  {uploadingVideo ? (
                    <>
                      <Loader2 size={32} className={styles.spinner} />
                      <span>Subiendo video...</span>
                    </>
                  ) : (
                    <>
                      <div className={styles.uploadIcon}>
                        <Video size={28} />
                        <Upload size={16} className={styles.uploadArrow} />
                      </div>
                      <span className={styles.uploadText}>
                        Arrastra un video aquí o haz clic para seleccionar
                      </span>
                      <span className={styles.uploadHint}>
                        MP4, WebM o MOV (máx. 50MB)
                      </span>
                    </>
                  )}
                </div>
              )}
              <span className={styles.hint}>
                Si subes un video nativo, se usará en lugar del embed de redes sociales
              </span>
            </div>

            {/* Categoría */}
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Categoría <span className={styles.required}>*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className={styles.select}
              >
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Botones */}
            <div className={styles.formActions}>
              <Link href="/admin/reels" className={styles.cancelButton}>
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={saving || uploading || uploadingVideo}
                className={styles.submitButton}
              >
                {saving ? (
                  "Guardando..."
                ) : (
                  <>
                    <Save size={18} />
                    Guardar Cambios
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Columna derecha: Preview */}
          <div className={styles.previewColumn}>
            <h3 className={styles.previewTitle}>Vista previa</h3>

            {/* Preview del Thumbnail */}
            <div className={styles.previewCard}>
              <div className={styles.thumbnailPreview}>
                {formData.thumbnailUrl ? (
                  <img src={formData.thumbnailUrl} alt="Preview" />
                ) : (
                  <div className={styles.thumbnailPlaceholder}>
                    <Play size={32} />
                    <span>Thumbnail</span>
                  </div>
                )}
                <div className={styles.thumbnailOverlay}>
                  <Play size={24} />
                </div>
              </div>
              <div className={styles.previewInfo}>
                <span className={styles.previewReelTitle}>
                  {formData.title || "Título del reel"}
                </span>
                <span className={styles.previewCategory}>
                  {categories.find((c) => c.value === formData.category)?.label}
                </span>
              </div>
            </div>

            {/* Preview del Embed */}
            {getEmbedPreviewUrl() && (
              <div className={styles.embedPreview}>
                <h4 className={styles.embedTitle}>Preview del video</h4>
                <div className={styles.embedContainer}>
                  <iframe
                    src={getEmbedPreviewUrl()!}
                    frameBorder="0"
                    allowFullScreen
                    allow="autoplay; encrypted-media"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
