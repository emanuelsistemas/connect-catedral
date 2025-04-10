module.exports = {
  apps : [{
    name   : "pagina-acesso-remoto",
    script : "npm",
    args   : "run dev",
    cwd    : "/root/ema-software/PAGINA_ACESSO_REMOTO",
    watch  : false,
    env: {
      "NODE_ENV": "development",
    },
    max_memory_restart: "200M",
    restart_delay: 3000,
    autorestart: true
  }]
}
