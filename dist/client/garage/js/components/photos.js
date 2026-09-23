// Photo intake for job records. Files are downscaled to keep localStorage small.

export const readAndDownscale = (file, maxEdge = 1280, quality = 0.82) =>
  new Promise((resolvePhoto, rejectPhoto) => {
    const reader = new FileReader();
    reader.onerror = () => rejectPhoto(new Error("Could not read the photo."));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => rejectPhoto(new Error("Could not decode the photo."));
      image.onload = () => {
        const ratio = Math.min(1, maxEdge / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(image.width * ratio);
        canvas.height = Math.round(image.height * ratio);
        canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
        resolvePhoto(canvas.toDataURL("image/jpeg", quality));
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });

export const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
