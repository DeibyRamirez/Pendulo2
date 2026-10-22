import type { SVGProps } from "react"

interface PropiedadesIconoPendulo extends SVGProps<SVGSVGElement> {
  className?: string
  tamano?: number | string
}

export function IconoPendulo({ className, tamano, ...propiedades }: PropiedadesIconoPendulo) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={tamano}
      height={tamano}
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
      {...propiedades}
    >
      <circle cx="12" cy="4" r="2" />
      <line x1="12" y1="6" x2="12" y2="16" />
      <circle cx="12" cy="18" r="3" fill="currentColor" />
    </svg>
  )
}
