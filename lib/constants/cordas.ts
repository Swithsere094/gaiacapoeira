// IDs deben coincidir exactamente con los nombres de archivo en public/Cuerda x cuerda/
export const CORDAS = [
  { id: "batizado",           label: "Batizado" },
  { id: "Mirim1",             label: "Mirim 1" },
  { id: "Mirim2",             label: "Mirim 2" },
  { id: "Mirim3",             label: "Mirim 3" },
  { id: "Mirim4",             label: "Mirim 4" },
  { id: "Mirim5",             label: "Mirim 5" },
  { id: "mirim6",             label: "Mirim 6" },
  { id: "Mirim7",             label: "Mirim 7" },
  { id: "aluno_iniciante_1",  label: "Aluno Iniciante 1" },
  { id: "aluno_iniciante_2",  label: "Aluno Iniciante 2" },
  { id: "aluno_confirmado_1", label: "Aluno Confirmado 1" },
  { id: "aluno_confirmado_2", label: "Aluno Confirmado 2" },
  { id: "graduado",           label: "Graduado" },
  { id: "monitor_1",          label: "Monitor 1" },
  { id: "Monitor_2",          label: "Monitor 2" },
  { id: "instruror_1",        label: "Instrutor 1" },
  { id: "instrutor_2",        label: "Instrutor 2" },
  { id: "professor_1",        label: "Professor 1" },
  { id: "professor_2",        label: "Professor 2" },
  { id: "contramestre_1",     label: "Contramestre 1" },
  { id: "contramestre_2",     label: "Contramestre 2" },
  { id: "mestre",             label: "Mestre" },
  { id: "grao_mestre",        label: "Grão-Mestre" },
  { id: "estagiario",         label: "Estagiário" },
] as const

export type CordaId = typeof CORDAS[number]["id"]

export function getCordaSrc(id: string | null | undefined): string | null {
  if (!id) return null
  return `/Cuerda x cuerda/${id}.png`
}
