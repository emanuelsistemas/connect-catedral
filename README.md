# Página de Acesso Remoto

![Status](https://img.shields.io/badge/status-produção-success)
![Versão](https://img.shields.io/badge/versão-1.0.0-blue)

Portal dedicado para download de ferramentas de acesso remoto, fornecendo uma interface limpa e intuitiva para usuários que precisam de suporte técnico.

**URL de Produção:** [ar.emasoftware.io](https://ar.emasoftware.io)

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Tecnologias Utilizadas](#tecnologias-utilizadas)
- [Requisitos](#requisitos)
- [Instalação e Configuração Local](#instalação-e-configuração-local)
- [Deploy](#deploy)
- [Manutenção](#manutenção)
- [Funcionalidades](#funcionalidades)
- [Contribuição](#contribuição)

## 📖 Visão Geral

Esta aplicação web fornece uma interface amigável para os usuários baixarem ferramentas de acesso remoto (RustDesk e AnyDesk), além de permitir contato direto com o suporte técnico via WhatsApp. O projeto utiliza HTML, CSS e JavaScript puros para uma implementação leve e eficiente.

### Funcionalidades principais:

- Download rápido de softwares de acesso remoto
- Cards interativos totalmente clicáveis
- Integração direta com WhatsApp para suporte técnico
- Design responsivo para desktop e dispositivos móveis
- Interface moderna e intuitiva

## 📁 Estrutura do Projeto

```
PAGINA_ACESSO_REMOTO/
├── public/                   # Arquivos estáticos públicos
│   ├── index.html            # Redirecionamento para static.html
│   ├── static.html           # Página principal com a interface
│   └── remote-access.svg     # Ícone da aplicação
├── src/                      # Código fonte (quando usando Vite/React)
│   ├── App.tsx               # Componente principal (React)
│   └── main.tsx              # Ponto de entrada (React)
├── node_modules/             # Dependências do projeto
├── vite.config.ts            # Configuração do Vite
├── package.json              # Dependências e scripts
├── nginx.conf                # Configuração Nginx para desenvolvimento
├── LICENSE                   # Licença do projeto
└── README.md                 # Esta documentação
```

## 🛠️ Tecnologias Utilizadas

- **HTML5**: Estrutura da página
- **CSS3**: Estilização, incluindo flexbox e grid para layout responsivo
- **JavaScript**: Interatividade da página
- **Google Fonts**: Fonte MuseoModerno para o rodapé
- **SVG**: Ícones vetoriais
- **Nginx**: Servidor web para servir a aplicação
- **Vite**: Configuração de desenvolvimento (opcionalmente)
- **React**: Framework para desenvolvimento (opcionalmente)

## ⚙️ Requisitos

Para desenvolvimento local:
- Node.js 14+
- npm ou yarn

Para produção:
- Servidor com Nginx
- Domínio configurado (opcional para SSL)
- Certificado SSL (recomendado)

## 🔧 Instalação e Configuração Local

### Usando o servidor HTTP Python para desenvolvimento rápido

```bash
# Clone o repositório
git clone https://github.com/emanuelsistemas/ar.git
cd ar

# Inicie um servidor HTTP Python
python3 -m http.server 5002
```

A aplicação estará disponível em: http://localhost:5002

### Usando Vite/React (configuração alternativa)

```bash
# Clone o repositório
git clone https://github.com/emanuelsistemas/ar.git
cd ar

# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento
npm run dev
```

A aplicação estará disponível em: http://localhost:5002

## 🚀 Deploy

### 1. Preparação do servidor

```bash
# Criação do diretório para a aplicação
sudo mkdir -p /var/www/ar.emasoftware.io

# Cópia dos arquivos para o diretório de produção
sudo cp -r /caminho/para/PAGINA_ACESSO_REMOTO/* /var/www/ar.emasoftware.io/

# Definição das permissões corretas
sudo chown -R www-data:www-data /var/www/ar.emasoftware.io
```

### 2. Configuração do Nginx

Crie um arquivo de configuração para o site:

```bash
sudo nano /etc/nginx/sites-available/ar.conf
```

Conteúdo do arquivo:

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

### 3. Ativação da configuração

```bash
# Crie um link simbólico para habilitar o site
sudo ln -s /etc/nginx/sites-available/ar.conf /etc/nginx/sites-enabled/

# Verifique a configuração do Nginx
sudo nginx -t

# Recarregue o Nginx para aplicar as alterações
sudo systemctl reload nginx
```

### 4. Configuração SSL (opcional mas recomendado)

Para configurar SSL com Let's Encrypt:

```bash
# Instale o Certbot
sudo apt install certbot python3-certbot-nginx

# Obtenha e configure o certificado
sudo certbot --nginx -d ar.emasoftware.io

# O Certbot modificará automaticamente o arquivo de configuração do Nginx
```

### ⚠️ Importante: Evitando problemas com HTTPS

**ATENÇÃO: Cuidado com certificados autoassinados**

Se você optar por não usar certificados válidos (como Let's Encrypt), é preferível manter o site apenas em HTTP em vez de usar certificados autoassinados. Certificados autoassinados causarão avisos de segurança nos navegadores e podem impedir o acesso ao site.

```nginx
# CONFIGURAÇÃO RECOMENDADA SEM SSL (melhor que usar certificados autoassinados)
server {
    listen 80;
    server_name ar.emasoftware.io;

    root /var/www/ar.emasoftware.io;
    index index.html static.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Enable gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

**PROBLEMAS CONHECIDOS:**
- Usar certificados autoassinados fará com que o site não seja acessível nos navegadores modernos sem adicionar exceções de segurança manualmente
- Redirecionamentos forçados para HTTPS com certificados inválidos bloqueiam totalmente o acesso ao site
- Use sempre certificados válidos (Let's Encrypt) para HTTPS ou mantenha o site em HTTP simples

## 🔄 Manutenção

### Atualização do código

```bash
# Clone ou atualize o repositório
git pull origin main

# Copie as alterações para o diretório de produção
sudo cp -r /caminho/para/PAGINA_ACESSO_REMOTO/* /var/www/ar.emasoftware.io/

# Atualize as permissões
sudo chown -R www-data:www-data /var/www/ar.emasoftware.io
```

### Modificação das ferramentas de acesso remoto

Para adicionar ou modificar as ferramentas disponíveis, edite o arquivo `/var/www/ar.emasoftware.io/public/static.html` e atualize os links de download e descrições.

### Atualização do número de suporte WhatsApp

O número do WhatsApp está configurado em duas partes do código:

1. Na seção de suporte técnico: `https://wa.me/5512974070713`
2. No texto exibido: `(12) 9 7406-0613`

Para alterar, modifique ambos no arquivo `/var/www/ar.emasoftware.io/public/static.html`.

## ✨ Funcionalidades

### Downloads de Ferramentas
- RustDesk: Software open-source para acesso remoto
- AnyDesk: Software comercial para acesso remoto

### Elementos Interativos
- Cards totalmente clicáveis para download
- Link direto para o WhatsApp

### Responsividade
- Adaptação automática para diferentes tamanhos de tela
- Layout otimizado para dispositivos móveis

## 🤝 Contribuição

Para contribuir com este projeto:

1. Faça um fork do repositório
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Faça commit das suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Faça push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está licenciado sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

Desenvolvido por [ema-software](https://emasoftware.io) © 2025
