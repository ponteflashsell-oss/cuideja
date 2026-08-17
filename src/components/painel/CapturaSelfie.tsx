import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, CheckCircle2, RefreshCw, ShieldCheck, SwitchCamera } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type Etapa = "selfie" | "documento";

const passos: { id: Etapa; titulo: string; instrucao: string; facing: "user" | "environment" }[] = [
  {
    id: "selfie",
    titulo: "1. Selfie ao vivo",
    instrucao:
      "Fique num local iluminado, olhe para a câmera e mantenha o rosto dentro do círculo. Sem óculos escuros ou boné.",
    facing: "user",
  },
  {
    id: "documento",
    titulo: "2. Documento com foto",
    instrucao:
      "Segure o RG ou CNH aberto dentro da moldura, com os dados legíveis e sem reflexo do flash.",
    facing: "environment",
  },
];

export function CapturaSelfie({
  onConcluir,
}: {
  onConcluir?: (imagens: { selfie: string; documento: string }) => void;
}) {
  const [aberto, setAberto] = useState(false);
  const [etapa, setEtapa] = useState(0);
  const [capturas, setCapturas] = useState<Partial<Record<Etapa, string>>>({});
  const [erro, setErro] = useState("");
  const [pronto, setPronto] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const passo = passos[etapa]!;
  const previa = capturas[passo.id];

  const pararCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setPronto(false);
  }, []);

  const iniciarCamera = useCallback(
    async (facing: "user" | "environment") => {
      setErro("");
      pararCamera();
      if (!navigator.mediaDevices?.getUserMedia) {
        setErro("Este navegador não permite abrir a câmera. Use o celular ou o Chrome atualizado.");
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 960 } },
          audio: false,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => undefined);
        }
        setPronto(true);
      } catch {
        setErro(
          "Não conseguimos acessar a câmera. Autorize o uso da câmera nas permissões do navegador.",
        );
      }
    },
    [pararCamera],
  );

  useEffect(() => {
    if (!aberto || previa) return;
    void iniciarCamera(passo.facing);
    return pararCamera;
  }, [aberto, previa, passo.facing, iniciarCamera, pararCamera]);

  useEffect(() => pararCamera, [pararCamera]);

  const capturar = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    setCapturas((prev) => ({ ...prev, [passo.id]: canvas.toDataURL("image/jpeg", 0.85) }));
    pararCamera();
  };

  const refazer = () => setCapturas((prev) => ({ ...prev, [passo.id]: undefined }));

  const avancar = () => {
    if (etapa < passos.length - 1) {
      setEtapa(etapa + 1);
      return;
    }
    const selfie = capturas.selfie;
    const documento = capturas.documento;
    if (!selfie || !documento) return;
    pararCamera();
    setAberto(false);
    onConcluir?.({ selfie, documento });
    toast.success("Selfie e documento enviados para análise antifraude.");
  };

  const fechar = (open: boolean) => {
    setAberto(open);
    if (!open) {
      pararCamera();
      setEtapa(0);
      setCapturas({});
      setErro("");
    }
  };

  return (
    <Dialog open={aberto} onOpenChange={fechar}>
      <DialogTrigger asChild>
        <Button className="mt-4 w-full gap-2">
          <Camera className="size-4" /> Abrir câmera e fazer selfie + documento
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{passo.titulo}</DialogTitle>
          <DialogDescription>{passo.instrucao}</DialogDescription>
        </DialogHeader>

        <div className="relative overflow-hidden rounded-xl bg-muted">
          {previa ? (
            <img src={previa} alt={`Captura de ${passo.titulo}`} className="aspect-[4/3] w-full object-cover" />
          ) : (
            <>
              <video
                ref={videoRef}
                playsInline
                muted
                autoPlay
                className="aspect-[4/3] w-full object-cover"
                style={passo.facing === "user" ? { transform: "scaleX(-1)" } : undefined}
              />
              <div
                className={
                  passo.id === "selfie"
                    ? "pointer-events-none absolute left-1/2 top-1/2 size-48 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-dashed border-primary/70"
                    : "pointer-events-none absolute left-1/2 top-1/2 h-40 w-64 -translate-x-1/2 -translate-y-1/2 rounded-lg border-2 border-dashed border-primary/70"
                }
              />
            </>
          )}
        </div>

        {erro ? <p className="text-sm text-destructive">{erro}</p> : null}

        <div className="flex flex-wrap gap-2">
          {previa ? (
            <>
              <Button variant="outline" className="gap-2" onClick={refazer}>
                <RefreshCw className="size-4" /> Refazer
              </Button>
              <Button className="gap-2" onClick={avancar}>
                <CheckCircle2 className="size-4" />
                {etapa < passos.length - 1 ? "Usar e continuar" : "Enviar para análise"}
              </Button>
            </>
          ) : (
            <>
              <Button className="gap-2" disabled={!pronto} onClick={capturar}>
                <Camera className="size-4" /> Capturar agora
              </Button>
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => iniciarCamera(passo.facing === "user" ? "environment" : "user")}
              >
                <SwitchCamera className="size-4" /> Trocar câmera
              </Button>
            </>
          )}
        </div>

        <p className="flex items-start gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-primary" />
          A captura é feita ao vivo, sem upload de arquivos da galeria, para impedir fraude de
          identidade. As imagens são usadas apenas na verificação (LGPD).
        </p>
      </DialogContent>
    </Dialog>
  );
}
