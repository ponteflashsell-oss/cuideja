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

export function CapturaDocumento({
  onConcluir,
  children,
}: {
  onConcluir?: (imagem: string) => void;
  children: React.ReactNode;
}) {
  const [aberto, setAberto] = useState(false);
  const [captura, setCaptura] = useState<string | null>(null);
  const [erro, setErro] = useState("");
  const [pronto, setPronto] = useState(false);
  const [facing, setFacing] = useState<"user" | "environment">("environment");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const pararCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setPronto(false);
  }, []);

  const iniciarCamera = useCallback(
    async (modo: "user" | "environment") => {
      setErro("");
      pararCamera();
      if (!navigator.mediaDevices?.getUserMedia) {
        setErro("Este navegador não permite abrir a câmera. Use o celular ou o Chrome atualizado.");
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: modo, width: { ideal: 1920 }, height: { ideal: 1080 } },
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
    if (!aberto || captura) return;
    void iniciarCamera(facing);
    return pararCamera;
  }, [aberto, captura, facing, iniciarCamera, pararCamera]);

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
    setCaptura(canvas.toDataURL("image/jpeg", 0.92));
    pararCamera();
  };

  const refazer = () => {
    setCaptura(null);
    void iniciarCamera(facing);
  };

  const trocarCamera = () => {
    const novo = facing === "user" ? "environment" : "user";
    setFacing(novo);
    void iniciarCamera(novo);
  };

  const enviar = () => {
    if (!captura) return;
    pararCamera();
    setAberto(false);
    onConcluir?.(captura);
    toast.success("Foto do documento enviada para análise.");
    setCaptura(null);
  };

  const fechar = (open: boolean) => {
    setAberto(open);
    if (!open) {
      pararCamera();
      setCaptura(null);
      setErro("");
      setFacing("environment");
    }
  };

  return (
    <Dialog open={aberto} onOpenChange={fechar}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Fotografar documento oficial</DialogTitle>
          <DialogDescription>
            Posicione a frente da CNH ou RG dentro da moldura. Evite reflexos e mantenha os dados
            legíveis.
          </DialogDescription>
        </DialogHeader>

        <div className="relative overflow-hidden rounded-xl bg-muted">
          {captura ? (
            <img
              src={captura}
              alt="Prévia do documento capturado"
              className="aspect-[16/10] w-full object-contain bg-background"
            />
          ) : (
            <>
              <video
                ref={videoRef}
                playsInline
                muted
                autoPlay
                className="aspect-[16/10] w-full object-cover"
              />
              <div className="pointer-events-none absolute left-1/2 top-1/2 h-44 w-72 -translate-x-1/2 -translate-y-1/2 rounded-lg border-2 border-dashed border-primary/70" />
            </>
          )}
        </div>

        {erro ? <p className="text-sm text-destructive">{erro}</p> : null}

        <div className="flex flex-wrap gap-2">
          {captura ? (
            <>
              <Button variant="outline" className="gap-2" onClick={refazer}>
                <RefreshCw className="size-4" /> Refazer
              </Button>
              <Button className="gap-2" onClick={enviar}>
                <CheckCircle2 className="size-4" /> Usar esta foto
              </Button>
            </>
          ) : (
            <>
              <Button className="gap-2" disabled={!pronto} onClick={capturar}>
                <Camera className="size-4" /> Capturar agora
              </Button>
              <Button variant="outline" className="gap-2" onClick={trocarCamera}>
                <SwitchCamera className="size-4" /> Trocar câmera
              </Button>
            </>
          )}
        </div>

        <p className="flex items-start gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-primary" />
          A captura é feita ao vivo, sem upload de arquivos da galeria, para impedir fraude. A imagem
          é usada apenas na verificação de identidade (LGPD).
        </p>
      </DialogContent>
    </Dialog>
  );
}
