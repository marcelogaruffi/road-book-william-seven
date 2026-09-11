
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { setConfirmFn } from "@/lib/custom-confirm";
import { AlertCircle } from "lucide-react";

export function GlobalConfirmDialog() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [resolvePromise, setResolvePromise] = useState<((val: boolean) => void) | null>(null);

  useEffect(() => {
    setConfirmFn((msg) => {
      setMessage(msg);
      setOpen(true);
      return new Promise((resolve) => {
        setResolvePromise(() => resolve);
      });
    });
  }, []);

  const handleClose = (result: boolean) => {
    setOpen(false);
    if (resolvePromise) resolvePromise(result);
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && handleClose(false)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertCircle className="size-5" />
            Confirmação
          </DialogTitle>
        </DialogHeader>
        <div className="py-4 text-slate-700 dark:text-slate-300">
          {message}
        </div>
        <DialogFooter className="flex space-x-2 justify-end">
          <Button variant="outline" onClick={() => handleClose(false)}>Cancelar</Button>
          <Button variant="destructive" onClick={() => handleClose(true)}>Confirmar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
