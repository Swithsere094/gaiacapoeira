// Punto de entrada de producción para Hostinger (ver CLAUDE.md, gotcha
// "puertos locales bloqueados", 2026-09/10).
//
// Desde fines de septiembre de 2026 el hosting compartido de Hostinger
// bloquea las conexiones locales por TCP salvo en sus propios puertos, así que
// `next start` escuchando en 127.0.0.1:3000 queda inalcanzable para LiteSpeed
// (todas las rutas dinámicas responden 200 vacío). La salida es escuchar en un
// socket Unix. Este archivo arranca Next por su API programática, en el mismo
// proceso, para cubrir los dos mecanismos posibles:
//
//  1. lsnode.js de LiteSpeed hace require() de este archivo y reemplaza
//     http.Server.prototype.listen para escuchar en su propio socket: el
//     argumento que le pasemos se ignora, alcanza con llamar a listen().
//  2. Si el entorno pasa una ruta de socket en PORT (o en SOCKET_PATH), se
//     escucha directo ahí. `next start -p` solo acepta números, por eso hace
//     falta este archivo y no alcanza con cambiar el script "start".
//
// En local: `pnpm build && node server.js` (usa el puerto 3000 o PORT).

const http = require("node:http")
const fs = require("node:fs")
const next = require("next")

const target = process.env.SOCKET_PATH || process.env.PORT || "3000"
const isSocket = !/^\d+$/.test(target)

const app = next({ dev: false, dir: __dirname })
const handle = app.getRequestHandler()

app
  .prepare()
  .then(() => {
    // Un socket que quedó de un arranque anterior hace fallar listen() con
    // EADDRINUSE aunque no haya nadie escuchando.
    if (isSocket && fs.existsSync(target)) fs.unlinkSync(target)

    const server = http.createServer((req, res) => handle(req, res))
    server.listen(isSocket ? target : Number(target), () => {
      // Se loguea la dirección real, no la pedida: bajo lsnode no coinciden.
      const addr = server.address()
      const where = addr && typeof addr === "object" ? `puerto ${addr.port}` : `socket ${addr}`
      console.log(`> Next.js listo en ${where}`)
    })
  })
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
