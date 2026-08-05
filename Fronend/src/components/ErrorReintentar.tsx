export default function ErrorReintentar({ mensaje, onReintentar }: { mensaje: string; onReintentar: () => void }) {
  return (
    <main className="wide">
      <p role="alert">{mensaje}</p>
      <button type="button" className="secondary" onClick={onReintentar}>
        Reintentar
      </button>
    </main>
  );
}
