# Documentação do Projeto ar.emasoftware.io

Este documento contém informações sobre as configurações do projeto de Acesso Remoto, incluindo portas, caminhos e configurações do NGINX.

## Estrutura de Portas

### Ambiente de Desenvolvimento

| Camada | Porta | Descrição |
|--------|-------|-----------|
| Cloudflare | 443 (HTTPS) | Gerencia o SSL/TLS e encaminha o tráfego para o servidor |
| NGINX (Produção) | 80 | Recebe o tráfego do Cloudflare e encaminha para a porta 3000 |
| NGINX (Local) | 3000 | Recebe o tráfego da porta 80 e encaminha para a porta 3001 |
| Servidor de Desenvolvimento (Vite) | 3001 | Servidor de desenvolvimento que serve o conteúdo do projeto |

### Ambiente de Produção (Atual)

| Camada | Porta | Descrição |
|--------|-------|-----------|
| Cloudflare | 443 (HTTPS) | Gerencia o SSL/TLS e encaminha o tráfego para o servidor |
| NGINX | 80 | Serve diretamente os arquivos estáticos do diretório /var/www/ar.emasoftware.io/public |

## Fluxo de Tráfego

### Ambiente de Desenvolvimento
```
Cloudflare (HTTPS) → NGINX (porta 80) → NGINX local (porta 3000) → Servidor Vite (porta 3001)
```

### Ambiente de Produção (Atual)
```
Cloudflare (HTTPS) → NGINX (porta 80) → Arquivos estáticos em /var/www/ar.emasoftware.io/public
```

## Arquivos de Configuração

### NGINX Principal (Porta 80)

**Arquivo**: `/etc/nginx/sites-available/ar.conf`

```nginx
server {
    listen 80;
    server_name ar.emasoftware.io;

    root /var/www/ar.emasoftware.io/public;
    index static.html index.html;

    location / {
        try_files $uri $uri/ /static.html;
    }

    # Enable gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    
    # Security headers
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options DENY;
    add_header X-XSS-Protection "1; mode=block";
}
```

### NGINX Local (Porta 3000)

**Arquivo**: `/etc/nginx/sites-available/ar-local.conf`

```nginx
server {
    listen 3000;
    server_name localhost;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Enable gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    
    # Security headers
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options DENY;
    add_header X-XSS-Protection "1; mode=block";
}
```

### Servidor de Desenvolvimento Vite (Porta 3001)

**Arquivo**: `/root/ema-software/PAGINA_ACESSO_REMOTO/vite.config.ts`

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'serve-static-html',
      configureServer(server) {
        server.middlewares.use((req: any, res: any, next: any) => {
          if (req.url === '/') {
            req.url = '/static.html';
          }
          next();
        });
      }
    }
  ],
  server: {
    port: 3001,
    host: true
  },
  base: '/',
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
```

## Caminhos Importantes

- **Código-fonte**: `/root/ema-software/PAGINA_ACESSO_REMOTO/`
- **Página principal**: `/root/ema-software/PAGINA_ACESSO_REMOTO/public/static.html`
- **Configuração do NGINX**: `/etc/nginx/sites-available/ar.conf` e `/etc/nginx/sites-available/ar-local.conf`
- **Configuração do Vite**: `/root/ema-software/PAGINA_ACESSO_REMOTO/vite.config.ts`

## Comandos Úteis

### Iniciar o Servidor de Desenvolvimento

```bash
cd /root/ema-software/PAGINA_ACESSO_REMOTO
npm run dev
```

### Verificar Status do NGINX

```bash
systemctl status nginx
```

### Reiniciar o NGINX

```bash
systemctl restart nginx
```

### Verificar Portas em Uso

```bash
ss -tulpn | grep 3000  # Verificar porta 3000
ss -tulpn | grep 3001  # Verificar porta 3001
ss -tulpn | grep 80    # Verificar porta 80
```

### Build para Produção

```bash
cd /root/ema-software/PAGINA_ACESSO_REMOTO
npm run build
```

O resultado do build será gerado no diretório `dist/` e deverá ser copiado para `/var/www/ar.emasoftware.io/public/` para ser servido pelo NGINX.

## Observações

- O Cloudflare gerencia o SSL/TLS para o domínio ar.emasoftware.io, por isso não há configuração SSL direta no servidor.
- A página principal servida é `static.html`, que contém o código HTML para a página de ferramentas de acesso remoto.
- O servidor de desenvolvimento Vite está configurado para redirecionar a raiz (`/`) para `/static.html`.

## Alternando Entre Ambientes

### De Produção para Desenvolvimento

Para alternar do ambiente de produção para o ambiente de desenvolvimento:

1. Modificar o arquivo de configuração do NGINX:
```bash
sudo nano /etc/nginx/sites-available/ar.conf
```

2. Alterar a configuração para usar proxy_pass:
```nginx
server {
    listen 80;
    server_name ar.emasoftware.io;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    # ... resto da configuração ...
}
```

3. Reiniciar o NGINX:
```bash
sudo systemctl restart nginx
```

4. Iniciar o servidor de desenvolvimento:
```bash
cd /root/ema-software/PAGINA_ACESSO_REMOTO
npm run dev
```

### De Desenvolvimento para Produção

Para alternar do ambiente de desenvolvimento para o ambiente de produção:

1. Parar o servidor de desenvolvimento (Ctrl+C no terminal onde está rodando)

2. Fazer o build do projeto:
```bash
cd /root/ema-software/PAGINA_ACESSO_REMOTO
npm run build
```

3. Copiar os arquivos para o diretório de produção:
```bash
sudo cp -r dist/* /var/www/ar.emasoftware.io/public/
```

4. Modificar o arquivo de configuração do NGINX:
```bash
sudo nano /etc/nginx/sites-available/ar.conf
```

5. Alterar a configuração para servir arquivos estáticos:
```nginx
server {
    listen 80;
    server_name ar.emasoftware.io;

    root /var/www/ar.emasoftware.io/public;
    index static.html index.html;

    location / {
        try_files $uri $uri/ /static.html;
    }
    
    # ... resto da configuração ...
}
```

6. Reiniciar o NGINX:
```bash
sudo systemctl restart nginx
```
