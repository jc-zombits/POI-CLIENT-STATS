import Link from "next/link";
import NavigationBar from "./NavBar";

export default function MainContent() {
  return (
    <div
      className="w-screen h-screen bg-cover bg-center bg-no-repeat relative"
      style={{ backgroundImage: "url('../que_pato.jpg')" }}
    >
      <NavigationBar />
      
      {/* Fondo oscuro semitransparente */}
      <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center">
        {/* Título principal */}
        <h1 className="text-4xl font-bold text-white mb-12">POI Financiero</h1>
      </div>
    </div>
  );
}