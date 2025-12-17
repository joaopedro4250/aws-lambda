# AWS Lambda – Backend do Projeto Alerta Tubarão

Este repositório contém as **funções AWS Lambda** utilizadas como backend do projeto **Alerta Tubarão**, responsável pela lógica de negócio, autenticação e gerenciamento de dados da aplicação.

O projeto foi desenvolvido com foco educacional e prático, utilizando serviços da AWS em **ambiente sandbox**, seguindo boas práticas de segurança.

---

 Visão Geral

As funções Lambda expõem endpoints consumidos pela aplicação front-end desenvolvida em **React + Tailwind**, realizando operações como:

- Autenticação e controle de permissões
- Criação, listagem e gerenciamento de dados
- Validações de acesso (usuário comum x administrador)
- Integração com serviços AWS

---

 Arquitetura AWS

O backend utiliza os seguintes serviços:

- **AWS Lambda** – execução da lógica de negócio
- **API Gateway** – exposição das APIs HTTP
- **Variáveis de ambiente** – configuração de dados sensíveis
- **Controle de permissões** – acesso administrativo restrito

> As funções seguem o princípio do **menor privilégio** (least privilege), evitando permissões desnecessárias.

---

 Segurança e Acesso

- Não há credenciais sensíveis no código
- Nenhuma **AWS Access Key** ou **Secret Key** é exposta
- Dados sensíveis são configurados via **variáveis de ambiente**
- Algumas funcionalidades exigem **login administrativo**, por segurança e limitação do ambiente sandbox

---

##  Demonstração em Vídeo

Como parte das funcionalidades depende de autenticação administrativa, foi gravado um vídeo demonstrando o funcionamento completo do sistema:

 https://youtu.be/LT6900NCXwE

---

## 🛠️ Tecnologias Utilizadas

- Node.js
- AWS Lambda
- API Gateway
- JavaScript
- Variáveis de ambiente
- Integração com front-end em React

---

 Como Utilizar (Resumo)

1. Criar funções Lambda na AWS
2. Configurar as variáveis de ambiente necessárias
3. Conectar as funções ao API Gateway
4. Ajustar os endpoints conforme o front-end

Este repositório tem finalidade **educacional e demonstrativa**, não sendo um template pronto para produção sem ajustes adicionais.

---

 Projeto Relacionado (Front-end)

- **GitHub:** https://github.com/joaopedro4250/alerta-tubarao  
- **Vercel:** https://alerta-tubarao-h2sn4c5av-joaopedro4250s-projects.vercel.app
