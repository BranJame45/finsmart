import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center w-full h-[70vh] gap-4">
      <div className="relative">
        <div className="absolute inset-0 rounded-full blur-md bg-emerald-500/20 animate-pulse"></div>
        <Loader2 className="w-12 h-12 text-emerald-600 animate-spin relative z-10" />
      </div>
      <p className="text-gray-500 font-medium animate-pulse">Cargando módulo...</p>
    </div>
  );
}
