/** Converte um data URL de imagem em bytes para guardar no storage. */
export function dataUrlParaArquivo(dataUrl: string): {
  bytes: Uint8Array;
  tipo: string;
  extensao: string;
} {
  const [cabecalho = "", base64 = ""] = dataUrl.split(",");
  const tipo = cabecalho.match(/data:([^;]+)/)?.[1] ?? "image/jpeg";
  const binario = atob(base64);
  const bytes = new Uint8Array(binario.length);
  for (let i = 0; i < binario.length; i += 1) bytes[i] = binario.charCodeAt(i);
  const extensao = tipo.split("/")[1]?.replace("jpeg", "jpg") ?? "jpg";
  return { bytes, tipo, extensao };
}

