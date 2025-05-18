Aplicativo Web para Mídias Sociais
Visão Geral
Este projeto é um aplicativo web do lado do cliente que simula uma plataforma de mídia social, construído principalmente com JavaScript, HTML e CSS. O arquivo script.js contém a lógica principal para autenticação de usuários, gerenciamento de perfis, comentários, enquetes, notificações e interações sociais, como seguir, curtir e salvar postagens. A persistência de dados é obtida usando o localStorage do navegador.
Principais Recursos

Autenticação de Usuário: Login, logout e troca de conta com acesso baseado em funções (usuário, moderador, administrador).
Gerenciamento de Perfis: Os usuários podem editar seu nome de usuário, identificador, biografia, foto de perfil e imagem de capa.
Sistema de Comentários: Os usuários podem postar comentários, responder a comentários, editar ou excluir seus próprios comentários e fixar comentários/respostas.
Enquetes: Crie, vote e gerencie enquetes com expiração e insights.
Interações Sociais: Siga/deixe de seguir usuários, curta comentários, salve postagens, silencie/bloqueie usuários e denuncie conteúdo.
Notificações: Notificações em tempo real para menções, respostas, seguidores e atualizações de enquetes.
Modo Escuro: Alterne entre temas claros e escuros, persistentes em todas as sessões.
Moderação de Conteúdo: Denunciar comentários/usuários, ocultar comentários e gerenciar conteúdo sensível.
Postagens Salvas: Salvar e visualizar postagens em uma seção dedicada.
Abas de Perfil: Visualizar postagens de usuários, respostas, destaques, mídias e conteúdo curtido.
Perfis Privados: Suporte para perfis públicos/privados com solicitações de seguidores.

Estrutura do Projeto
├── index.html # Arquivo HTML principal
├── styles.css # Estilos CSS (presumidos, não fornecidos)
├── script.js # Lógica JavaScript principal (fornecida)
├── login.html # Página de login (referenciada no código)
├── communities.html # Página de comunidades (referenciada no código)
├── assets/ # Pasta para imagens (ex.: avatares, capas)
└── README.md # Este arquivo

Pré-requisitos

Um navegador web moderno (Chrome, Firefox, Edge, etc.).
Sem dependências do lado do servidor; o aplicativo roda inteiramente no navegador.
Font Awesome para ícones (presumidamente incluído via CDN em HTML).
Conhecimento básico de HTML, CSS e JavaScript para personalização.

Instalação

Clone ou Baixe o Repositório:
git clone <url-do-repositório>

Ou baixe os arquivos do projeto manualmente.

Configurando um Servidor Local (recomendado para evitar problemas de CORS com file://): Use um servidor HTTP simples, como:
python -m http.server 8000

Ou use uma extensão como o Live Server no VS Code.

Abra o Aplicativo: Navegue até http://localhost:8000 no seu navegador para acessar index.html.

Verifique as Dependências:

Inclua o Font Awesome no seu HTML (por exemplo, via CDN):<script src="https://kit.fontawesome.com/your-kit-id.js" crossorigin="anonymous"></script>

Certifique-se de que styles.css esteja vinculado e contenha os estilos necessários (não fornecidos no script).

Uso

Login:

Acesse login.html para efetuar login com um dos usuários predefinidos (armazenados no localStorage).

Exemplos de credenciais:
Nome de usuário: amy@gmail.com, Senha: Isabel123@ (moderador)
Nome de usuário: maxblagun, Senha: 123456 (usuário)

Interaja com a plataforma:

Postar comentários: Use a entrada de comentários para postar texto, imagens ou enquetes.
Seguir usuários: Visite o perfil de um usuário para seguir/deixar de seguir ou enviar solicitações de seguimento para perfis privados.
Gerenciar perfil: Edite sua biografia, nome de usuário, identificador, foto de perfil ou imagem de capa na coluna de perfil.
Salvar postagens: Clique no ícone de favoritos para salvar postagens, visível na seção "Itens salvos".
Criar enquetes: Adicione enquetes com até 10 opções, defina a expiração e visualize as informações dos eleitores.
Notificações: Veja notificações de menções, respostas e solicitações de seguimento na coluna de notificações.

Alternar modo escuro:

Clique no botão de alternância do modo escuro para alternar os temas, salvos no localStorage.

Moderação (para moderadores/administradores):

Revise relatórios e tome medidas (por exemplo, ocultar ou excluir o conteúdo denunciado).

Estrutura do Código
O arquivo script.js é organizado em várias seções principais:

Inicialização:

Configura o localStorage para usuários, comentários, perfis, notificações e relatórios.
Inicializa o usuário atual e restaura as configurações do tema.
Vincula ouvintes de eventos para elementos DOM (por exemplo, envio de comentários, upload de imagens).

Gerenciamento de Usuários:

Funções como updateUserInfoDisplay, saveUsernameAndHandle e updateUserAvatar gerenciam as atualizações de perfil.
logout e switchAccount gerenciam a autenticação.

Sistema de Comentários:

renderComments e createCommentElement geram o feed de comentários.
Funções como sendComment, editComment, deleteComment, pinComment e savePost gerenciam as interações dos comentários.

Enquetes:

createPollComment, voteInPoll, showVoters e checkExpiredPolls gerenciam a criação e a votação de enquetes.

Interações Sociais:

toggleFollow, sendFollowRequest, acceptFollowRequest e blockUser gerenciam relacionamentos de seguidores e interações do usuário.

Notificações:

addNotification, renderNotifications e addPersistentNotification gerenciam o sistema de notificações.

Gerenciamento de Perfis:

showProfilePage, updateProfileContent e toggleProfileColumn gerenciam a renderização e a edição de perfis.

Utilitários:

Funções como timeAgo, formatNumber, escapeHTML, a
