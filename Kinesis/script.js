document.addEventListener("DOMContentLoaded", () => {
    // Restaurar o estado do dark mode
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode'); 
    }
    document.querySelector('.add-comment .avatar').src = currentUser.avatar; 
    userProfileAvatar.src = currentUser.avatar;
    document.querySelector('.sidebar-logo .logo').src = currentUser.avatar;
    renderComments();
    renderTrending();
    updateUserInfo();
    updateUnreadCount();

    // Vincular eventos
    document.getElementById("upload-image").addEventListener("click", uploadImage);
    document.getElementById("send-comment").addEventListener("click", sendComment);
    document.getElementById("cancel-comment").addEventListener("click", cancelComment);

    // Configurar contador de caracteres
    setupCharCounter(document.getElementById("new-comment"), "char-count");
});

let users = JSON.parse(localStorage.getItem('users')) || [
    { username: "amy@gmail.com", handle: "@AmyR", avatar: "placeholder-profile-image.png", password: "Isabel123@", role: "moderator" },
    { username: "maxblagun", handle: "@MaxB", avatar: "placeholder-profile-image.png", password: "123456", role: "user" },
    { username: "ramsesmiron", handle: "@RamsesM", avatar: "placeholder-profile-image.png", password: "123456", role: "admin" },
    { username: "juliusomo", handle: "@JuliusO", avatar: "placeholder-profile-image.png", password: "123456", role: "user" },
    { username: "sarahkane", handle: "@SarahK", avatar: "placeholder-profile-image.png", password: "123456", role: "user" }
];

let currentUser = null;
const storedCurrentUser = JSON.parse(localStorage.getItem('currentUser'));
if (storedCurrentUser && storedCurrentUser.id && storedCurrentUser.email) {
    currentUser = {
        id: storedCurrentUser.id,
        email: storedCurrentUser.email,
        username: storedCurrentUser.username,
        avatar: storedCurrentUser.avatar || "./default-avatar.png",
        handle: storedCurrentUser.handle || `@${storedCurrentUser.username}`,
        role: storedCurrentUser.role || "user"
    };
    let userProfile = JSON.parse(localStorage.getItem(`userProfile_${currentUser.id}`)) || {
        id: currentUser.id,
        points: 0,
        badges: [],
        bio: "",
        rawBio: "",
        profilePic: currentUser.avatar,
        coverPic: "./default-cover.png",
        themeColor: "#1DA1F2",
        joinDate: new Date().toISOString(),
        following: 0,
        followers: 0,
        followingList: [],
        followersList: [],
        visibility: "public",
        pendingRequests: [],
        savedPosts: [],
        hiddenComments: [],
        muted: [],
        blocked: [],
        lists: { "Favoritos": [], "Amigos": [] }
    };
    currentUser.avatar = userProfile.profilePic;
    localStorage.setItem(`userProfile_${currentUser.id}`, JSON.stringify(userProfile));
} else {
    currentUser = {
        id: null,
        email: null,
        username: null,
        avatar: "./default-avatar.png",
        role: "guest"
    };
}

function updateUserInfoDisplay() {
    const userProfileContainer = document.querySelector('.user-profile');
    if (!userProfileContainer) {
        console.error("Container do perfil de usuário não encontrado.");
        return;
    }

    // Garantir que currentUser esteja definido
    const user = currentUser || { username: 'Visitante', avatar: 'https://via.placeholder.com/40' };
    
    // Definir o handle com base em currentUser
    const handle = user.handle || `@${user.username || 'Visitante'}`;

    // Obter o perfil do usuário do localStorage
    const userProfile = JSON.parse(localStorage.getItem(`userProfile_${user.id}`)) || {
        accountType: "common"
    };

    // Determinar o ícone do tipo de conta
    let accountTypeIcon = '';
    if (userProfile.accountType === 'business') {
        accountTypeIcon = '<i class="fa-solid fa-certificate" style="color: #caa607;"></i> ';
    } else if (userProfile.accountType === 'authority') {
        accountTypeIcon = '<i class="fa-solid fa-certificate" style="color: #1da1f2;"></i> ';
    }

    // Verificar o estado atual do menu more-menus
    const moreMenus = document.querySelector('#more-menus');
    const isMenuVisible = moreMenus ? moreMenus.style.display === 'block' : false;

    // Atualizar o HTML do contêiner
    userProfileContainer.innerHTML = `
        <img src="${user.avatar || 'https://via.placeholder.com/40'}" alt="Avatar do Usuário" class="avatar">
        <div class="user-info">
            <span class="username" id="user-info-username">${user.username || 'Visitante'}${accountTypeIcon}</span>
            <span class="handle" id="user-info-handle">${handle}</span>
        </div>
        <button class="more-buttons" onclick="toggleMoreMenus(event)">⋯</button>
        <div class="more-menus" id="more-menus" style="display: ${isMenuVisible ? 'block' : 'none'};">
            <button class="menu-item" onclick="logout(event)">Sair de ${handle}<i class="fa-solid fa-right-from-bracket"></i></button>
            <button class="menu-item" onclick="switchAccount(event)">Trocar de conta<i class="fa-solid fa-circle-user"></i></button>
        </div>
    `;

    // Reaplicar evento de clique no user-profile
    userProfileContainer.onclick = () => showProfilePage(user);
}

document.addEventListener("DOMContentLoaded", () => {
    updateUserInfoDisplay(); // Atualiza ao carregar a página
    renderComments(); // Já estava no seu código
    renderTrending(); // Já estava no seu código
    updateUserInfo(); // Já estava no seu código
    updateUnreadCount(); // Já estava no seu código
});
function toggleMoreMenus(event) {
    event.stopPropagation(); // Impede que o clique no botão dispare o evento do user-profile
    const menu = document.getElementById('more-menus');
    menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
}

function switchAccount(event) {
    event.stopPropagation(); // Impede propagação do clique
    localStorage.removeItem('currentUser'); // Remove o usuário atual
    window.location.href = 'login.html'; // Redireciona para a página de login
    addNotification('Pronto para trocar de conta.');
}

// Fecha o menu ao clicar fora dele
document.addEventListener('click', (event) => {
    const menu = document.getElementById('more-menus');
    const moreButton = document.querySelector('.more-buttons');
    if (menu && !menu.contains(event.target) && !moreButton.contains(event.target)) {
        menu.style.display = 'none';
    }
});
function updateFollowRelationship(currentUserId, targetUserId, follow) {
    let currentUserProfile = JSON.parse(localStorage.getItem(`userProfile_${currentUserId}`)) || {
        userId: currentUserId,
        username: getUsernameByUserId(currentUserId) || "Usuário desconhecido",
        followingList: [],
        following: 0
    };
    let targetUserProfile = JSON.parse(localStorage.getItem(`userProfile_${targetUserId}`)) || {
        userId: targetUserId,
        username: getUsernameByUserId(targetUserId) || "Usuário desconhecido",
        followersList: [],
        followers: 0
    };

    // Inicializar listas
    currentUserProfile.followingList = Array.isArray(currentUserProfile.followingList) ? currentUserProfile.followingList : [];
    targetUserProfile.followersList = Array.isArray(targetUserProfile.followersList) ? targetUserProfile.followersList : [];

    console.log(`Antes da atualização - followingList de ${currentUserId}:`, currentUserProfile.followingList);
    console.log(`Antes da atualização - followersList de ${targetUserId}:`, targetUserProfile.followersList);

    if (follow) {
        if (!currentUserProfile.followingList.includes(targetUserId)) {
            currentUserProfile.followingList.push(targetUserId);
        }
        if (!targetUserProfile.followersList.includes(currentUserId)) {
            targetUserProfile.followersList.push(currentUserId);
        }
    } else {
        currentUserProfile.followingList = currentUserProfile.followingList.filter(id => id !== targetUserId);
        targetUserProfile.followersList = targetUserProfile.followersList.filter(id => id !== currentUserId);
    }

    currentUserProfile.following = currentUserProfile.followingList.length;
    targetUserProfile.followers = targetUserProfile.followersList.length;

    console.log(`Após a atualização - followingList de ${currentUserId}:`, currentUserProfile.followingList);
    console.log(`Após a atualização - followersList de ${targetUserId}:`, targetUserProfile.followersList);

    try {
        localStorage.setItem(`userProfile_${currentUserId}`, JSON.stringify(currentUserProfile));
        localStorage.setItem(`userProfile_${targetUserId}`, JSON.stringify(targetUserProfile));
    } catch (e) {
        console.error("Erro ao salvar no localStorage:", e);
        addNotification(e.name === "QuotaExceededError"
            ? "Armazenamento cheio! Limpe alguns dados ou use outro navegador."
            : "Erro ao atualizar relação de seguir. Tente novamente.");
        throw e;
    }
}

// Função toggleFollow atualizada para usar userId
function toggleFollow(targetUserId, button) {
    if (!currentUser.userId) {
        addLoginRequiredNotification("follow");
        return;
    }
    if (!isValidUser(targetUserId)) {
        addNotification("Usuário inválido!");
        return;
    }

    const currentUserProfile = JSON.parse(localStorage.getItem(`userProfile_${currentUser.userId}`)) || userProfile;
    const isFollowing = currentUserProfile.followingList.includes(targetUserId);

    updateFollowRelationship(currentUser.userId, targetUserId, !isFollowing);

    button.textContent = isFollowing ? "Seguir" : "Deixar de seguir";
    const targetUsername = getUsernameByUserId(targetUserId);
    showProfilePage({ userId: targetUserId, username: targetUsername });
}

// Função para sincronizar listas de seguindo e seguidores ao carregar
function syncFollowLists(userId) {
    let profile = JSON.parse(localStorage.getItem(`userProfile_${userId}`)) || {
        followingList: [],
        followersList: []
    };
    profile.followingList = Array.isArray(profile.followingList) ? profile.followingList : [];
    profile.followersList = Array.isArray(profile.followersList) ? profile.followersList : [];

    // Verificar followingList
    profile.followingList = profile.followingList.filter(followedId => {
        const followedProfile = JSON.parse(localStorage.getItem(`userProfile_${followedId}`)) || { followersList: [] };
        return followedProfile.followersList.includes(userId);
    });

    // Verificar followersList
    profile.followersList = profile.followersList.filter(followerId => {
        const followerProfile = JSON.parse(localStorage.getItem(`userProfile_${followerId}`)) || { followingList: [] };
        return followerProfile.followingList.includes(userId);
    });

    profile.following = profile.followingList.length;
    profile.followers = profile.followersList.length;

    try {
        localStorage.setItem(`userProfile_${userId}`, JSON.stringify(profile));
    } catch (e) {
        console.error("Erro ao salvar no localStorage:", e);
        addNotification(e.name === "QuotaExceededError"
            ? "Armazenamento cheio! Limpe alguns dados ou use outro navegador."
            : "Erro ao sincronizar listas de seguidores. Tente novamente.");
    }
}
function saveUsernameAndHandle() {
    const newUsername = document.getElementById('edit-username').value.trim();
    let newHandle = document.getElementById('edit-handle').value.trim();
    if (!newHandle.startsWith('@')) newHandle = '@' + newHandle;

    // Validação básica
    if (!newUsername || !newHandle) {
        addNotification("Nome de usuário e handle não podem estar vazios!");
        return;
    }

    // Atualiza currentUser
    const oldUsername = currentUser.username;
    currentUser.username = newUsername;
    currentUser.handle = newHandle;

    // Atualiza o array users
    let users = JSON.parse(localStorage.getItem('users')) || [];
    const userIndex = users.findIndex(u => u.id === currentUser.id);
    if (userIndex !== -1) {
        users[userIndex].username = newUsername;
        users[userIndex].handle = newHandle;
    } else {
        console.error("Usuário não encontrado no array users:", currentUser.id);
        addNotification("Erro ao atualizar o usuário. Tente novamente.");
        return;
    }
    localStorage.setItem('users', JSON.stringify(users));

    // Atualiza userProfile
    let userProfile = JSON.parse(localStorage.getItem(`userProfile_${currentUser.id}`)) || {};
    userProfile.username = newUsername;
    userProfile.handle = newHandle;
    localStorage.setItem(`userProfile_${currentUser.id}`, JSON.stringify(userProfile));

    // Atualiza currentUser no localStorage
    localStorage.setItem('currentUser', JSON.stringify(currentUser));

    // Atualiza comentários para refletir o novo username e handle
    comments = comments.map(comment => {
        if (comment.userId === currentUser.id) {
            return {
                ...comment,
                username: newUsername,
                handle: newHandle
            };
        }
        return comment;
    });

    saveData();
    updateUserInfoDisplay();
    addNotification("Nome de usuário e handle atualizados com sucesso!");
}

function logout(event) {
    event.stopPropagation();
    localStorage.removeItem('currentUser');
    window.location.href = 'login.html';
    addNotification('Você saiu da conta.');
}
// Load data from localStorage or initialize
let comments = JSON.parse(localStorage.getItem("comments")) || [];

comments = comments.map(comment => ({
    ...comment,
    views: comment.views !== undefined ? comment.views : 0,
    retweets: comment.retweets !== undefined ? comment.retweets : 0,
    savedBy: Array.isArray(comment.savedBy) ? comment.savedBy : []
}));
localStorage.setItem("comments", JSON.stringify(comments)); 

let userProfile = JSON.parse(localStorage.getItem(`userProfile_${currentUser.username}`)) || {};
userProfile = {
    points: userProfile.points || 0,
    badges: Array.isArray(userProfile.badges) ? userProfile.badges : [],
    bio: userProfile.bio || " ",
    rawBio: userProfile.rawBio || "",
    profilePic: userProfile.profilePic || currentUser.avatar || "./default-avatar.png",
    coverPic: userProfile.coverPic || "./default-cover.png",
    themeColor: userProfile.themeColor || "#1DA1F2",
    joinDate: userProfile.joinDate || new Date().toISOString(),
    following: userProfile.following || 0,
    followers: userProfile.followers || 0,
    followingList: Array.isArray(userProfile.followingList) ? userProfile.followingList : [],
    followersList: Array.isArray(userProfile.followersList) ? userProfile.followersList : [],
    visibility: userProfile.visibility || "public",
    pendingRequests: Array.isArray(userProfile.pendingRequests) ? userProfile.pendingRequests : [],
    savedPosts: Array.isArray(userProfile.savedPosts) ? userProfile.savedPosts : [],
    hiddenComments: Array.isArray(userProfile.hiddenComments) ? userProfile.hiddenComments : [],
    muted: Array.isArray(userProfile.muted) ? userProfile.muted : [],
    blocked: Array.isArray(userProfile.blocked) ? userProfile.blocked : [],
    lists: userProfile.lists || { "Favoritos": [], "Amigos": [] },
    website: userProfile.website || "",
    location: userProfile.location || ""
};
localStorage.setItem(`userProfile_${currentUser.username}`, JSON.stringify(userProfile));

let reports = JSON.parse(localStorage.getItem("reports")) || [];
let notifications = JSON.parse(localStorage.getItem("notifications")) || [];

// DOM elements (adicionar o avatar do sidebar)
const userProfileAvatar = document.querySelector('.user-profile .avatar'); 
const commentsContainer = document.getElementById("comments");
const newCommentInput = document.getElementById("new-comment");
const sendCommentBtn = document.getElementById("send-comment");
const cancelCommentBtn = document.getElementById("cancel-comment");
const imageUpload = document.getElementById("image-upload");
const uploadImageBtn = document.getElementById("upload-image");
const previewToggleBtn = document.getElementById("preview-toggle");
const commentPreview = document.getElementById("comment-preview");
const darkModeToggle = document.getElementById("dark-mode-toggle");
const searchInput = document.getElementById("search");
const pointsDisplay = document.getElementById("points");
const notificationsPanel = document.getElementById("notifications-panel");
const unreadCount = document.getElementById("unread-count");
const notificationsColumn = document.getElementById("notifications-column");
const profileColumn = document.getElementById("profile-column");

function updateUserAvatar(newAvatar) {
    const avatarToUse = newAvatar || "./default-avatar.png";
    currentUser.avatar = avatarToUse;
    userProfile.profilePic = avatarToUse;

    // Atualizar comments antes de salvar
    comments = comments.map(comment => {
        if (comment.userId === currentUser.id) {
            return { ...comment, avatar: avatarToUse };
        }
        return comment;
    });

    // Salvar no localStorage
    try {
        localStorage.setItem(`userProfile_${currentUser.id}`, JSON.stringify(userProfile));
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        localStorage.setItem("comments", JSON.stringify(comments));
    } catch (e) {
        console.error("Erro ao salvar no localStorage:", e);
        if (e.name === "QuotaExceededError") {
            addNotification("Armazenamento cheio! Limpe alguns dados ou use outro navegador.");
        }
        return;
    }

    // Atualizar todos os elementos de avatar
    updateAllAvatars();
    renderComments();
    addNotification("Avatar atualizado com sucesso!");
}

document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
        this.classList.add('active');
        const label = this.getAttribute('data-label');
        handleMenuAction(label);
    });
});

document.querySelector('.post-button').addEventListener('click', () => {
    newCommentInput.focus();
    newCommentInput.scrollIntoView(scrollIntoViewOptions); 
    addNotification('Pronto para postar algo novo!');
});

function updateAllAvatars() {
    const avatarToUse = userProfile.profilePic || currentUser.avatar || "./default-avatar.png";

    // Atualizar avatares em elementos estáticos
    document.querySelectorAll('.user-profile .avatar, .add-comment .avatar, .sidebar-logo .logo')
        .forEach(el => el.src = avatarToUse);

    // Atualizar avatares nos comentários
    document.querySelectorAll('.comment .avatar').forEach(el => {
        const commentUserId = el.closest('.comment').querySelector('.username').dataset.userId;
        if (commentUserId === currentUser.id) {
            el.src = avatarToUse;
        }
    });

    // Atualizar coluna de perfil
    if (profileColumn.classList.contains('visible')) {
        updateProfileColumn();
    }

    // Atualizar página de perfil
    const profileContainer = document.querySelector('.profile-container');
    if (profileContainer && profileContainer.querySelector('.profile-username').dataset.userId === currentUser.id) {
        profileContainer.querySelector('.profile-avatar').src = avatarToUse;
    }

    // Atualizar notificações
    if (notificationsColumn.classList.contains('visible')) {
        renderNotifications();
    }

    // Atualizar modal de imagem postada, se aberto
    const postedImageModal = document.getElementById("posted-image-modal");
    if (postedImageModal && postedImageModal.style.display === "flex") {
        const modalComments = document.getElementById("posted-modal-comments");
        const comment = findCommentByPath(modalComments.dataset.commentPath);
        if (comment && comment.userId === currentUser.id) {
            renderModalComments(comment, modalComments);
        }
    }
}

// Função para salvar dados
function saveData() {
    try {
        localStorage.setItem("comments", JSON.stringify(comments));
        localStorage.setItem(`userProfile_${currentUser.username}`, JSON.stringify(userProfile));
        localStorage.setItem("reports", JSON.stringify(reports));
        localStorage.setItem("notifications", JSON.stringify(notifications));
        localStorage.setItem("currentUser", JSON.stringify(currentUser));
    } catch (e) {
        console.error("Erro ao salvar no localStorage:", e);
        if (e.name === "QuotaExceededError") {
            showGenericConfirmationModal(
                "Erro de Armazenamento",
                "Armazenamento local cheio. Limpe alguns dados ou use outro navegador.",
                null,
                "OK",
                null,
                false
            );
        }
        throw e;
    }
}


function openImageModal(imageSrc) {
    const modal = document.getElementById("image-modal");
    if (!modal) {
        console.error("Modal de imagem não encontrado no DOM.");
        addNotification("Erro: Não foi possível abrir a visualização da imagem.");
        return;
    }
    const modalImage = modal.querySelector('img');
    if (!modalImage) {
        console.error("Elemento de imagem não encontrado no modal.");
        addNotification("Erro: Não foi possível carregar a imagem no modal.");
        return;
    }
    modalImage.src = imageSrc;
    modal.style.display = 'block';
}
// Funções utilitárias
function timeAgo(timestamp) {
    const now = new Date();
    const commentTime = new Date(timestamp);
    const diffInSeconds = Math.floor((now - commentTime) / 1000);
    if (diffInSeconds < 60) return `há ${diffInSeconds}s`;
    const minutes = Math.floor(diffInSeconds / 60);
    if (minutes < 60) return `há ${minutes}min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `há ${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `há ${days}d`;
    const months = Math.floor(days / 30);
    if (months < 12) return `há ${months}m`;
    const years = Math.floor(months / 12);
    return `${years}a`;
}

function countReplies(replies) {
    if (!replies) return 0;
    let count = replies.length;
    replies.forEach(reply => {
        if (reply.replies) count += countReplies(reply.replies);
    });
    return count;
}

document.addEventListener("DOMContentLoaded", () => {
    console.log("Estado inicial de comments:", comments);
    userProfileAvatar.src = currentUser.avatar;
    document.querySelector('.sidebar-logo .logo').src = currentUser.avatar;
    renderComments();
    renderTrending();
    updateUserInfo();
    updateUnreadCount();
});

function renderComments() {
    if (!commentsContainer) {
        console.error("Container de comentários não encontrado.");
        return;
    }
    commentsContainer.innerHTML = "";
    const filteredComments = comments.filter(comment => {
        if (comment.poll) {
            return comment.poll.options.every(opt => opt.text && typeof opt.text === 'string');
        }
        const commentUserProfile = JSON.parse(localStorage.getItem(`userProfile_${comment.username}`)) || { visibility: "public" };
        return (
            commentUserProfile.visibility === "public" ||
            comment.username === currentUser.username ||
            userProfile.followingList.includes(comment.username)
        ) && !(userProfile.hiddenComments || []).includes(comment.id);
    });

    filteredComments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    filteredComments.forEach(comment => {
        console.log(`Renderizando comentário com ID: ${comment.id}`);
        comment.views = (comment.views || 0) + 1; // Incrementa visualizações
        const commentElement = createCommentElement(comment, comment.id);
        commentsContainer.appendChild(commentElement);
    });
    saveData();
    updateCommentOfTheDay();
    updateUserInfo();
    renderTrending();
    updateBadgesUI();
}
function addPersistentNotification(message, type = "general", options = {}) {
    let notifications = JSON.parse(localStorage.getItem(`notifications_${currentUser.username}`)) || [];
    const notification = {
        id: Date.now(),
        avatar: userProfile.profilePic || "https://via.placeholder.com/32",
        message,
        timestamp: new Date().toISOString(),
        read: false,
        type,
        ...options // Permite adicionar campos adicionais como requester, sender, etc.
    };
    notifications.unshift(notification); // Adiciona no início da lista
    localStorage.setItem(`notifications_${currentUser.username}`, JSON.stringify(notifications));
    renderNotifications(); // Atualiza a coluna imediatamente
}

function createTrendingCommentElement(comment) {
    let displayContent = comment.content.replace(
        /#(\w+)/g,
        '<span class="hashtag">#$1</span>'
    );
    if (comment.content && comment.content.startsWith("@")) {
        const [tag, ...rest] = comment.content.split(" ");
        displayContent = `<span class="tag">${tag}</span> ${rest.join(" ").replace(
            /#(\w+)/g,
            '<span class="hashtag">#$1</span>'
        )}`;
    }
    if (comment.image) displayContent += `<img src="${comment.image}" alt="Attached image">`;

    const commentDiv = document.createElement("div");
    commentDiv.classList.add("trending-comment");
    commentDiv.innerHTML = `
        <div class="comment-header">
            <img src="${comment.avatar}" alt="Avatar" class="avatar">
            <span class="username">${comment.handle}</span>
            <span class="time">${timeAgo(comment.createdAt)}</span>
        </div>
        <div class="comment-body">${displayContent}</div>
        <span class="likes">${comment.likes} curtida${comment.likes !== 1 ? "s" : ""}</span>
    `;
    return commentDiv;
}

function createPollComment(content, question, options, expiresInHours, pollType) {
    if (!currentUser.username) {
        addLoginRequiredNotification("create poll");
        return;
    }
    // Validação do parâmetro options
    console.log("Options recebidas em createPollComment:", options); // Depuração
    if (!Array.isArray(options) || options.length < 2 || options.some(opt => !opt || typeof opt !== 'string')) {
        addNotification("Erro: As opções da enquete devem ser um array com pelo menos duas opções válidas.");
        return;
    }
    const newComment = {
        id: generateUniqueId(),
        username: currentUser.username,
        avatar: currentUser.avatar,
        content: content || "", // Usa string vazia se content for vazio
        createdAt: new Date().toISOString(),
        likes: 0,
        replies: [],
        image: null,
        history: [content || ""], // Registra o content inicial no histórico
        reported: false,
        featured: false,
        isEdited: false,
        upvoters: [],
        poll: {
            question,
            options: options.map(opt => {
                console.log("Processando opção:", opt); // Depuração
                return { text: opt.trim(), votes: [] };
            }),
            expiresAt: new Date(Date.now() + expiresInHours * 60 * 60 * 1000).toISOString(),
            pollType
        }
    };
    comments.push(newComment);
    saveData();
    renderComments();
    addNotification("Enquete criada com sucesso!");

    // Notificar seguidores
    userProfile.followingList.forEach(follower => {
        addNotificationToUser(follower, {
            id: Date.now(),
            avatar: getUserAvatar(currentUser.username),
            message: `${currentUser.username} criou uma enquete: "${question}"`,
            timestamp: new Date().toISOString(),
            type: "poll",
            path: newComment.id
        });
    });

    // Agendar notificação de expiração
    setTimeout(() => {
        if (new Date(newComment.poll.expiresAt) <= new Date()) {
            newComment.poll.notifiedExpiration = true;
            addNotificationToUser(newComment.username, {
                id: Date.now(),
                avatar: getUserAvatar("system"),
                message: `Sua enquete "${question}" expirou.`,
                timestamp: new Date().toISOString(),
                type: "poll"
            });
            saveData();
            renderComments();
        }
    }, expiresInHours * 60 * 60 * 1000);
}

function showVoters(path, optionIndex) {
    const targetComment = getTargetComment(path);
    if (!targetComment.poll) {
        addNotification("Enquete inválida!");
        return;
    }
    const voters = targetComment.poll.options[optionIndex].votes || [];
    const modal = document.createElement("div");
    modal.classList.add("generic-confirmation-modal", "confirmation-modal");
    modal.innerHTML = `
        <div class="generic-confirmation-modal-content">
            <h3>Votantes da Opção: ${targetComment.poll.options[optionIndex].text}</h3>
            <ul>
                ${voters.length > 0 
                    ? voters.map(voter => `<li>${voter}</li>`).join('') 
                    : '<li>Nenhum voto registrado.</li>'
                }
            </ul>
            <div class="modal-actions">
                <button class="cancel-btn">Fechar</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    modal.querySelector(".cancel-btn").addEventListener("click", () => modal.remove());
    modal.addEventListener("click", (e) => {
        if (e.target === modal) modal.remove();
    });
}

function addPollOption() {
    const pollOptions = document.getElementById("poll-options");
    const optionCount = pollOptions.querySelectorAll(".poll-option-container").length;

    if (optionCount >= 10) {
        addLoginRequiredNotification("poll");
        return;
    }

    const newOption = document.createElement("div");
    newOption.className = "poll-option-container";
    newOption.innerHTML = `
        <input type="text" class="poll-option" placeholder="Opção ${optionCount + 1}" maxlength="70">
        <button class="remove-option" onclick="removePollOption(this)"><i class="fa-solid fa-minus"></i></button>
    `;
    pollOptions.appendChild(newOption);
}

function checkExpiredPolls() {
    const now = new Date();
    comments
        .filter(c => c.poll && new Date(c.poll.expiresAt) <= now && !c.poll.notifiedExpiration)
        .forEach(c => {
            addNotificationToUser(c.username, {
                id: Date.now(),
                avatar: getUserAvatar("system"),
                message: `Sua enquete "${c.poll.question}" expirou.`,
                timestamp: new Date().toISOString(),
                type: "poll"
            });
            c.poll.notifiedExpiration = true; // Evita notificações repetidas
        });
    saveData();
}

document.addEventListener("DOMContentLoaded", () => {
    checkExpiredPolls();
});

function pinComment(path) {
    if (!currentUser.username) {
        addNotification("Você precisa estar logado para fixar um comentário.");
        return;
    }
    const targetComment = getTargetComment(path);
    if (targetComment.username !== currentUser.username) {
        addNotification("Você só pode fixar seus próprios comentários!");
        return;
    }

    // Toggle the pinned state of the comment
    if (targetComment.pinned) {
        // Unpin the comment
        targetComment.pinned = false;
        addNotification("Comentário desafixado com sucesso!");
    } else {
        // Pin the comment
        targetComment.pinned = true;
        addNotification("Comentário fixado com sucesso!");
    }

    saveData();
    renderComments();
    // Update the profile page if it's visible
    const profileContainer = document.querySelector('.profile-container');
    if (profileContainer && profileContainer.querySelector('.profile-username').textContent === currentUser.username) {
        showProfilePage(currentUser);
    }
}
function hideComment(path) {
    if (!currentUser.username) {
        addNotification("Você precisa estar logado para ocultar um comentário.");
        return;
    }
    const targetComment = getTargetComment(path);
    if (targetComment.username === currentUser.username) {
        addNotification("Você não pode ocultar seus próprios comentários!");
        return;
    }

    userProfile.hiddenComments = userProfile.hiddenComments || [];
    if (!userProfile.hiddenComments.includes(targetComment.id)) {
        userProfile.hiddenComments.push(targetComment.id);
        localStorage.setItem(`userProfile_${currentUser.username}`, JSON.stringify(userProfile));
        saveData();
        renderComments();
        addNotification("Comentário ocultado com sucesso!");
    }
}
function pinReply(path, replyId) {
    if (!currentUser.username) {
        addNotification("Você precisa estar logado para fixar uma resposta.");
        return;
    }

    const targetComment = getTargetComment(path);
    if (!targetComment.replies || !targetComment.replies.find(r => r.id === replyId)) {
        addNotification("Resposta não encontrada!");
        return;
    }

    if (targetComment.username !== currentUser.username) {
        addNotification("Você só pode fixar respostas em seus próprios comentários!");
        return;
    }

    targetComment.pinnedReplies = targetComment.pinnedReplies || [];

    const reply = targetComment.replies.find(r => r.id === replyId);
    if (targetComment.pinnedReplies.includes(replyId)) {
        targetComment.pinnedReplies = targetComment.pinnedReplies.filter(id => id !== replyId);
        reply.pinned = false;
        addNotification("Resposta desafixada com sucesso!");
    } else {
        targetComment.pinnedReplies.push(replyId);
        reply.pinned = true;
        addNotification("Resposta fixada com sucesso!");
    }

    saveData();
    renderComments();
}

function savePost(path) {
    if (!currentUser.username) {
        addLoginRequiredNotification("save");
        return;
    }

    const targetComment = getTargetComment(path);
    if (!targetComment) {
        addNotification("Post não encontrado!");
        console.error(`Comentário não encontrado para o path: ${path}`);
        return;
    }

    // Inicializa savedPosts se não existir
    userProfile.savedPosts = Array.isArray(userProfile.savedPosts) ? userProfile.savedPosts : [];
    
    const isSaved = userProfile.savedPosts.includes(targetComment.id);

    if (isSaved) {
        // Remove o post dos salvos
        userProfile.savedPosts = userProfile.savedPosts.filter(id => id !== targetComment.id);
        addNotification("Post removido dos salvos!");
        console.log(`Post ${targetComment.id} removido de savedPosts.`);
    } else {
        // Adiciona o post aos salvos
        userProfile.savedPosts.push(targetComment.id);
        addNotification("Post salvo com sucesso!");
        console.log(`Post ${targetComment.id} adicionado a savedPosts.`);
    }

    // Salva as alterações no localStorage
    try {
        localStorage.setItem(`userProfile_${currentUser.username}`, JSON.stringify(userProfile));
        console.log(`userProfile salvo no localStorage:`, userProfile);
        saveData(); // Salva outros dados relacionados
    } catch (e) {
        console.error("Erro ao salvar no localStorage:", e);
        if (e.name === "QuotaExceededError") {
            addNotification("Armazenamento cheio! Limpe alguns dados ou use outro navegador.");
        } else {
            addNotification("Erro ao salvar o post. Tente novamente.");
        }
        return;
    }

    // Atualiza a interface para refletir o estado do botão de salvar
    const commentElement = document.querySelector(`.comment[id="comment-${targetComment.id}"] .save-btn`);
    if (commentElement) {
        commentElement.classList.toggle("saved", !isSaved);
        commentElement.querySelector("i").classList.toggle("fas", !isSaved);
        commentElement.querySelector("i").classList.toggle("far", isSaved);
    } else {
        console.warn(`Botão de salvar não encontrado para o comentário ${targetComment.id}`);
    }

    // Atualiza a página de posts salvos SOMENTE se ela estiver visível
    const savedPostsContainer = document.querySelector('.saved-posts-container');
    const isSavedPostsPageVisible = savedPostsContainer && savedPostsContainer.offsetParent !== null;
    if (isSavedPostsPageVisible) {
        showSavedPosts();
    }

    // Atualiza a renderização dos comentários para refletir o estado
    renderComments();
}

function formatNumber(num) {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num;
}

function formatDate(timestamp) {
    const date = new Date(timestamp);
    const options = { day: 'numeric', month: 'short', year: 'numeric' };
    const formatted = date.toLocaleDateString('pt-BR', options); // Ex.: "3 out. 2025"
    return formatted;
}

// Função auxiliar para escapar caracteres HTML e prevenir XSS
function escapeHTML(str) {
    return str.replace(/[&<>"']/g, match => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&apos;'
    }[match]));
}

function createCommentElement(comment, path, level = 0) {
    // Busca o perfil do usuário no localStorage usando userId
    const commentUserProfile = JSON.parse(localStorage.getItem(`userProfile_${comment.userId}`)) || { 
        profilePic: comment.avatar || "placeholder-profile-image.png",
        handle: comment.handle || `@${comment.username}`,
        visibility: "public",
        accountType: "common" // Default para pessoa comum
    };    
    const commentPath = path;
    const imagePath = path.startsWith("comments-") ? path : `comments-${path}`;

    const avatarSrc = commentUserProfile.profilePic || "placeholder-profile-image.png";
    const canInteract = commentUserProfile.visibility === "public" || 
                        comment.userId === currentUser.id || 
                        userProfile.followingList.includes(comment.userId);

    // Determinar o ícone do tipo de conta
    let accountTypeIcon = '';
    if (commentUserProfile.accountType === 'business') {
        accountTypeIcon = '<i class="fa-solid fa-certificate" style="color: #caa607;"></i> ';
    } else if (commentUserProfile.accountType === 'authority') {
        accountTypeIcon = '<i class="fa-solid fa-certificate" style="color: #1da1f2; "></i> ';
    }

    // Initialize defaults to prevent undefined errors
    comment.replies = comment.replies || [];
    comment.poll = comment.poll || null;
    comment.upvoters = comment.upvoters || [];
    comment.likes = comment.likes !== undefined ? comment.likes : 0;
    comment.pinned = comment.pinned || false;
    comment.pinnedReplies = comment.pinnedReplies || [];

    // Processar o conteúdo
    let displayContent = escapeHTML(comment.content); // Escapar HTML primeiro
    let processedContent = displayContent
        .replace(/@(\w+)/g, '<span class="mention" onclick="showProfilePageForUsername(\'$1\', event)">@$1</span>')
        .replace(/#(\w+)/g, '<span class="hashtag">#$1</span>')
        .replace(/\n/g, '<br>'); // Converter quebras de linha em <br>

    // Verificar se o conteúdo excede 258 caracteres
    if (comment.content.length > 280) {
        // Encontrar o ponto de corte no conteúdo original
        const shortContent = comment.content.substring(0, 280);
        const remainingContent = comment.content.substring(280);
        // Processar a parte inicial
        let shortProcessed = escapeHTML(shortContent)
            .replace(/@(\w+)/g, '<span class="mention" onclick="showProfilePageForUsername(\'$1\', event)">@$1</span>')
            .replace(/#(\w+)/g, '<span class="hashtag">#$1</span>')
            .replace(/\n/g, '<br>');
        // Processar a parte restante
        let remainingProcessed = escapeHTML(remainingContent)
            .replace(/@(\w+)/g, '<span class="mention" onclick="showProfilePageForUsername(\'$1\', event)">@$1</span>')
            .replace(/#(\w+)/g, '<span class="hashtag">#$1</span>')
            .replace(/\n/g, '<br>');
        // Montar o conteúdo com "mostrar mais"
        processedContent = `
            <span class="content-wrapper">
                <span class="short-content">${shortProcessed}...</span>
                <span class="remaining-content" style="display: none;">${shortProcessed}${remainingProcessed}</span>
                <a href="javascript:void(0)" class="show-more" onclick="this.previousElementSibling.style.display='inline'; this.previousElementSibling.previousElementSibling.style.display='none'; this.style.display='none';">mostrar mais</a>
            </span>
        `;
    }

    // Se linkPreviews estiver vazio, transformar URLs em links clicáveis
    if (!comment.linkPreviews || comment.linkPreviews.length === 0) {
        processedContent = processedContent.replace(
            /(https?:\/\/[^\s<>"']+)/g,
            '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
        );
    } else {
        // Se houver linkPreviews, remover URLs do texto para evitar duplicação
        processedContent = processedContent.replace(/(https?:\/\/[^\s<>"']+)/g, '');
    }

    // Adicionar prévias das URLs, se existirem
    if (comment.linkPreviews && comment.linkPreviews.length > 0) {
        processedContent += `<div class="link-preview">`;
        comment.linkPreviews.forEach(preview => {
            processedContent += `
                <a href="${preview.url}" target="_blank" rel="noopener noreferrer" class="link-preview-card">
                    ${preview.image ? `
                        <div class="link-preview-image" style="background-image: url('${preview.image}');">
                            <img src="${preview.image}" alt="Preview image" class="link-preview-image">
                        </div>
                    ` : ''}
                    <div class="link-preview-content">
                        <h4 class="link-preview-title">${preview.title}</h4>
                        <p class="link-preview-description">${preview.description}</p>
                        <span class="link-preview-url">${preview.url}</span>
                    </div>
                </a>
            `;
        });
        processedContent += `</div>`;
    }
    if (comment.images && Array.isArray(comment.images) && comment.images.length > 0) {
        const maxImages = Math.min(comment.images.length, 4);
        processedContent += `<div class="comment-images images-${maxImages}" style="background-image: url('${comment.images[0]}');">`;
        comment.images.slice(0, maxImages).forEach((imageSrc, index) => {
            if (typeof imageSrc === 'string' && imageSrc.trim() !== '') {
                processedContent += `<img src="${imageSrc}" alt="Attached image ${index + 1}" class="comment-image image-${index + 1}" onclick="openPostedImageModal('${commentPath}', ${index})">`;
            }
        });
        processedContent += `</div>`;
    } else {
        comment.images = comment.images || [];
    }
    
    const commentDiv = document.createElement("div");
    commentDiv.classList.add("comment");
    if (comment.reported) commentDiv.classList.add("reported");
    if (comment.featured) commentDiv.classList.add("featured");
    if (comment.pinned && document.querySelector('.profile-page')) commentDiv.classList.add("pinned");
    commentDiv.setAttribute("data-level", level.toString());

    let retweetContent = "";
    if (comment.retweet) {
        let retweetDisplayContent = escapeHTML(comment.retweet.content); // Escapar HTML
        retweetDisplayContent = retweetDisplayContent
            .replace(/@(\w+)/g, '<span class="mention" onclick="showProfilePageForUsername(\'$1\', event)">@$1</span>')
            .replace(/#(\w+)/g, '<span class="hashtag">#$1</span>')
            .replace(/\n/g, '<br>'); // Converter quebras de linha em <br>
        if (comment.retweet.images && comment.retweet.images.length > 0) {
            retweetDisplayContent += `<div class="comment-images">`;
            comment.retweet.images.forEach((imageSrc, index) => {
                retweetDisplayContent += `<img src="${imageSrc}" alt="Attached image ${index + 1}" class="comment-image" onclick="openPostedImageModal('${path}', ${index})">`;
            });
            retweetDisplayContent += `</div>`;
        }
        retweetContent = `
            <div class="retweet-content">
                <div class="comment-header">
                    <img src="${comment.retweet.avatar}" alt="Avatar" class="avatar" onclick="showProfilePageForUsername('${comment.retweet.username}', event)">
                    <span class="username" onclick="showProfilePageForUsername('${comment.retweet.username}', event)">
                        ${comment.retweet.username}
                    </span>
                    <span class="handle">${comment.retweet.handle || `@${comment.retweet.username}`}</span>
                    <span class="time">${timeAgo(comment.retweet.createdAt)}</span>
                </div>
                <div class="comment-body">${retweetDisplayContent}</div>
            </div>
        `;
    }

    let pollHtml = "";
    if (comment.poll) {
        const isExpired = new Date(comment.poll.expiresAt) <= new Date();
        const uniqueVoters = [...new Set(comment.poll.options.flatMap(opt => opt.votes || []))].length;
        const totalVotes = comment.poll.options.reduce((sum, opt) => sum + (opt.votes?.length || 0), 0);
        const isOwner = comment.userId === currentUser.id;
        pollHtml = `
            <div class="poll ${isExpired ? 'expired' : ''}">
                <h4>
                    ${escapeHTML(comment.poll.question)} <!-- Escapar HTML na pergunta da enquete -->
                <div class="poll-header">
                    ${isExpired ? `<span class="poll-expired">Encerrada</span> <span class="poll-expired-time">(${timeAgo(comment.poll.expiresAt)})</span>` : ''}
                </div>
                </h4>
                ${comment.poll.options.map((opt, i) => {
                    const percentage = totalVotes ? (opt.votes?.length / totalVotes * 100) || 0 : 0;
                    const formattedPercentage = Number.isInteger(percentage) ? percentage : percentage.toFixed(1);
                    return `
                        <div class="poll-option">
                            <button onclick="voteInPoll('${path}', ${i})" 
                                    class="${opt.votes?.includes(currentUser.id) ? 'voted' : ''}"
                                    ${isExpired ? 'disabled' : ''}>
                                ${escapeHTML(opt.text)} <!-- Escapar HTML no texto da opção -->
                            </button>
                            <span>${formattedPercentage}%</span>
                            <div class="poll-bar" style="width: ${percentage}%"></div>
                            <div class="view-voters" onclick="showVoters('${path}', ${i})">Ver votantes</div>
                        </div>
                    `;
                }).join('')}
                <div class="poll-total-votes" style="text-align: right; margin-top: 10px; font-size: 12px;">
                    ${uniqueVoters} voto${uniqueVoters !== 1 ? 's' : ''}
                </div>
                ${isOwner && !isExpired ? `
                    <button onclick="editPoll('${path}')" class="enquete-button" title="Editar Enquete"><i class="fa-solid fa-chart-bar"></i></button>
                    <button onclick="closePollEarly('${path}')" class="enquete-button" title="Encerrar Enquete" aria-label="Encerrar enquete"><i class="fa-solid fa-lock"></i></button>
                ` : ''}
                <button onclick="showPollInsights('${path}')" class="enquete-button" title="Ver Insights" aria-label="Ver insights da enquete"><i class="fa-solid fa-chart-pie"></i></button>
            </div>
        `;
    }

    const badgeContent = comment.userId === currentUser.id && userProfile.badges.length > 0 
        ? `<span class="badge">${getBadgeIcon(userProfile.badges[0])} ${userProfile.badges[0]}</span>` 
        : '';

    const isLiked = comment.upvoters.includes(currentUser.id);
    const likeClass = isLiked ? "liked" : "";
    const likeCount = comment.likes;

    const isSensitive = comment.sensitive && comment.reportCount >= 3;
    const sensitiveOverlay = isSensitive ? `
        <div class="sensitive-overlay" id="sensitive-overlay-${commentPath}">
            <button class="sensitive-btn" onclick="showSensitiveConfirmation('${commentPath}')">
                <i class="fa-solid fa-eye-low-vision"></i>
            </button>
            <p>Alerta de Conteúdo Sensível</p>
        </div>
    ` : '';

    const pinnedBadge = comment.pinned && document.querySelector('.profile-page') 
        ? '<span class="pinned-badge"><i class="fa-solid fa-thumbtack"></i>Fixado</span>' 
        : '';

    const isSaved = userProfile.savedPosts && userProfile.savedPosts.includes(comment.id);
    const saveClass = isSaved ? "saved" : "";
    const saveIcon = isSaved ? "fas fa-bookmark" : "far fa-bookmark";

    // Add replies button and container in innerHTML
    const hasReplies = level === 0 && comment.replies.length > 0;
    const replyCount = hasReplies ? countReplies(comment.replies) : 0;

    commentDiv.innerHTML = `
        <div class="comment-header">
            <img src="${avatarSrc}" alt="Avatar" class="avatar" onclick="showProfilePageForUsername('${comment.username}', event)">
            <div class="comment-header-info">
                <span class="username" onclick="showProfilePageForUsername('${comment.username}', event)">${comment.username}${accountTypeIcon}</span>
                <span class="handle">${commentUserProfile.handle || `@${comment.username}`}</span>
            </div>
            ${comment.isEdited ? '<span class="edited-label">editado</span>' : ''}
            ${pinnedBadge}
            <div class="comment-header-menu">
                <button class="menu-btn" onclick="toggleCommentMenu('${commentPath}', this)" aria-label="Mais opções">⋮</button>
                <div class="comment-menu" id="comment-menu-${commentPath}" style="display: none;">
                    <ul>
                        <li onclick="showHistory('${commentPath}'); closeCommentMenu('${commentPath}');">Histórico<i class="fa-solid fa-clock-rotate-left"></i></li>
                        <li onclick="readAloud('${commentPath}'); closeCommentMenu('${commentPath}');">Ler Comentário<i class="fa-solid fa-volume-high"></i></li>
                        <li onclick="reportComment('${commentPath}'); closeCommentMenu('${commentPath}');">Reportar<i class="fa-solid fa-flag"></i></li>
                        ${comment.userId === currentUser.id ? `
                            ${!comment.isEdited ? `<li onclick="editComment('${commentPath}'); closeCommentMenu('${commentPath}');">Editar<i class="fa-solid fa-pen-to-square"></i></li>` : `<li disabled>Impossível editar novamente<i class="fa-solid fa-ban"></i></li>`}
                            <li onclick="deleteComment('${commentPath}'); closeCommentMenu('${commentPath}');"><span style="color: red;">Excluir</span><i class="fa-solid fa-trash-can-arrow-up" style="color: red;"></i></li>
                            ${level === 0 ? `<li onclick="pinComment('${commentPath}'); closeCommentMenu('${commentPath}');">${comment.pinned ? 'Desafixar' : 'Fixar'}<i class="fa-solid fa-thumbtack"></i></li>` : ''}
                        ` : level > 0 && getParentCommentOwner(path) === currentUser.id ? `
                            <li onclick="deleteComment('${commentPath}'); closeCommentMenu('${commentPath}');"><span style="color: red;">Excluir</span><i class="fa-solid fa-trash-can-arrow-up" style="color: red;"></i></li>
                            <li onclick="pinReply('${getParentPath(path)}', '${comment.id}'); closeCommentMenu('${commentPath}');">${comment.pinned ? 'Desafixar' : 'Fixar'}<i class="fa-solid fa-thumbtack"></i></li>
                        ` : `
                            <li onclick="hideComment('${commentPath}'); closeCommentMenu('${commentPath}');">Não tenho interesse<i class="fa-solid fa-eye-slash"></i></li>
                        `}
                    </ul>
                </div>
            </div>
        </div>
        <div class="comment-body ${isSensitive ? 'blurred' : ''}" ondblclick="doubleClickLike('${commentPath}')">${processedContent}${retweetContent}${pollHtml}</div>
        ${sensitiveOverlay}
        <div class="comment-footer">
            ${badgeContent}
            <span class="time" title="${new Date(comment.createdAt).toLocaleString('pt-BR')}">${new Date(comment.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
            <span class="data">${formatDate(comment.createdAt)}</span>
        </div>
        <button class="reply-btn" onclick="showReplyForm('${commentPath}')" data-tooltip="Visualizações">Responder</button>
        <button class="retweet-btn" onclick="showRetweetForm('${commentPath}')" data-tooltip="Visualizações"><i class="fa-solid fa-reply"></i></button>
        ${comment.userId === currentUser.id && level === 0 ? `
            <div class="comment-actions-main">
                <button data-icon="✎" ${comment.isEdited ? 'disabled' : ''} onclick="${comment.isEdited ? '' : `editComment('${commentPath}')`}">${comment.isEdited ? 'Impossível editar novamente' : '<i class="fa-solid fa-pen-to-square"></i>'}</button>
                <button data-icon="🗑" onclick="deleteComment('${commentPath}')"><i class="fa-solid fa-trash"></i></button>
            </div>
        ` : ''}
        <button class="like-btn ${likeClass}" onclick="likeComment('${commentPath}')">
            <i class="fa-heart ${isLiked ? 'fas' : 'far'}"></i> ${likeCount}
        </button>
        <button class="analysis-btn" onclick="showCommentAnalysis('${commentPath}')" aria-label="Ver análise do comentário">
            <i class="fa-solid fa-chart-simple"></i>
        </button>
        <button class="save-btn ${saveClass}" onclick="savePost('${commentPath}')" aria-label="${isSaved ? 'Remover dos salvos' : 'Salvar post'}">
            <i class="${saveIcon}"></i>
        </button>
        ${hasReplies ? `
            <button class="view-replies" onclick="this.nextElementSibling.classList.toggle('visible')">
                <i class="fa-regular fa-comment"></i> ${replyCount}
            </button>
            <div class="replies"></div>
        ` : ''}
    `;

    // Render replies if they exist
    if (hasReplies) {
        const repliesDiv = commentDiv.querySelector(".replies");
        const sortedReplies = comment.replies.slice().sort((a, b) => {
            const aPinned = comment.pinnedReplies.includes(a.id);
            const bPinned = comment.pinnedReplies.includes(b.id);
            if (aPinned && !bPinned) return -1;
            if (!aPinned && bPinned) return 1;
            return new Date(b.createdAt) - new Date(a.createdAt);
        });

        sortedReplies.forEach((reply, index) => {
            const replyPath = `${commentPath}-replies-${reply.id}`;
            const replyElement = createCommentElement(reply, replyPath, level + 1);
            if (comment.pinnedReplies.includes(reply.id) && document.querySelector('.profile-page')) {
                replyElement.classList.add("pinned");
                const header = replyElement.querySelector('.comment-header');
                const pinnedBadge = '<span class="pinned-badge"><i class="fa-solid fa-thumbtack"></i></span>';
                header.innerHTML = header.innerHTML.replace('</span>', `</span>${pinnedBadge}`);
            }
            repliesDiv.appendChild(replyElement);
        });
    }

    return commentDiv;
}

/* Adicionar função para exibir análise do comentário */
function showCommentAnalysis(path) {
    const targetComment = getTargetComment(path);
    if (!targetComment) {
        addNotification("Comentário não encontrado!");
        return;
    }

    const replyCount = countReplies(targetComment.replies || []);
    const modal = document.createElement("div");
    modal.classList.add("generic-confirmation-modal", "confirmation-modal");
    modal.innerHTML = `
        <div class="generic-confirmation-modal-content">
            <h3>Estatísticas de Post</h3>
            <li class="author-name">feito por ${targetComment.handle}</li>
            <ul class="comment-analysis-list">
                <li data-tooltip="Visualizações"><strong></strong> <i class="fa-solid fa-eye"></i>${targetComment.views || 0}</li>
                <li data-tooltip="Comentários"><strong></strong> <i class="fa-regular fa-comment"></i>${replyCount}</li>
                <li data-tooltip="Reposts"><strong></strong> <i class="fa-solid fa-reply-all"></i>${targetComment.retweets || 0}</li>
                <li data-tooltip="Vezes que o post foi salvo"><strong></strong> <i class="fa-solid fa-bookmark"></i>${targetComment.savedBy?.length || 0}</li>
                <li data-tooltip="Curtidas"><strong></strong> <i class="fa-regular fa-heart"></i>${targetComment.likes || 0}</li>
                
            </ul>
            <div class="comment-analysis-description">
                <p>Esse comentário foi postado em ${new Date(targetComment.createdAt).toLocaleDateString()} às ${new Date(targetComment.createdAt).toLocaleTimeString()}.</p>
                <p>Ele contém ${targetComment.content.split(' ').length} palavras e ${targetComment.content.length} caracteres.</p>
                <p>O comentário foi editado ${targetComment.history.length - 1} vez${targetComment.history.length - 1 !== 1 ? 'es' : ''}.</p>
                <p>O comentário foi reportado ${targetComment.reportCount || 0} vez${targetComment.reportCount !== 1 ? 'es' : ''}.</p>
            </div>
            <div class="comment-analysis-image">
                ${targetComment.images && targetComment.images.length > 0 ? `<img src="${targetComment.images[0]}" alt="Imagem do comentário" class="analysis-img">` : ''}
            </div>
            <div class="modal-actions">
                <button class="cancel-btn">Fechar</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    modal.querySelector(".cancel-btn").addEventListener("click", () => modal.remove());
    modal.addEventListener("click", (e) => {
        if (e.target === modal) modal.remove();
    });
}

// Função auxiliar para encontrar o comentário pai
function getParentComment(path) {
    const pathParts = path.split('-replies-');
    if (pathParts.length < 2) return null; // Não é uma reply

    const parentPath = pathParts[0].startsWith('comments-') ? pathParts[0] : `comments-${pathParts[0]}`;
    let current = comments;

    // Navega até o comentário pai
    const ids = parentPath.replace('comments-', '').split('-');
    for (const id of ids) {
        const comment = current.find(c => c.id === id);
        if (!comment) return null;
        current = comment.replies || [];
    }

    return current.find(c => c.id === pathParts[1].split('-')[0]) || null;
}


function openPostedImageModal(commentPath, imageIndex) {
    console.log("Abrindo modal para commentPath:", commentPath, "Imagem:", imageIndex);

    const modal = document.getElementById("posted-image-modal");
    const modalImage = document.getElementById("posted-modal-image");
    const modalPrev = document.getElementById("posted-modal-prev");
    const modalNext = document.getElementById("posted-modal-next");
    const modalClose = document.getElementById("posted-modal-close");
    const commentsContainer = document.getElementById("posted-modal-comments");
    const commentInput = document.getElementById("posted-modal-comment-input");
    const commentSubmit = document.getElementById("posted-modal-comment-submit");
    const imageContainer = modalImage.parentElement; 


    if (!modal || !modalImage || !modalPrev || !modalNext || !modalClose || !commentsContainer || !commentInput || !commentSubmit || !imageContainer) {
        console.error("Elementos do modal não encontrados. Verifique o HTML.");
        addNotification("Erro: Modal não configurado corretamente.");
        return;
    }

    const comment = findCommentByPath(commentPath);
    if (!comment) {
        console.error("Comentário não encontrado para o path:", commentPath);
        console.log("Comentários disponíveis:", comments);
        addNotification("Erro: Comentário não encontrado.");
        return;
    }

    let currentImageIndex = imageIndex;
    const images = comment.images || [];

    if (images.length === 0 || !images[currentImageIndex]) {
        console.error("Nenhuma imagem encontrada para o índice:", currentImageIndex);
        addNotification("Erro: Imagem não encontrada.");
        return;
    }

    modalImage.src = images[currentImageIndex];
    modal.style.display = "flex";
    updateModalNav();

    // Configurar zoom e arrastar
    let scale = 1;
    let translateX = 0;
    let translateY = 0;
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let lastPinchDistance = 0;
    let zoomTimeout = null;

    // Criar marcador de zoom
    let zoomIndicator = document.getElementById("zoom-indicator");
    if (!zoomIndicator) {
        zoomIndicator = document.createElement("div");
        zoomIndicator.id = "zoom-indicator";
        zoomIndicator.classList.add("zoom-indicator");
        imageContainer.appendChild(zoomIndicator);
    }

    // Função para mostrar o marcador de zoom
    function showZoomIndicator() {
        zoomIndicator.textContent = `${scale.toFixed(1)}x`;
        zoomIndicator.style.display = "block";
        // Esconder após 1 segundo
        if (zoomTimeout) clearTimeout(zoomTimeout);
        zoomTimeout = setTimeout(() => {
            zoomIndicator.style.display = "none";
        }, 1000);
    }

    // Função para aplicar transformação e restringir limites
    function applyTransform() {
        const maxTranslateX = (modalImage.offsetWidth * scale - modalImage.offsetWidth) / 2;
        const maxTranslateY = (modalImage.offsetHeight * scale - modalImage.offsetHeight) / 2;
        translateX = Math.max(-maxTranslateX, Math.min(maxTranslateX, translateX));
        translateY = Math.max(-maxTranslateY, Math.min(maxTranslateY, translateY));
        modalImage.style.transform = `scale(${scale}) translate(${translateX}px, ${translateY}px)`;
        // Atualizar classe zoomed
        if (scale > 1) {
            modalImage.classList.add("zoomed");
        } else {
            modalImage.classList.remove("zoomed");
        }
    }

    // Zoom com roda do mouse
    modalImage.addEventListener('wheel', (e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        scale = Math.max(1, Math.min(4, scale + delta)); // Limite de zoom: 1x a 3x
        applyTransform();
        showZoomIndicator();
    });

    // Arrastar com mouse (apenas enquanto segurar)
    modalImage.addEventListener('mousedown', (e) => {
        if (scale <= 1) return; // Não arrastar sem zoom
        e.preventDefault();
        isDragging = true;
        startX = e.clientX - translateX;
        startY = e.clientY - translateY;
        modalImage.classList.add('dragging');
    });

    modalImage.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        e.preventDefault();
        translateX = e.clientX - startX;
        translateY = e.clientY - startY;
        applyTransform();
    });

    modalImage.addEventListener('mouseup', () => {
        isDragging = false;
        modalImage.classList.remove('dragging');
    });

    modalImage.addEventListener('mouseleave', () => {
        isDragging = false;
        modalImage.classList.remove('dragging');
    });

    // Suporte a toque (arrastar e pinch zoom)
    modalImage.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (e.touches.length === 1 && scale > 1) {
            isDragging = true;
            startX = e.touches[0].clientX - translateX;
            startY = e.touches[0].clientY - translateY;
        } else if (e.touches.length === 2) {
            isDragging = false;
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            lastPinchDistance = Math.hypot(
                touch1.clientX - touch2.clientX,
                touch1.clientY - touch2.clientY
            );
        }
    });

    modalImage.addEventListener('touchmove', (e) => {
        e.preventDefault();
        if (isDragging && e.touches.length === 1) {
            translateX = e.touches[0].clientX - startX;
            translateY = e.touches[0].clientY - startY;
            applyTransform();
        } else if (e.touches.length === 2) {
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            const currentDistance = Math.hypot(
                touch1.clientX - touch2.clientX,
                touch1.clientY - touch2.clientY
            );
            if (lastPinchDistance > 0) {
                const delta = currentDistance / lastPinchDistance;
                scale = Math.max(1, Math.min(3, scale * delta));
                lastPinchDistance = currentDistance;
                applyTransform();
                showZoomIndicator();
            }
        }
    });

    modalImage.addEventListener('touchend', () => {
        isDragging = false;
        lastPinchDistance = 0;
    });

    // Resetar zoom, posição e marcador ao mudar de imagem ou fechar o modal
    function resetTransform() {
        scale = 1;
        translateX = 0;
        translateY = 0;
        modalImage.style.transform = 'scale(1) translate(0px, 0px)';
        modalImage.classList.remove('zoomed', 'dragging');
        isDragging = false;
        zoomIndicator.style.display = 'none';
        if (zoomTimeout) clearTimeout(zoomTimeout);
    }

    // Renderizar comentários (replies)
    renderModalComments(comment, commentsContainer);

    // Função para encontrar o comentário pelo path
    function findCommentByPath(path) {
        if (!path || typeof path !== "string") {
            console.error("Path inválido:", path);
            return null;
        }
        const parts = path.split("-replies-");
        const commentId = parts[0].startsWith("comments-") ? parts[0].replace("comments-", "") : parts[0];
        let comment = comments.find(c => c.id === commentId);
        if (!comment) {
            console.error("Comentário não encontrado para ID:", commentId);
            return null;
        }
        if (parts.length > 1) {
            for (let i = 1; i < parts.length; i++) {
                const replyId = parts[i];
                comment = (comment.replies || []).find(r => r.id === replyId);
                if (!comment) {
                    console.error("Resposta não encontrada para ID:", replyId);
                    return null;
                }
            }
        }
        return comment;
    }

    // Atualizar navegação (anterior/próxima)
    function updateModalNav() {
        modalPrev.style.display = currentImageIndex > 0 ? "block" : "none";
        modalNext.style.display = currentImageIndex < images.length - 1 ? "block" : "none";
    }

    // Renderizar comentários no modal
    function renderModalComments(comment, container) {
        container.innerHTML = "";
        // Adicionar o texto do comentário original no topo
        let originalContent = comment.content || "";
        originalContent = originalContent
            .replace(/@(\w+)/g, '<span class="mention">@$1</span>')
            .replace(/#(\w+)/g, '<span class="hashtag">#$1</span>');
        const originalCommentElement = document.createElement("div");
        originalCommentElement.classList.add("original-comment");
        originalCommentElement.innerHTML = `
            <div class="comment-header">
                <img src="${comment.avatar || 'https://via.placeholder.com/32'}" alt="Avatar" class="avatar">
                <span class="username">${comment.username}</span>
                <span class="time">${timeAgo(comment.createdAt)}</span>
            </div>
            <div class="comment-body">${originalContent || '<p> </p>'}</div>
        `;
        container.appendChild(originalCommentElement);

        // Adicionar as respostas (replies)
        const replies = comment.replies || [];
        replies.forEach((reply, index) => {
            const replyPath = `${commentPath}-replies-${reply.id}`;
            const replyElement = createCommentElement(reply, replyPath, 1);
            container.appendChild(replyElement);
        });
        if (replies.length === 0 && comment.content === "") {
            container.innerHTML = originalCommentElement.outerHTML + `<p class="no-comments">Nenhum comentário ainda.</p>`;
        }
    }

    // Navegação entre imagens
    modalPrev.onclick = () => {
        if (currentImageIndex > 0) {
            currentImageIndex--;
            modalImage.src = images[currentImageIndex];
            updateModalNav();
        }
    };

    modalNext.onclick = () => {
        if (currentImageIndex < images.length - 1) {
            currentImageIndex++;
            modalImage.src = images[currentImageIndex];
            updateModalNav();
        }
    };

    // Fechar o modal
    modalClose.onclick = () => {
        modal.style.display = "none";
    };

    // Adicionar novo comentário
    commentSubmit.onclick = () => {
        if (!currentUser || !currentUser.username || !currentUser.email) {
            console.log("Usuário não logado, bloqueando comentário.");
            addLoginRequiredNotification("comment");
            return;
        }

        const content = commentInput.value.trim();
        if (!content) {
            addNotification("O comentário não pode estar vazio!");
            return;
        }
        if (content.length > 400) {
            addNotification("O comentário excede o limite de 400 caracteres.");
            return;
        }

        const newReply = {
            id: generateUniqueId(),
            username: currentUser.username,
            avatar: currentUser.avatar,
            content: content,
            createdAt: new Date().toISOString(),
            score: 0,
            replies: [],
            images: [],
            history: [content],
            reported: false,
            featured: false,
            isEdited: false,
            upvoters: []
        };

        comment.replies.push(newReply);
        commentInput.value = "";
        saveData();
        renderModalComments(comment, commentsContainer);
        renderComments(); // Atualizar a lista de comentários principal
        addNotification("Comentário adicionado!");
        awardPoints(5); // Pontos por adicionar uma resposta
    };
}

// Função auxiliar para obter o dono do comentário pai
function getParentCommentOwner(path) {
    const pathParts = path.split("-replies-");
    if (pathParts.length < 2) {
        console.error("Não é uma reply, path inválido:", path);
        return null;
    }

    const parentPath = pathParts[0].startsWith("comments-") ? pathParts[0] : `comments-${pathParts[0]}`;
    const targetComment = getTargetComment(parentPath);
    if (!targetComment) {
        console.error("Comentário pai não encontrado para path:", parentPath);
        return null;
    }
    return targetComment.userId;
}

// Função auxiliar para obter o caminho do comentário pai
function getParentPath(path) {
    const parts = path.split('-replies-');
    return parts[0];
}

function voteInPoll(path, optionIndex) {
    if (!currentUser.username) {
        addLoginRequiredNotification("vote");
        return;
    }
    const targetComment = getTargetComment(path);
    if (!targetComment.poll || new Date(targetComment.poll.expiresAt) < new Date()) {
        addNotification("Enquete inválida ou expirada!");
        return;
    }

    // Verifica se o usuário já votou na opção específica
    const hasVoted = targetComment.poll.options[optionIndex].votes.includes(currentUser.username);

    if (hasVoted) {
        // Remove o voto do usuário
        targetComment.poll.options[optionIndex].votes = targetComment.poll.options[optionIndex].votes.filter(
            username => username !== currentUser.username
        );
        saveData();
        renderComments();
        addNotification("Voto removido!");
        return;
    }

    // Para enquetes de seleção única, verifica se o usuário já votou em outra opção
    if (targetComment.poll.pollType === "single" && 
        targetComment.poll.options.some(opt => opt.votes.includes(currentUser.username))) {
        addNotification("Você já votou em outra opção! Remova seu voto anterior para votar novamente.");
        return;
    }

    // Registra o voto
    targetComment.poll.options[optionIndex].votes.push(currentUser.username);
    saveData();
    renderComments();
    addNotification("Voto registrado!");

    // Notifica o criador da enquete
    addNotificationToUser(targetComment.username, {
        id: Date.now(),
        avatar: getUserAvatar(currentUser.username),
        message: `${currentUser.username} votou na sua enquete: "${targetComment.poll.question}"`,
        timestamp: new Date().toISOString(),
        type: "poll"
    });
}

function closePollEarly(path) {
    if (!currentUser.username) {
        addLoginRequiredNotification("close poll");
        return;
    }
    const targetComment = getTargetComment(path);
    if (!targetComment.poll) {
        showGenericConfirmationModal(
            "Erro",
            "Enquete inválida!",
            null,
            "OK",
            null,
            false
        );
        return;
    }
    if (targetComment.username !== currentUser.username) {
        showGenericConfirmationModal(
            "Erro",
            "Você só pode encerrar suas próprias enquetes!",
            null,
            "OK",
            null,
            false
        );
        return;
    }
    if (new Date(targetComment.poll.expiresAt) <= new Date()) {
        showGenericConfirmationModal(
            "Erro",
            "A enquete já está encerrada!",
            null,
            "OK",
            null,
            false
        );
        return;
    }
    showGenericConfirmationModal(
        "Encerrar Enquete",
        "Deseja encerrar esta enquete agora? Os votos atuais serão mantidos, mas novos votos não serão permitidos.",
        () => {
            targetComment.poll.expiresAt = new Date().toISOString();
            targetComment.poll.notifiedExpiration = true;
            saveData();
            renderComments();
            showGenericConfirmationModal(
                "Sucesso",
                "Enquete encerrada com sucesso!",
                null,
                "OK",
                null,
                false
            );
            addNotificationToUser(currentUser.username, {
                id: Date.now(),
                avatar: getUserAvatar("system"),
                message: `Sua enquete "${targetComment.poll.question}" foi encerrada manualmente.`,
                timestamp: new Date().toISOString(),
                type: "poll"
            });
        },
        "Encerrar",
        "Cancelar"
    );
}

function showPollInsights(path) {
    const targetComment = getTargetComment(path);
    if (!targetComment.poll) {
        addNotification("Enquete inválida!");
        return;
    }

    // Calcula dados da enquete
    const voteData = targetComment.poll.options.map(opt => ({
        text: opt.text,
        votes: Array.isArray(opt.votes) ? opt.votes.length : 0
    }));
    const optionLabels = voteData.map(data => data.text);
    const optionVotes = voteData.map(data => data.votes);
    const totalVotes = optionVotes.reduce((sum, votes) => sum + votes, 0);
    const percentages = optionVotes.map(votes => totalVotes ? (votes / totalVotes * 100).toFixed(1) : 0);
    const uniqueVoters = new Set(
        targetComment.poll.options.flatMap(opt => Array.isArray(opt.votes) ? opt.votes : [])
    ).size;
    const isExpired = new Date(targetComment.poll.expiresAt) < new Date();
    const timeRemaining = isExpired ? "Encerrada" : timeUntil(targetComment.poll.expiresAt);
    const createdAt = new Date(targetComment.createdAt).toLocaleString('pt-BR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    // Análise de tendência
    const maxVotes = Math.max(...optionVotes);
    const leadingOption = maxVotes > 0 ? optionLabels[optionVotes.indexOf(maxVotes)] : "Nenhuma opção lidera";

    // Função auxiliar para escapar HTML
    function escapeHTML(str) {
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    // Função para criar HTML de opções
    function createPollOptionHtml(opt, index, percentage, votes) {
    return `
        <div class="poll-insight-option">
            <span>${escapeHTML(opt.text)}</span>
            <div class="poll-bar" style="width: ${percentage}%" aria-hidden="true"></div>
            <span>${percentage}%</span>
        </div>
    `;
}

function createPollInsightsHtml(targetComment, totalVotes, uniqueVoters, createdAt, timeRemaining, leadingOption, maxVotes, voteData, percentages) {
    return `
        <div class="poll-insights-container" role="region" aria-label="Insights da enquete: ${escapeHTML(targetComment.poll.question)}">
            <h3>${escapeHTML(targetComment.poll.question)}</h3>
            ${totalVotes === 0 ? '<p>Nenhum voto registrado ainda.</p>' : `
                <div class="poll-insights-stats">
                    <p><strong>Total de votos:</strong> ${totalVotes}</p>
                    <p><strong>Votantes únicos:</strong> ${targetComment.poll.anonymous ? "Não disponível (enquete anônima)" : uniqueVoters}</p>
                    <p><strong>Tipo de enquete:</strong> ${escapeHTML(targetComment.poll.pollType === "single" ? "Seleção única" : "Seleção múltipla")}</p>
                    <p><strong>Criada em:</strong> ${escapeHTML(createdAt)}</p>
                    <p><strong>Tempo restante:</strong> ${escapeHTML(timeRemaining)}</p>
                    <p><strong>Opção líder:</strong> ${escapeHTML(leadingOption)} (${maxVotes} votos)</p>
                </div>
                <h4>Distribuição de Votos</h4>
                <canvas id="poll-insights-chart" role="img" aria-describedby="chart-description"></canvas>
                <div class="poll-insights-options">
                    ${voteData.map((data, i) => createPollOptionHtml(data, i, percentages[i], data.votes)).join('')}
                </div>
            `}
        </div>
    `;
}

    // HTML do modal
    const insightsHtml = `
        <div class="poll-insights-container" role="region" aria-label="Insights da enquete: ${escapeHTML(targetComment.poll.question)}">
            <h3>${escapeHTML(targetComment.poll.question)}</h3>
            ${totalVotes === 0 ? '<p>Nenhum voto registrado ainda.</p>' : `
                <div class="poll-insights-stats">
                    <p><strong>Total de votos:</strong> ${totalVotes}</p>
                    <p><strong>Votantes únicos:</strong> ${uniqueVoters}</p>
                    <p><strong>Tipo de enquete:</strong> ${escapeHTML(targetComment.poll.pollType === "single" ? "Seleção única" : "Seleção múltipla")}</p>
                    <p><strong>Criada em:</strong> ${escapeHTML(createdAt)}</p>
                    <p><strong>Tempo restante:</strong> ${escapeHTML(timeRemaining)}</p>
                    <p><strong>Opção líder:</strong> ${escapeHTML(leadingOption)} (${maxVotes} votos)</p>
                </div>
                <h4>Distribuição de Votos</h4>
                <div class="sr-only" id="chart-description">
                    Gráfico de barras mostrando a distribuição de votos para a enquete "${escapeHTML(targetComment.poll.question)}". 
                    ${voteData.map((data, i) => `Opção "${escapeHTML(data.text)}": ${data.votes} votos (${percentages[i]}%)`).join('. ')}.
                </div>
                <canvas id="poll-insights-chart" role="img" aria-describedby="chart-description"></canvas>
                <div class="poll-insights-options">
                    ${voteData.map((data, i) => createPollOptionHtml(data, i, percentages[i])).join('')}
                </div>
            `}
        </div>
    `;

    // Renderiza o modal e inicializa o gráfico
    showGenericConfirmationModal(
        "Insights da Enquete",
        insightsHtml,
        null,
        "Fechar",
        null,
        false,
        () => {
            const canvas = document.getElementById('poll-insights-chart');
            if (!canvas) {
                console.error('Canvas element not found');
                return;
            }
            if (typeof Chart === 'undefined') {
                console.error('Chart.js não está carregado');
                canvas.insertAdjacentHTML('afterend', '<p>Erro: Não foi possível carregar o gráfico.</p>');
                return;
            }
            const ctx = canvas.getContext('2d');
            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: optionLabels,
                    datasets: [{
                        label: 'Votos',
                        data: optionVotes,
                        backgroundColor: '#1DA1F2',
                        borderColor: '#1DA1F2',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Número de Votos'
                            }
                        },
                        x: {
                            title: {
                                display: true,
                                text: 'Opções'
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const percentage = percentages[context.dataIndex];
                                    return `${context.raw} votos (${percentage}%)`;
                                }
                            }
                        }
                    }
                }
            });
        }
    );
}

// Função auxiliar para calcular tempo restante
function timeUntil(timestamp) {
    const now = new Date();
    const target = new Date(timestamp);
    const diffMs = target - now;
    if (diffMs <= 0) return "Encerrada";
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
}

function showPollForm() {
    document.body.classList.add('blur-background');
    resetPollForm(); // Reseta o formulário antes de abrir o modal
    showGenericConfirmationModal(
        "Criar Enquete",
        `
            <div class="poll-form-container">
                <textarea id="poll-comment" placeholder="Comentário (opcional)" maxlength="400"></textarea>
                <input type="text" id="poll-question" placeholder="Pergunta da enquete" maxlength="150">
                <select id="poll-type" name="poll-type">
                    <option value="single" selected>Seleção única</option>
                    <option value="multiple">Seleção múltipla</option>
                </select>
                <div id="poll-options">
                    <div class="poll-option-container">
                        <input type="text" class="poll-option" placeholder="Opção 1" maxlength="70">
                        <button class="remove-option" onclick="removePollOption(this)"><i class="fa-solid fa-minus"></i></button>
                    </div>
                    <div class="poll-option-container">
                        <input type="text" class="poll-option" placeholder="Opção 2" maxlength="70">
                        <button class="remove-option" onclick="removePollOption(this)"><i class="fa-solid fa-minus"></i></button>
                    </div>
                </div>
                <button onclick="addPollOption()">Adicionar Opção</button>
                <div class="poll-duration-container">
                    <p>Defina a duração da enquete:</p>
                    <select id="poll-duration" name="poll-duration">
                        <option value="8" selected>8 horas</option>
                        <option value="48">2 dias</option>
                        <option value="168">1 semana</option>
                    </select>
                </div>
                <p class="poll-note">*A enquete expira após o tempo definido.</p>
            </div>
        `,
        () => {
            const content = document.getElementById("poll-comment")?.value.trim() || "";
            const question = document.getElementById("poll-question")?.value.trim() || "";
            const options = Array.from(document.querySelectorAll(".poll-option"))
                .filter(input => input && input.value)
                .map(input => input.value.trim())
                .filter(opt => opt && opt.length > 0);
            const hours = parseInt(document.getElementById("poll-duration")?.value || 0);
            const pollType = document.getElementById("poll-type")?.value || "single";

            console.log("Options coletadas:", options); // Depuração

            if (!question) {
                addNotification("A pergunta da enquete é obrigatória!");
                return;
            }
            if (options.length < 2) {
                addNotification("A enquete deve ter pelo menos duas opções!");
                return;
            }
            if (new Set(options).size !== options.length) {
                addNotification("As opções não podem ser iguais!");
                return;
            }
            if (!hours || hours <= 0 || ![8, 48, 168].includes(hours)) {
                addNotification("Selecione uma duração válida!");
                return;
            }
            if (options.some(opt => !opt || typeof opt !== "string")) {
                addNotification("Todas as opções devem ser textos válidos!");
                return;
            }

            createPollComment(content, question, options, hours, pollType);
            document.body.classList.remove('blur-background');
            resetPollForm(); // Reseta o formulário após criar a enquete
        },
        "Criar",
        "Cancelar",
        () => {
            document.body.classList.remove('blur-background');
            resetPollForm(); // Reseta o formulário ao cancelar
        }
    );
}

function resetPollForm() {
    // Verifica se o modal já está no DOM
    const pollComment = document.getElementById("poll-comment");
    const pollQuestion = document.getElementById("poll-question");
    const pollDuration = document.getElementById("poll-duration");
    const pollType = document.getElementById("poll-type");
    const pollOptions = document.getElementById("poll-options");

    // Limpa os campos apenas se existirem
    if (pollComment) pollComment.value = "";
    if (pollQuestion) pollQuestion.value = "";
    if (pollDuration) pollDuration.value = "8"; // Define a opção padrão (8 horas)
    if (pollType) pollType.value = "single";
    if (pollOptions) {
        pollOptions.innerHTML = `
            <div class="poll-option-container">
                <input type="text" class="poll-option" placeholder="Opção 1">
                <button class="remove-option" onclick="removePollOption(this)"><i class="fa-solid fa-minus"></i></button>
            </div>
            <div class="poll-option-container">
                <input type="text" class="poll-option" placeholder="Opção 2">
                <button class="remove-option" onclick="removePollOption(this)"><i class="fa-solid fa-minus"></i></button>
            </div>
        `;
    }
}

function editPoll(path) {
    if (!currentUser.username) {
        addLoginRequiredNotification("edit poll");
        return;
    }
    const targetComment = getTargetComment(path);
    if (targetComment.username !== currentUser.username) {
        addNotification("Você só pode editar suas próprias enquetes!");
        return;
    }
    if (new Date(targetComment.poll.expiresAt) <= new Date()) {
        addNotification("Não é possível editar enquetes expiradas!");
        return;
    }

    // Calcula a duração restante em horas
    const remainingHours = Math.ceil((new Date(targetComment.poll.expiresAt) - new Date()) / (60 * 60 * 1000));
    // Seleciona a opção mais próxima (8, 48 ou 168)
    const durationOptions = [8, 48, 168];
    const selectedDuration = durationOptions.reduce((prev, curr) => 
        Math.abs(curr - remainingHours) < Math.abs(prev - remainingHours) ? curr : prev
    );

    showGenericConfirmationModal(
        "Editar Enquete",
        `
            <div class="poll-form-container">
                <textarea id="poll-comment" placeholder="Comentário">${targetComment.content}</textarea>
                <input type="text" id="poll-question" value="${targetComment.poll.question}">
                <div id="poll-options">
                    ${targetComment.poll.options.map((opt, i) => `
                        <div class="poll-option-container">
                            <input type="text" class="poll-option" value="${opt.text}">
                            <button class="remove-option" onclick="removePollOption(this)"><i class="fa-solid fa-minus"></i></button>
                        </div>
                    `).join('')}
                </div>
                <button onclick="addPollOption()">Adicionar Opção</button>
                <div class="poll-duration-container">
                    <p>Defina a duração da enquete:</p>
                    <select id="poll-duration" name="poll-duration" aria-label="Duração da enquete">
                        <option value="8" ${selectedDuration === 8 ? 'selected' : ''}>8 horas</option>
                        <option value="48" ${selectedDuration === 48 ? 'selected' : ''}>2 dias</option>
                        <option value="168" ${selectedDuration === 168 ? 'selected' : ''}>1 semana</option>
                    </select>
                </div>
            </div>
        `,
        () => {
            const content = document.getElementById("poll-comment")?.value.trim() || "";
            const question = document.getElementById("poll-question")?.value.trim() || "";
            const options = Array.from(document.querySelectorAll(".poll-option"))
                .map(input => input.value.trim())
                .filter(opt => opt);
            const hours = parseInt(document.getElementById("poll-duration")?.value || 0);

            if (!question) {
                addNotification("A pergunta da enquete é obrigatória!");
                return;
            }
            if (options.length < 2) {
                addNotification("A enquete deve ter pelo menos duas opções!");
                return;
            }
            if (new Set(options).size !== options.length) {
                addNotification("As opções não podem ser iguais!");
                return;
            }
            if (!hours || hours <= 0 || ![8, 48, 168].includes(hours)) {
                addNotification("Selecione uma duração válida!");
                return;
            }

            targetComment.content = content;
            targetComment.poll.question = question;
            targetComment.poll.options = options.map((opt, i) => ({
                text: opt,
                votes: targetComment.poll.options[i]?.votes || []
            }));
            targetComment.poll.expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
            targetComment.isEdited = true;
            targetComment.history.push(content);
            saveData();
            renderComments();
            addNotification("Enquete editada com sucesso!");
        },
        "Salvar",
        "Cancelar",
        () => {
            document.body.classList.remove('blur-background');
            resetPollForm();
        }
    );
}

function removePollOption(button) {
    const pollOptions = document.getElementById("poll-options");
    const optionContainers = pollOptions.querySelectorAll(".poll-option-container");
    if (optionContainers.length <= 2) {
        addNotification("A enquete deve ter pelo menos duas opções!");
        return;
    }
    button.parentElement.remove();
}

function showSensitiveConfirmation(path) {
    const modal = document.createElement("div");
    modal.classList.add("generic-confirmation-modal", "confirmation-modal");
    modal.innerHTML = `
        <div class="generic-confirmation-modal-content">
            <h3>Confirmar Visualização</h3>
            <p>Este conteúdo foi reportado como sensível ou potencialmente falso. Deseja visualizá-lo mesmo assim?</p>
            <div class="modal-actions">
                <button class="confirm-btn">Sim, visualizar</button>
                <button class="cancel-btn">Cancelar</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    const confirmBtn = modal.querySelector(".confirm-btn");
    const cancelBtn = modal.querySelector(".cancel-btn");

    confirmBtn.addEventListener("click", () => {
        revealComment(path); // Revela o comentário após confirmação
        modal.remove();
        addNotification("Conteúdo sensível revelado.");
    });

    cancelBtn.addEventListener("click", () => {
        modal.remove();
        addNotification("Visualização cancelada.");
    });

    modal.addEventListener("click", (e) => {
        if (e.target === modal) {
            modal.remove();
            addNotification("Visualização cancelada.");
        }
    });
}

function revealComment(path) {
    const overlay = document.getElementById(`sensitive-overlay-${path}`);
    const commentBody = document.querySelector(`[ondblclick="doubleClickLike('${path}')"]`);
    if (overlay && commentBody) {
        overlay.remove(); // Remove o overlay com o botão
        commentBody.classList.remove("blurred"); // Remove o efeito de desfoque
    }
}

function doubleClickLike(path) {
    if (!currentUser.username) {
        addLoginRequiredNotification("like");
        return;
    }

    const targetComment = getTargetComment(path);
    if (!targetComment) {
        console.error(`Comentário não encontrado para path: ${path}`);
        return;
    }

    // Só adiciona like se o usuário ainda não curtiu
    if (!targetComment.upvoters.includes(currentUser.username)) {
        likeComment(path); // Adiciona o like

        // Adiciona o coração temporário
        const commentBody = document.querySelector(`[ondblclick="doubleClickLike('${path}')"]`);
        if (commentBody) {
            const heart = document.createElement("i");
            heart.classList.add("fas", "fa-heart", "double-click-heart");
            commentBody.style.position = "relative"; // Necessário para posicionamento absoluto do coração
            commentBody.appendChild(heart);
            setTimeout(() => heart.remove(), 500); // Remove após a animação (0.5s)
        }
    }
}

function toggleCommentMenu(path, button) {
    const menu = document.getElementById(`comment-menu-${path}`);
    const isVisible = menu.style.display === 'block';
    menu.style.display = isVisible ? 'none' : 'block';

    // Fechar o menu ao clicar fora dele
    if (!isVisible) {
        document.addEventListener('click', function closeMenu(e) {
            if (!menu.contains(e.target) && e.target !== button) {
                menu.style.display = 'none';
                document.removeEventListener('click', closeMenu);
            }
        });
    }
}

function closeCommentMenu(path) {
    const menu = document.getElementById(`comment-menu-${path}`);
    if (menu) {
        menu.style.display = 'none';
    }
}

function showProfilePageForUsername(username, event) {
    event.stopPropagation(); //
    // impede a propagação do evento a fim de evitar conflitos com ourtros manipuladores de eventos do tipo "EventListener" 
    const targetUser = users.find(u => u.username === username) || { username, avatar: "./default-avatar.png" };
    showProfilePage(targetUser);
}

function getTopHashtags() {
    const hashtagCount = {};
    const hashtagRegex = /#(\w+)/g;

    function extractHashtags(comment) {
        let matches;
        while ((matches = hashtagRegex.exec(comment.content)) !== null) {
            const hashtag = matches[0].toLowerCase(); // Convertendo para minúsculas
            hashtagCount[hashtag] = (hashtagCount[hashtag] || 0) + 1;
        }
        if (comment.replies) comment.replies.forEach(extractHashtags);
    }

    comments.forEach(extractHashtags);

    return Object.entries(hashtagCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([hashtag, count]) => ({ hashtag, count }));
}

function getTopComments() {
    return [...comments]
        .sort((a, b) => b.likes - a.likes)
        .slice(0, 3);
}

function renderTrending() {
    const topHashtags = getTopHashtags();
    const topComments = getTopComments();

    const hashtagsContainer = document.getElementById("top-hashtags");
    hashtagsContainer.innerHTML = topHashtags.length
        ? topHashtags
              .map(
                  (item, index) => `
                    <div class="trending-item" onclick="searchHashtag('${item.hashtag}')">
                        <span class="hashtag-rank">${index + 1}. ${item.hashtag}</span>
                        <span class="hashtag-count">${item.count} post${item.count !== 1 ? "s" : ""}</span>
                    </div>`
              )
              .join("")
        : "<p>Nenhuma hashtag em alta.</p>";

    const commentsContainer = document.getElementById("top-comments");
    commentsContainer.innerHTML = "";
    if (topComments.length) {
        topComments.forEach(comment => {
            const commentElement = createTrendingCommentElement(comment);
            commentsContainer.appendChild(commentElement);
        });
    } else {
        commentsContainer.innerHTML = "<p>Nenhum comentário em destaque.</p>";
    }
}
//FUNÇÃO EM MANUTENÇÃO "function searchHashtag" (não funciona após implementação da pesquisa avançada na seção Explorar)------------------------
function searchHashtag(hashtag) {
    searchInput.value = hashtag;
    searchComments();
}

// Funções de ajuda
function getParentCommentIndex(path) {
    const parts = path.split("-");
    return parts[0];
}

function generateUniqueId() {
    //gera ID único baseado no timestamp e uma parte aleatória
    // O timestamp é convertido na base 36 para encurtar o ID
    const timestamp = Date.now().toString(36); // Base 36 para encurtar
    const randomStr = Math.random().toString(36).substring(2, 8); // Parte aleatória
    return `${timestamp}-${randomStr}`; // Exemplo: "1j4k5l-mn6pqr"
}

function getTargetComment(path) {
    if (!path || typeof path !== "string") {
        console.error("Path inválido:", path);
        return null;
    }
    const parts = path.split("-replies-");
    const commentId = parts[0].startsWith("comments-") ? parts[0].replace("comments-", "") : parts[0];
    let comment = comments.find(c => c.id === commentId);
    if (!comment) {
        console.error("Comentário não encontrado para ID:", commentId);
        return null;
    }
    if (parts.length > 1) {
        let current = comment.replies;
        for (let i = 1; i < parts.length; i++) {
            const replyId = parts[i].split("-")[0];
            comment = current.find(r => r.id === replyId);
            if (!comment) {
                console.error("Resposta não encontrada para ID:", replyId);
                return null;
            }
            current = comment.replies || [];
        }
    }
    return comment;
}

function likeComment(path) {
    if (!currentUser.username) {
        addLoginRequiredNotification("like");
        return;
    }
    const targetComment = getTargetComment(path);
    if (!targetComment) {
        console.error(`Comentário não encontrado para path: ${path}`);
        addNotification("Comentário não encontrado.", "error");
        return;
    }

    try {
        // Usar currentUser.id em vez de currentUser.username para consistência com createCommentElement
        const isLiked = targetComment.upvoters.includes(currentUser.id);
        targetComment.likes = targetComment.likes !== undefined ? targetComment.likes : 0;

        const button = document.querySelector(`[onclick="likeComment('${path}')"]`);
        if (!button) {
            console.warn(`Botão de like não encontrado para path: ${path}`);
            addNotification("Erro ao localizar o botão de curtida.", "error");
            return;
        }

        // Busca o perfil do usuário do comentário para obter o handle
        const targetUserProfile = JSON.parse(localStorage.getItem(`userProfile_${targetComment.username}`)) || {};
        const targetHandle = targetUserProfile.handle || `@${targetComment.username}`; // Fallback para @username

        if (!isLiked) {
            targetComment.upvoters.push(currentUser.id); // Usar id
            targetComment.likes += 1;
            awardPoints(1);
            button.classList.add("liked");
            button.innerHTML = `<i class="fa-heart fas"></i> ${targetComment.likes}`;
            button.classList.add("vote-anim"); // Animação de curtir
            setTimeout(() => button.classList.remove("vote-anim"), 300); // Duração da animação

            // Notificar o dono do comentário
            if (targetComment.username !== currentUser.username) {
                addNotificationToUser(targetComment.username, {
                    id: Date.now(),
                    avatar: userProfile.profilePic || "./default-avatar.png",
                    message: `${currentUser.username} curtiu seu comentário.`,
                    timestamp: new Date().toISOString(),
                    type: "like",
                    path: targetComment.id
                });
            }
        } else {
            targetComment.upvoters = targetComment.upvoters.filter(u => u !== currentUser.id); // Usar id
            targetComment.likes -= 1;
            button.classList.remove("liked");
            button.innerHTML = `<i class="fa-heart far"></i> ${targetComment.likes}`;
            button.classList.add("unlike-anim"); // Animação de descurtir
            setTimeout(() => button.classList.remove("unlike-anim"), 200); // Duração da animação
        }

        saveData();
        renderComments(); // Re-renderizar para garantir que todos os comentários reflitam o estado atual
    } catch (e) {
        console.error("Erro ao processar curtida:", {
            error: e.name,
            message: e.message,
            stack: e.stack
        });
        addNotification("Erro ao registrar sua curtida. Tente novamente.", "error");
    }
}

let autocompleteActive = false;
const autocompleteDiv = document.createElement("div");
autocompleteDiv.classList.add("autocomplete");
document.body.appendChild(autocompleteDiv);

function showAutocomplete(textarea, type = 'comment') {
    const value = textarea.value;
    const cursorPos = textarea.selectionStart;
    const textBeforeCursor = value.substring(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex !== -1 && (cursorPos === lastAtIndex + 1 || /\w/.test(value.substring(lastAtIndex + 1, cursorPos)))) {
        const searchTerm = value.substring(lastAtIndex + 1, cursorPos).toLowerCase();
        const filteredUsers = users.filter(user => 
            user.handle.toLowerCase().startsWith('@' + searchTerm) && user.username !== currentUser.username
        );

        if (filteredUsers.length > 0) {
            const rect = textarea.getBoundingClientRect();
            autocompleteDiv.style.display = 'block';
            autocompleteDiv.style.top = `${rect.bottom + window.scrollY}px`;
            autocompleteDiv.style.left = `${rect.left + window.scrollX}px`;
            autocompleteDiv.innerHTML = filteredUsers
                .map(user => `<div onclick="selectAutocomplete('${user.handle}', '${textarea.id}')">${user.handle} (${user.username})</div>`)
                .join('');
            autocompleteActive = true;
        } else {
            autocompleteDiv.style.display = 'none';
            autocompleteActive = false;
        }
    } else {
        autocompleteDiv.style.display = 'none';
        autocompleteActive = false;
    }
}

// Função para selecionar um usuário do autocompletar
function selectAutocomplete(handle, textareaId) {
    const textarea = document.getElementById(textareaId);
    const cursorPos = textarea.selectionStart;
    const textBeforeCursor = textarea.value.substring(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    const textAfterCursor = textarea.value.substring(cursorPos);

    // Substitui o texto parcial pelo handle completo
    textarea.value = textBeforeCursor.substring(0, lastAtIndex) + handle + ' ' + textAfterCursor;
    autocompleteDiv.style.display = 'none';
    autocompleteActive = false;

    // Posiciona o cursor após o handle inserido
    const newCursorPos = lastAtIndex + handle.length + 1;
    textarea.setSelectionRange(newCursorPos, newCursorPos);
    textarea.focus();
}

// Vincular o autocompletar ao campo de novo comentário
newCommentInput.addEventListener('input', () => {
    showAutocomplete(newCommentInput, 'comment');
});

function processMentions(content, senderUsername) {
    const mentionRegex = /@(\w+)/g;
    let match;
    console.log(`Processando menções no conteúdo: "${content}" por ${senderUsername}`);
    while ((match = mentionRegex.exec(content)) !== null) {
        const handle = match[0]; // Ex.: "@AmyR"
        console.log(`Menção encontrada: ${handle}`);
        const mentionedUser = users.find(u => u.handle === handle);
        if (mentionedUser) {
            console.log(`Usuário encontrado: ${mentionedUser.username} (${mentionedUser.handle})`);
        } else {
            console.log(`Nenhum usuário encontrado para o handle: ${handle}`);
        }
        if (mentionedUser && mentionedUser.username !== senderUsername) {
            console.log(`Gerando notificação para ${mentionedUser.username}`);
            addPersistentNotification(mentionedUser.username, {
                id: Date.now(),
                avatar: getUserAvatar(senderUsername),
                message: `${senderUsername} mencionou você em um comentário: "${content.slice(0, 20)}..."`,
                timestamp: new Date().toISOString(),
                read: false,
                type: "mention"
            });
        }
    }
}

function sortComments() {
    const sortValue = document.getElementById("sort").value;
    if (sortValue === "score") comments.sort((a, b) => b.likes - a.likes); // Renomeado para "likes"
    else if (sortValue === "time") comments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    renderComments();
}

function reportComment(path) {
    const targetComment = getTargetComment(path);

    // Modal personalizado para escolher motivo
    const modal = document.createElement("div");
    modal.classList.add("generic-confirmation-modal", "confirmation-modal");
    modal.innerHTML = `
        <div class="generic-confirmation-modal-content">
            <h3>Reportar Comentário</h3>
            <p>Por que você está reportando este comentário?</p>
            <select id="report-reason">
                <option value="spam">Spam</option>
                <option value="harassment">Assédio</option>
                <option value="inappropriate">Conteúdo impróprio</option>
                <option value="other">Outro</option>
            </select>
            <div class="modal-actions">
                <button class="confirm-btn">Reportar</button>
                <button class="cancel-btn">Cancelar</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    const confirmBtn = modal.querySelector(".confirm-btn");
    const cancelBtn = modal.querySelector(".cancel-btn");

    confirmBtn.addEventListener("click", () => {
        const reason = document.getElementById("report-reason").value;
        targetComment.reported = true;
        targetComment.reportCount = (targetComment.reportCount || 0) + 1;

        // Registro do relatório com ID único
        const reportId = generateUniqueId();
        const report = {
            id: reportId,
            path,
            commentId: targetComment.id,
            contentPreview: targetComment.content.slice(0, 50) + "...",
            date: new Date().toISOString(),
            reporter: currentUser.username,
            reason: reason,
            status: "pending",
            priority: targetComment.reportCount > 2 ? "high" : "normal"
        };
        reports.push(report);

        // Notificar moderadores
        const moderators = users.filter(u => u.role === "moderator" || u.role === "admin") || [];
        moderators.forEach(mod => {
            const isUrgent = targetComment.reportCount > 2;
            addNotificationToUser(mod.username, {
                id: Date.now(),
                avatar: getUserAvatar(currentUser.username),
                message: `${currentUser.username} reportou um comentário: "${report.contentPreview}" (Motivo: ${reason}${isUrgent ? ', URGENTE' : ''})`,
                timestamp: new Date().toISOString(),
                read: false,
                type: "report",
                path: path,
                actions: [
                    { label: "Aprovar", action: "approveReport", path: path, reportId: reportId },
                    { label: "Remover", action: "removeReportedComment", path: path, reportId: reportId },
                    { label: "Banir Usuário", action: "banUser", username: targetComment.username, reportId: reportId }
                ]
            });
        });

        // Notificar o autor do comentário
        if (targetComment.username !== currentUser.username) {
            addNotificationToUser(targetComment.username, {
                id: Date.now(),
                avatar: "https://via.placeholder.com/32",
                message: "Seu comentário foi reportado e está sob revisão: \"" + targetComment.content.slice(0, 20) + "...\"",
                timestamp: new Date().toISOString(),
                read: false,
                type: "moderation"
            });
        }

        // Aplicar filtro de desfoque após 3 reportes
        if (targetComment.reportCount >= 3) {
            targetComment.sensitive = true; // Nova propriedade para marcar como sensível
            addNotificationToUser(targetComment.username, {
                id: Date.now(),
                avatar: "https://via.placeholder.com/32",
                message: "Seu comentário foi marcado como sensível devido a múltiplos reportes.",
                timestamp: new Date().toISOString(),
                read: false,
                type: "moderation"
            });
        }

        saveData();
        renderComments();

        if (currentUser.role === "moderator" || currentUser.role === "admin") {
            renderNotifications();
            toggleNotificationsColumn();
        }

        addNotification(`Comentário reportado (${targetComment.reportCount} reportes). Motivo: ${reason}`);
        modal.remove();
    });

    cancelBtn.addEventListener("click", () => {
        addNotification("Ação de reportar cancelada.");
        modal.remove();
    });

    modal.addEventListener("click", (e) => {
        if (e.target === modal) {
            addNotification("Ação de reportar cancelada.");
            modal.remove();
        }
    });
}

// Funções de ação para moderadores
function approveReport(path, reportId) {
    const targetComment = getTargetComment(path);
    targetComment.reported = false;
    targetComment.hidden = false;
    targetComment.reportCount = 0;

    updateReportStatus(reportId, "approved");
    saveData();
    renderComments();
    addNotificationToUser(targetComment.username, {
        id: Date.now(),
        avatar: "https://via.placeholder.com/32",
        message: "Seu comentário foi revisado e aprovado por um moderador.",
        timestamp: new Date().toISOString(),
        read: false,
        type: "moderation"
    });
    addNotification("Comentário aprovado.");
}

function removeReportedComment(path, reportId) {
    const parts = path.split("-replies-");
    let targetArray = comments;
    let targetComment;

    if (parts.length === 1) {
        const index = comments.findIndex(c => c.id === parts[0]);
        targetComment = comments[index];
        comments.splice(index, 1);
    } else {
        targetComment = getTargetComment(path);
        const parentComment = getTargetComment(parts[0]);
        const replyIndex = parentComment.replies.findIndex(r => r.id === targetComment.id);
        parentComment.replies.splice(replyIndex, 1);
    }

    updateReportStatus(reportId, "removed");
    saveData();
    renderComments();
    addNotificationToUser(targetComment.username, {
        id: Date.now(),
        avatar: "https://via.placeholder.com/32",
        message: "Seu comentário foi removido por um moderador após revisão.",
        timestamp: new Date().toISOString(),
        read: false,
        type: "moderation"
    });
    addNotification("Comentário removido.");
}

function banUser(username, reportId) {
    let userProfile = JSON.parse(localStorage.getItem(`userProfile_${username}`)) || {};
    userProfile.banned = true;
    userProfile.banDate = new Date().toISOString();
    localStorage.setItem(`userProfile_${username}`, JSON.stringify(userProfile));

    comments = comments.filter(c => c.username !== username);
    updateReportStatus(reportId, "banned");
    saveData();
    renderComments();
    addNotificationToUser(username, {
        id: Date.now(),
        avatar: "https://via.placeholder.com/32",
        message: "Você foi banido da plataforma devido a violações das regras.",
        timestamp: new Date().toISOString(),
        read: false,
        type: "moderation"
    });
    addNotification(`Usuário ${username} banido.`);
}

// Atualiza o status do relatório no log de moderação
// Atualiza o status do relatório no log de moderação
function updateReportStatus(reportId, status) {
    let moderationLog = JSON.parse(localStorage.getItem("moderationLog")) || [];
    const reportIndex = moderationLog.findIndex(r => r.reportId === reportId);
    if (reportIndex !== -1) {
        moderationLog[reportIndex].status = status;
        moderationLog[reportIndex].resolvedBy = currentUser.username;
        moderationLog[reportIndex].resolvedDate = new Date().toISOString();
    }
    localStorage.setItem("moderationLog", JSON.stringify(moderationLog));

    let reportsList = JSON.parse(localStorage.getItem("reports")) || [];
    const reportIdx = reportsList.findIndex(r => r.id === reportId);
    if (reportIdx !== -1) {
        reportsList[reportIdx].status = status;
    }
    localStorage.setItem("reports", JSON.stringify(reportsList));
}

darkModeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
    saveData(); 
});
//função para ler o conteúdo de texto em voz alta do comemment-body
function readAloud(path) {
    const targetComment = getTargetComment(path);
    const utterance = new SpeechSynthesisUtterance(targetComment.content);
    window.speechSynthesis.speak(utterance);
}

function addNotification(message) {
    const notification = document.createElement("div");
    notification.classList.add("notification");
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 5000);
}

function setupCharCounter(textarea, counterId) {
    const maxChars = 1000;
    const counter = document.getElementById(counterId);

    function updateCounter() {
        const charCount = textarea.value.length;
        counter.textContent = `${charCount}/${maxChars}`;
        if (charCount > maxChars) counter.classList.add("exceeded");
        else counter.classList.remove("exceeded");
    }

    textarea.addEventListener("input", updateCounter);
    updateCounter();
}

function showReplyForm(path) {
    console.log(`Tentando mostrar formulário de resposta para path: ${path}`);
    
    // Remove qualquer formulário de resposta ou modal existente para evitar duplicatas
    const existingForm = document.querySelector(`.add-reply[data-path="${path}"]`);
    if (existingForm) existingForm.remove();
    const existingModal = document.querySelector(`.reply-modal[data-path="${path}"]`);
    if (existingModal) existingModal.remove();

    // Encontra o elemento do comentário
    const commentElement = Array.from(commentsContainer.children).find(el => 
        el.querySelector(`[onclick="showReplyForm('${path}')"]`)
    );
    if (!commentElement) {
        console.error(`Elemento do comentário não encontrado para path: ${path}`);
        return;
    }

    // Busca o comentário principal
    const targetComment = getTargetComment(path);
    if (!targetComment) {
        console.error(`Comentário alvo não encontrado para path: ${path}`);
        return;
    }

    // Busca o perfil do usuário do comentário principal
    const commentUserProfile = JSON.parse(localStorage.getItem(`userProfile_${targetComment.userId}`)) || { 
        profilePic: targetComment.avatar || "placeholder-profile-image.png",
        handle: targetComment.handle || `@${targetComment.username}`,
        visibility: "public",
        accountType: "common"
    };

    // Processa o conteúdo do comentário principal
    let displayContent = escapeHTML(targetComment.content);
    displayContent = displayContent
        .replace(/@(\w+)/g, '<span class="mention" onclick="showProfilePageForUsername(\'$1\', event)">@$1</span>')
        .replace(/#(\w+)/g, '<span class="hashtag">#$1</span>')
        .replace(/\n/g, '<br>');

    // Adiciona imagens, se existirem
    let imagesHtml = "";
    if (targetComment.images && Array.isArray(targetComment.images) && targetComment.images.length > 0) {
        const maxImages = Math.min(targetComment.images.length, 4);
        imagesHtml = `<div class="comment-images images-${maxImages}" style="background-image: url('${targetComment.images[0]}');">`;
        targetComment.images.slice(0, maxImages).forEach((imageSrc, index) => {
            if (typeof imageSrc === 'string' && imageSrc.trim() !== '') {
                imagesHtml += `<img src="${imageSrc}" alt="Attached image ${index + 1}" class="comment-image image-${index + 1}" onclick="openPostedImageModal('${path}', ${index})">`;
            }
        });
        imagesHtml += `</div>`;
    }

    // Adiciona enquete, se existir
    let pollHtml = "";
    if (targetComment.poll) {
        const isExpired = new Date(targetComment.poll.expiresAt) <= new Date();
        const uniqueVoters = [...new Set(targetComment.poll.options.flatMap(opt => opt.votes || []))].length;
        const totalVotes = targetComment.poll.options.reduce((sum, opt) => sum + (opt.votes?.length || 0), 0);
        pollHtml = `
            <div class="poll ${isExpired ? 'expired' : ''}">
                <h4>${escapeHTML(targetComment.poll.question)}</h4>
                <div class="poll-header">
                    ${isExpired ? `<span class="poll-expired">Encerrada</span> <span class="poll-expired-time">(${timeAgo(targetComment.poll.expiresAt)})</span>` : ''}
                </div>
                ${targetComment.poll.options.map((opt, i) => {
                    const percentage = totalVotes ? (opt.votes?.length / totalVotes * 100) || 0 : 0;
                    const formattedPercentage = Number.isInteger(percentage) ? percentage : percentage.toFixed(1);
                    return `
                        <div class="poll-option">
                            <button disabled>${escapeHTML(opt.text)}</button>
                            <span>${formattedPercentage}%</span>
                            <div class="poll-bar" style="width: ${percentage}%"></div>
                        </div>
                    `;
                }).join('')}
                <div class="poll-total-votes" style="text-align: right; margin-top: 10px; font-size: 12px;">
                    ${uniqueVoters} voto${uniqueVoters !== 1 ? 's' : ''}
                </div>
            </div>
        `;
    }

    // Cria o modal
    const modal = document.createElement("div");
    modal.classList.add("reply-modal");
    modal.setAttribute("data-path", path);
    modal.innerHTML = `
        <div class="modal-reply-overlay" onclick="cancelReplyForm('${path}')"></div>
        <div class="modal-reply-content">
            <div class="main-comment-reply">
            <div class="main-comment">
                <div class="comment-header-reply">
                    <img src="${commentUserProfile.profilePic}" alt="Avatar" class="avatar-reply" onclick="showProfilePageForUsername('${targetComment.username}', event)">
                    <div class="comment-header-info">
                        <span class="username" onclick="showProfilePageForUsername('${targetComment.username}', event)">${targetComment.username}</span>
                        <span class="handle">${commentUserProfile.handle}</span>
                    </div>
                </div>
                <div class="comment-body-reply">${displayContent}${imagesHtml}${pollHtml}</div>
                <span class="time-reply">${timeAgo(targetComment.createdAt)}</span>
            </div>
            </div>
            <div class="add-reply">
                <img src="${currentUser.avatar}" alt="Avatar" class="avatar">
                <div class="comment-input-container">
                    <textarea id="reply-${path}" placeholder="No que você está pensando?" rows="1"></textarea>
                    <span id="char-count-reply-${path}" class="char-count">0/1000</span>
                    <div class="comment-actions">
                        <input type="file" id="reply-image-${path}" accept="image/*" style="display: none;">
                        <button onclick="uploadReplyImage('${path}')"><i class="fa-solid fa-photo-film"></i></button>
                        <button onclick="addReply('${path}')">Comentar</button>
                        <button onclick="cancelReplyForm('${path}')">Cancelar</button>
                    </div>
                </div>
                <div id="comment-preview-${path}" class="comment-preview" style="display: none;"></div>
            </div>
        </div>
    `;

    // Adiciona o modal ao corpo do documento
    document.body.appendChild(modal);

    // Configura o campo de entrada
    const replyInput = document.getElementById(`reply-${path}`);
    if (!replyInput) {
        console.error(`Textarea de resposta não encontrado para path: ${path}`);
        modal.remove();
        return;
    }
    setupCharCounter(replyInput, `char-count-reply-${path}`);
    replyInput.addEventListener("input", () => {
        replyInput.style.height = "auto";
        replyInput.style.height = `${replyInput.scrollHeight}px`;
    });
}

function addReply(path) {
    if (!currentUser.id || !currentUser.username) {
        addLoginRequiredNotification("reply");
        return;
    }

    comments = JSON.parse(localStorage.getItem("comments")) || [];
    const targetComment = getTargetComment(path);
    if (!targetComment) {
        addNotification("Comentário não encontrado!");
        console.error(`Comentário não encontrado para o path: ${path}`);
        return;
    }

    const replyInput = document.querySelector(`#reply-${path}`);
    if (!replyInput) {
        addNotification("Campo de resposta não encontrado!");
        console.error(`Campo de resposta não encontrado para o path: ${path}`);
        return;
    }

    const content = replyInput.value.trim();
    if (content.length > 1000) {
        showGenericConfirmationModal(
            "Aviso",
            "A resposta excede o limite de 1000 caracteres.",
            null,
            "OK",
            null,
            false
        );
        return;
    }

    if (content) {
        const newReply = {
            id: generateUniqueId(),
            userId: currentUser.id, // Usar userId em vez de username
            username: currentUser.username, // Mantido para exibição
            handle: currentUser.handle || `@${currentUser.username}`,
            avatar: currentUser.avatar || "./default-avatar.png",
            content: content,
            createdAt: new Date().toISOString(),
            likes: 0,
            replies: [],
            image: null,
            history: [content],
            reported: false,
            featured: false,
            retweet: null,
            isEdited: false,
            upvoters: [],
            pinned: false // Adicionado para consistência com lógica de fixação
        };

        if (!targetComment.replies) targetComment.replies = [];
        targetComment.replies.push(newReply);

        // Conceder pontos
        awardPoints(10);

        // Notificar o autor do comentário principal
        addPersistentNotification(
            `${currentUser.handle} respondeu ao seu comentário.`,
            "reply",
            { target: targetComment.username }
        );
        addNotificationToUser(targetComment.username, {
            id: Date.now(),
            avatar: currentUser.avatar || "./default-avatar.png",
            message: `${currentUser.handle} respondeu ao seu comentário: "${content.slice(0, 20)}..."`,
            timestamp: new Date().toISOString(),
            read: false,
            type: "reply"
        });

        // Processar menções adicionais no conteúdo da reply
        processMentions(content, currentUser.username);

        // Salvar dados
        saveData();
        renderComments();

        // Atualizar a interface para exibir as replies
        const commentElement = Array.from(commentsContainer.children).find(el =>
            el.querySelector(`[onclick="showReplyForm('${targetComment.id}')"]`)
        );
        if (commentElement) {
            const repliesDiv = commentElement.querySelector(".replies");
            const toggleButton = commentElement.querySelector(".view-replies");
            if (repliesDiv && toggleButton) {
                repliesDiv.classList.add("visible");
                const replyCount = countReplies(targetComment.replies);
                toggleButton.innerHTML = `<i class="fa-regular fa-comment"></i> ${replyCount}`;
            }
        }

        // Limpar o campo de entrada
        replyInput.value = "";
        addNotification("Resposta publicada com sucesso!");
    }
}

// Vincular o autocompletar ao formulário de resposta
document.addEventListener('input', (e) => {
    if (e.target.id && e.target.id.startsWith('reply-')) {
        showAutocomplete(e.target, 'reply');
    }
});

function cancelReplyForm(path) {
    const modal = document.querySelector(`.reply-modal[data-path="${path}"]`);
    if (modal) modal.remove();
}

function showRetweetForm(path) {
    if (!currentUser.username) {
        addLoginRequiredNotification("retweet");
        return;
    }
    const existingForms = document.querySelectorAll(".retweet-form");
    existingForms.forEach(form => form.remove());

    const parentCommentIndex = getParentCommentIndex(path);
    const commentElement = commentsContainer.children[parentCommentIndex];
    const targetComment = getTargetComment(path);

    let retweetDisplayContent = targetComment.content;
    if (targetComment.content && targetComment.content.startsWith("@")) {
        const [tag, ...rest] = targetComment.content.split(" ");
        retweetDisplayContent = `<span class="tag">${tag}</span> ${rest.join(" ")}`;
    }
    if (targetComment.image) retweetDisplayContent += `<img src="${targetComment.image}" alt="Attached image">`;

    const retweetForm = document.createElement("div");
    retweetForm.classList.add("retweet-form");
    retweetForm.innerHTML = `
        <div class="retweet-preview">
            <div class="comment-header">
                <img src="${targetComment.avatar}" alt="Avatar" class="avatar">
                <span class="username">${targetComment.username}</span>
                <span class="time">${timeAgo(targetComment.createdAt)}</span>
            </div>
            <div class="comment-body">${retweetDisplayContent}</div>
        </div>
        <div class="retweet-input">
            <img src="${currentUser.avatar}" alt="Avatar" class="avatar">
            <div class="comment-input-container">
                <textarea id="retweet-${path}" placeholder="Adicione um comentário (opcional)" rows="1"></textarea>
                <span id="char-count-retweet-${path}" class="char-count">0/400</span>
                <div class="comment-actions">
                    <button onclick="retweetComment('${path}')">Repostar</button>
                    <button onclick="cancelRetweetForm('${path}')">Cancelar</button>
                </div>
            </div>
        </div>
    `;
    commentElement.appendChild(retweetForm);

    const retweetInput = document.getElementById(`retweet-${path}`);
    setupCharCounter(retweetInput, `char-count-retweet-${path}`);
    retweetInput.addEventListener("input", () => {
        retweetInput.style.height = "auto";
        retweetInput.style.height = `${retweetInput.scrollHeight}px`;
    });
}

function retweetComment(path) {
    const targetComment = getTargetComment(path);
    const retweetInput = document.getElementById(`retweet-${path}`);
    const additionalContent = retweetInput.value.trim();

    if (additionalContent.length > 400) {
        alert("O comentário do repost excede o limite de 400 caracteres.");
        return;
    }

    const newRetweet = {
        username: currentUser.username,
        avatar: currentUser.avatar,
        content: additionalContent || "",
        createdAt: new Date().toISOString(),
        likes: 0, // Substitui "score"
        replies: [],
        image: null,
        history: [additionalContent || "Repostado"],
        reported: false,
        featured: false,
        retweet: {
            username: targetComment.username,
            avatar: targetComment.avatar,
            content: targetComment.content,
            createdAt: targetComment.createdAt,
            image: targetComment.image
        },
        isEdited: false,
        upvoters: []
    };

    comments.push(newRetweet);
    awardPoints(8);
    saveData();
    renderComments();

    if (targetComment.username !== currentUser.username) {
        addPersistentNotification(`Você repostou o comentário de ${targetComment.username}.`, "retweet");
        addNotificationToUser(targetComment.username, {
            id: Date.now(),
            avatar: currentUser.avatar,
            message: `${currentUser.username} repostou seu comentário: "${targetComment.content.slice(0, 20)}..."`,
            timestamp: new Date().toISOString(),
            read: false,
            type: "retweet"
        });
    }
}

function cancelRetweetForm(path) {
    const parentCommentIndex = getParentCommentIndex(path);
    const commentElement = commentsContainer.children[parentCommentIndex];
    const retweetForm = commentElement.querySelector(".retweet-form");
    if (retweetForm) retweetForm.remove();
}

function uploadReplyImage(path) {
    const input = document.getElementById(`reply-image-${path}`);
    input.click();
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const targetComment = getTargetComment(path);
                if (!targetComment.replies) targetComment.replies = [];
                targetComment.replies[targetComment.replies.length - 1].image = event.target.result;
                saveData();
                renderComments();
            };
            reader.readAsDataURL(file);
        }
    };
}

let selectedImages = [];

function uploadImage() {
    const imageUpload = document.getElementById("image-upload");
    const previewContainer = document.getElementById("image-preview");
    const removeImageBtn = document.getElementById("remove-image");
    const modal = document.getElementById("image-modal");
    const modalImage = document.getElementById("modal-image");
    const modalClose = document.getElementById("modal-close");
    const modalPrev = document.getElementById("modal-prev");
    const modalNext = document.getElementById("modal-next");
    const zoomSlider = document.getElementById("zoom-slider");
    const cropImage = document.getElementById("crop-image");
    const imageWindow = document.querySelector(".image-window");
    const modalImageContainer = document.querySelector(".modal-image-container");

    let currentImageIndex = 0;
    let zoomLevel = 1;
    let translateX = 0;
    let translateY = 0;
    let dragStart = null;

    imageUpload.setAttribute("multiple", "multiple");
    imageUpload.accept = "image/*";

    imageUpload.click();
    imageUpload.onchange = (e) => {
        const files = Array.from(e.target.files);

        if (files.length + selectedImages.length > 4) {
            addNotification("Você pode carregar no máximo 4 imagens!");
            return;
        }

        files.forEach(file => {
            if (!file.type.startsWith("image/")) return;
            const reader = new FileReader();
            reader.onload = (event) => {
                selectedImages.push(event.target.result);
                updatePreview();
                addNotification("Imagem carregada para pré-visualização!");
            };
            reader.readAsDataURL(file);
        });

        imageUpload.value = "";
    };

    function updatePreview() {
        previewContainer.innerHTML = '';
        previewContainer.className = `image-preview images-${selectedImages.length}`;
        previewContainer.style.display = selectedImages.length ? "" : "none";

        selectedImages.forEach((src, index) => {
            // Criar contêiner para a imagem e o botão de remoção
            const imageContainer = document.createElement("div");
            imageContainer.className = "preview-image-container";

            // Criar imagem
            const img = document.createElement("img");
            img.src = src;
            img.className = `preview-image image-${index + 1}`;
            img.style.cursor = "pointer";
            img.onerror = () => {
                console.error(`Erro ao carregar imagem no preview, índice: ${index}`);
                img.src = '';
            };
            img.onclick = () => openModal(index);

            if (index === 3 && selectedImages.length > 4) {
                const excessCount = selectedImages.length - 4;
                const indicator = document.createElement("span");
                indicator.className = "excess-indicator";
                indicator.textContent = `+${excessCount}`;
                imageContainer.appendChild(indicator);
            }

            // Criar botão de remoção
            const removeBtn = document.createElement("button");
            removeBtn.className = "remove-preview-image";
            removeBtn.innerHTML = "X";
            removeBtn.onclick = (e) => {
                e.stopPropagation(); // Evitar que o clique no botão abra o modal
                selectedImages.splice(index, 1); // Remover imagem do array
                updatePreview();
                addNotification("Imagem removida da pré-visualização.");
            };

            // Adicionar imagem e botão ao contêiner
            imageContainer.appendChild(img);
            imageContainer.appendChild(removeBtn);
            previewContainer.appendChild(imageContainer);
        });
    }

    function adjustWindowSize(img) {
        const naturalWidth = img.naturalWidth;
        const naturalHeight = img.naturalHeight;
        const modalRect = modal.getBoundingClientRect();
        const maxWidth = modalRect.width * 0.9;
        const maxHeight = modalRect.height * 0.9;

        const aspectRatio = naturalWidth / naturalHeight;
        let windowWidth, windowHeight;

        if (naturalWidth > naturalHeight) {
            windowWidth = Math.min(naturalWidth, maxWidth);
            windowHeight = windowWidth / aspectRatio;
            if (windowHeight > maxHeight) {
                windowHeight = maxHeight;
                windowWidth = windowHeight * aspectRatio;
            }
        } else {
            windowHeight = Math.min(naturalHeight, maxHeight);
            windowWidth = windowHeight * aspectRatio;
            if (windowWidth > maxWidth) {
                windowWidth = maxWidth;
                windowHeight = windowWidth / aspectRatio;
            }
        }

        modalImageContainer.style.width = `${windowWidth}px`;
        modalImageContainer.style.height = `${windowHeight}px`;
        imageWindow.style.width = `${windowWidth}px`;
        imageWindow.style.height = `${windowHeight}px`;

        zoomLevel = 1;
        zoomSlider.value = 0;
        updateImageTransform();
    }

    function openModal(index) {
        currentImageIndex = index;
        modalImage.src = selectedImages[currentImageIndex];
        zoomLevel = 1;
        translateX = 0;
        translateY = 0;
        zoomSlider.value = 0;
        modal.style.display = "flex";
        updateModalNav();

        const img = new Image();
        img.src = modalImage.src;
        img.onload = () => {
            adjustWindowSize(img);
        };
        img.onerror = () => {
            console.error("Erro ao carregar imagem para ajustar janela");
            addNotification("Erro ao carregar imagem.");
        };
    }

    function updateModalNav() {
        modalPrev.style.display = currentImageIndex > 0 ? "block" : "none";
        modalNext.style.display = currentImageIndex < selectedImages.length - 1 ? "block" : "none";
    }

    function updateImageTransform() {
        modalImage.style.transform = `scale(${zoomLevel}) translate(${translateX}px, ${translateY}px)`;
    }

    modalClose.onclick = () => {
        modal.style.display = "none";
    };

    modalPrev.onclick = () => {
        if (currentImageIndex > 0) {
            currentImageIndex--;
            modalImage.src = selectedImages[currentImageIndex];
            zoomLevel = 1;
            translateX = 0;
            translateY = 0;
            zoomSlider.value = 0;
            updateImageTransform();
            updateModalNav();

            const img = new Image();
            img.src = modalImage.src;
            img.onload = () => {
                adjustWindowSize(img);
            };
        }
    };

    modalNext.onclick = () => {
        if (currentImageIndex < selectedImages.length - 1) {
            currentImageIndex++;
            modalImage.src = selectedImages[currentImageIndex];
            zoomLevel = 1;
            translateX = 0;
            translateY = 0;
            zoomSlider.value = 0;
            updateImageTransform();
            updateModalNav();

            const img = new Image();
            img.src = modalImage.src;
            img.onload = () => {
                adjustWindowSize(img);
            };
        }
    };

    zoomSlider.oninput = () => {
        const sliderValue = zoomSlider.value / 100;
        zoomLevel = 1 + (sliderValue * (3 - 1));
        updateImageTransform();
    };

    modalImage.onmousedown = (e) => {
        e.preventDefault();
        dragStart = { x: e.clientX, y: e.clientY, startX: translateX, startY: translateY };
        document.onmousemove = (e) => {
            if (dragStart) {
                const dx = (e.clientX - dragStart.x) / zoomLevel;
                const dy = (e.clientY - dragStart.y) / zoomLevel;
                translateX = dragStart.startX + dx;
                translateY = dragStart.startY + dy;

                const img = modalImage;
                const windowRect = imageWindow.getBoundingClientRect();
                const imgRect = img.getBoundingClientRect();
                const scaledWidth = imgRect.width * zoomLevel;
                const scaledHeight = imgRect.height * zoomLevel;

                const maxX = (scaledWidth - windowRect.width) / (2 * zoomLevel);
                const maxY = (scaledHeight - windowRect.height) / (2 * zoomLevel);
                translateX = Math.max(-maxX, Math.min(maxX, translateX));
                translateY = Math.max(-maxY, Math.min(maxY, translateY));

                updateImageTransform();
            }
        };
        document.onmouseup = () => {
            dragStart = null;
            document.onmousemove = null;
            document.onmouseup = null;
        };
    };

    cropImage.onclick = () => {
        const img = new Image();
        img.src = modalImage.src;
        img.onload = () => {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            const windowRect = imageWindow.getBoundingClientRect();
            const imgRect = modalImage.getBoundingClientRect();

            const windowWidth = windowRect.width;
            const windowHeight = windowRect.height;

            const scale = img.width / (imgRect.width * zoomLevel);
            canvas.width = windowWidth * scale;
            canvas.height = windowHeight * scale;

            const offsetX = (-translateX * scale) + (img.width * (1 - 1/zoomLevel) / 2);
            const offsetY = (-translateY * scale) + (img.height * (1 - 1/zoomLevel) / 2);

            console.log({
                windowWidth, windowHeight, scale, offsetX, offsetY,
                imgWidth: img.width, imgHeight: img.height, zoomLevel
            });

            ctx.drawImage(
                img,
                offsetX,
                offsetY,
                windowWidth * scale,
                windowHeight * scale,
                0,
                0,
                windowWidth * scale,
                canvas.height
            );

            const croppedImage = canvas.toDataURL("image/png");
            if (croppedImage === "data:,") {
                console.error("Imagem cortada está vazia!");
                addNotification("Erro ao cortar a imagem. Tente novamente.");
                return;
            }

            selectedImages[currentImageIndex] = croppedImage;
            updatePreview();
            modal.style.display = "none";
        };
        img.onerror = () => {
            console.error("Erro ao carregar imagem para corte");
            addNotification("Erro ao carregar imagem para corte.");
        };
    };

    removeImageBtn.onclick = () => {
        selectedImages = [];
        previewContainer.style.display = "none";
        previewContainer.innerHTML = '';
        imageUpload.value = "";
        addNotification("Imagens removidas da pré-visualização.");
    };
}
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

function showHistory(path) {
    const targetComment = getTargetComment(path);
    const modal = document.createElement("div");
    modal.classList.add("history-modal");
    modal.classList.add("active");
    modal.innerHTML = `
        <button class="close" onclick="this.parentElement.remove()">×</button>
        <p>Mensagem original: "${targetComment.history[0] || 'Nenhuma edição anterior'}"</p>
    `;
    document.body.appendChild(modal);
}

function editComment(path) {
    const targetComment = getTargetComment(path);
    const commentElement = document.querySelector(`[onclick="editComment('${path}')"]`).parentElement.parentElement;
    const commentBody = commentElement.querySelector(".comment-body");

    if (commentBody.querySelector("textarea")) return;

    const originalContent = targetComment.content;

    const editTextarea = document.createElement("textarea");
    editTextarea.value = targetComment.content;
    editTextarea.rows = 2;
    editTextarea.style.width = "100%";
    editTextarea.style.resize = "vertical";
    editTextarea.addEventListener("input", () => {
        editTextarea.style.height = "auto";
        editTextarea.style.height = `${editTextarea.scrollHeight}px`;
        showAutocomplete(newCommentInput)
    });

    commentBody.innerHTML = "";
    commentBody.appendChild(editTextarea);

    const actionsDiv = document.createElement("div");
    actionsDiv.classList.add("edit-actions");
    actionsDiv.innerHTML = `
        <button onclick="saveEdit('${path}')">Salvar</button>
        <button onclick="cancelEdit('${path}', '${originalContent.replace(/'/g, "\\'")}')">Cancelar</button>
    `;
    commentBody.appendChild(actionsDiv);

    editTextarea.focus();
}

function saveEdit(path) {
    const targetComment = getTargetComment(path);
    const commentElement = document.querySelector(`[onclick="editComment('${path}')"]`).parentElement.parentElement;
    const commentBody = commentElement.querySelector(".comment-body");
    const editTextarea = commentBody.querySelector("textarea");
    const newContent = editTextarea.value.trim();

    if (newContent.length > 1000) {
        alert("O comentário editado excede o limite de 1000 caracteres.");
        return;
    }
    if (newContent && newContent !== targetComment.content) {
        targetComment.history.push(targetComment.content);
        targetComment.content = newContent;
        targetComment.isEdited = true;
        awardPoints(3);
        saveData();
    }

    let displayContent = newContent.replace(/#(\w+)/g, '<span class="hashtag">#$1</span>');
    if (newContent.startsWith("@")) {
        const [tag, ...rest] = newContent.split(" ");
        displayContent = `<span class="tag">${tag}</span> ${rest.join(" ").replace(/#(\w+)/g, '<span class="hashtag">#$1</span>')}`;
    }
    if (targetComment.image) displayContent += `<img src="${targetComment.image}" alt="Attached image">`;
    if (targetComment.retweet) {
        let retweetDisplayContent = targetComment.retweet.content;
        if (targetComment.retweet.content && targetComment.retweet.content.startsWith("@")) {
            const [tag, ...rest] = targetComment.retweet.content.split(" ");
            retweetDisplayContent = `<span class="tag">${tag}</span> ${rest.join(" ")}`;
        }
        if (targetComment.retweet.image) retweetDisplayContent += `<img src="${targetComment.retweet.image}" alt="Attached image">`;
        displayContent += `
            <div class="retweet-content">
                <div class="comment-header">
                    <img src="${targetComment.retweet.avatar}" alt="Avatar" class="avatar" onclick="showProfilePageForUsername('${targetComment.retweet.username}', event)">
                    <span class="username" onclick="showProfilePageForUsername('${targetComment.retweet.username}', event)">${targetComment.retweet.username}</span>
                    <span class="time">${timeAgo(targetComment.retweet.createdAt)}</span>
                </div>
                <div class="comment-body">${retweetDisplayContent}</div>
            </div>
        `;
    }
    commentBody.innerHTML = displayContent;

    const editButton = commentElement.querySelector(`[onclick="editComment('${path}')"]`);
    if (editButton) {
        const editedLabel = document.createElement("span");
        editedLabel.classList.add("edited-label");
        editedLabel.textContent = "editado";
        editButton.parentElement.replaceChild(editedLabel, editButton);
    }
}

// Função de validação de email
function validateEmail(email) {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
}

// Função de validação de senha
function validatePassword(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (password.length < minLength) return "A senha deve ter pelo menos 8 caracteres.";
    if (!hasUpperCase) return "A senha deve conter pelo menos uma letra maiúscula.";
    if (!hasLowerCase) return "A senha deve conter pelo menos uma letra minúscula.";
    if (!hasNumber) return "A senha deve conter pelo menos um número.";
    if (!hasSpecialChar) return "A senha deve conter pelo menos um caractere especial.";
    return null;
}

// Função para calcular a força da senha
function calculatePasswordStrength(password) {
    let score = 0;
    const length = password.length;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (length >= 8) score += 25;
    if (hasUpperCase) score += 25;
    if (hasLowerCase) score += 25;
    if (hasNumber) score += 15;
    if (hasSpecialChar) score += 10;

    score = Math.min(score, 100);

    const strengthBar = document.getElementById('password-strength-bar');
    const strengthFill = strengthBar.querySelector('div') || document.createElement('div');
    if (!strengthBar.contains(strengthFill)) strengthBar.appendChild(strengthFill);

    const meetsMinimumRequirements = length >= 8 && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar;

    if (!meetsMinimumRequirements) {
        if (score <= 50) {
            strengthBar.className = 'password-strength-bar weak';
            strengthFill.style.width = `${score}%`;
        } else {
            strengthBar.className = 'password-strength-bar medium';
            strengthFill.style.width = `${score}%`;
        }
    } else {
        strengthBar.className = 'password-strength-bar strong';
        strengthFill.style.width = `${score}%`;
    }

    return score;
}

function cancelEdit(path, originalContent) {
    const targetComment = getTargetComment(path);
    const commentElement = document.querySelector(`[onclick="editComment('${path}')"]`).parentElement.parentElement;
    const commentBody = commentElement.querySelector(".comment-body");

    let displayContent = originalContent;
    if (originalContent.startsWith("@")) {
        const [tag, ...rest] = originalContent.split(" ");
        displayContent = `<span class="tag">${tag}</span> ${rest.join(" ")}`;
    }
    if (targetComment.image) displayContent += `<img src="${targetComment.image}" alt="Attached image">`;
    if (targetComment.retweet) {
        let retweetDisplayContent = targetComment.retweet.content;
        if (targetComment.retweet.content && targetComment.retweet.content.startsWith("@")) {
            const [tag, ...rest] = targetComment.retweet.content.split(" ");
            retweetDisplayContent = `<span class="tag">${tag}</span> ${rest.join(" ")}`;
        }
        if (targetComment.retweet.image) retweetDisplayContent += `<img src="${targetComment.retweet.image}" alt="Attached image">`;
        displayContent += `
            <div class="retweet-content">
                <div class="comment-header">
                    <img src="${targetComment.retweet.avatar}" alt="Avatar" class="avatar">
                    <span class="username">${targetComment.retweet.username}</span>
                    <span class="time">${timeAgo(targetComment.retweet.createdAt)}</span>
                </div>
                <div class="comment-body">${retweetDisplayContent}</div>
            </div>
        `;
    }
    commentBody.innerHTML = displayContent;
}

function showGenericConfirmationModal(title, content, onConfirm, confirmText = "Confirmar", cancelText = "Cancelar", onCancel) {
    // Remove qualquer modal existente
    const existingModal = document.querySelector(".generic-confirmation-modal");
    if (existingModal) existingModal.remove();

    const modal = document.createElement("div");
    modal.classList.add("generic-confirmation-modal", "confirmation-modal");
    modal.innerHTML = `
        <div class="generic-confirmation-modal-content">
            <h3>${title}</h3>
            ${typeof content === "string" ? content : content.outerHTML}
            <div class="modal-actions">
                ${onConfirm ? `<button class="confirm-btn">${confirmText}</button>` : ""}
                <button class="cancel-btn">${cancelText}</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    if (onConfirm) {
        modal.querySelector(".confirm-btn").addEventListener("click", () => {
            onConfirm();
            modal.remove();
        });
    }
    modal.querySelector(".cancel-btn").addEventListener("click", () => {
        if (onCancel) onCancel();
        modal.remove();
    });
    modal.addEventListener("click", (e) => {
        if (e.target === modal) {
            if (onCancel) onCancel();
            modal.remove();
        }
    });
}

function deleteComment(path) {
    if (!currentUser.id) {
        addNotification("Você precisa estar logado para excluir um comentário.");
        return;
    }

    const targetComment = getTargetComment(path);
    if (!targetComment) {
        addNotification("Comentário não encontrado!");
        console.error(`Comentário não encontrado para o path: ${path}`);
        return;
    }

    // Verificar permissões
    const isCommentOwner = targetComment.userId === currentUser.id;
    const isParentOwner = path.includes("-replies-") && getParentCommentOwner(path) === currentUser.id;
    if (!isCommentOwner && !isParentOwner) {
        addNotification("Você não tem permissão para excluir este comentário!");
        return;
    }

    // Confirmar exclusão
    showGenericConfirmationModal(
        "Confirmar Exclusão?",
        "Essa ação não poderá ser desfeita, e o post será removido do seu perfil, da timeline de todas as contas que seguem você e dos resultados de busca. ",
        () => {
            // Lógica de exclusão
            const pathParts = path.split("-replies-");
            if (pathParts.length === 1) {
                // Comentário principal
                const commentId = pathParts[0].startsWith("comments-") ? pathParts[0].replace("comments-", "") : pathParts[0];
                comments = comments.filter(c => c.id !== commentId);
            } else {
                // Reply
                let current = comments;
                const ids = pathParts[0].replace("comments-", "").split("-");
                for (const id of ids) {
                    const comment = current.find(c => c.id === id);
                    if (!comment) {
                        addNotification("Erro ao localizar o comentário pai!");
                        console.error(`Comentário pai não encontrado para ID: ${id}`);
                        return;
                    }
                    current = comment.replies;
                }
                const replyId = pathParts[1].split("-")[0];
                const replyIndex = current.findIndex(r => r.id === replyId);
                if (replyIndex === -1) {
                    addNotification("Resposta não encontrada!");
                    console.error(`Resposta não encontrada para ID: ${replyId}`);
                    return;
                }
                current.splice(replyIndex, 1);
            }

            // Salvar alterações
            saveData();
            renderComments();
            addNotification("Comentário excluído com sucesso!");

            // Atualizar página de perfil, se visível
            const profileContainer = document.querySelector('.profile-container');
            if (profileContainer && profileContainer.querySelector('.profile-username')?.textContent === currentUser.username) {
                showProfilePage(currentUser);
            }
        },
        "Excluir",
        "Cancelar",
        true
    );
}

// Gamificação
function awardPoints(points) {
    userProfile.points = (userProfile.points || 0) + points;

    const badges = [
        { threshold: 50, badge: "Iniciante", icon: '<i class="fa-solid fa-star" style="color:rgb(73, 172, 90);"></i>' },
        { threshold: 150, badge: "Usuário Engajado", icon: '<i class="fa-solid fa-star-and-crescent" style="color:rgb(162, 35, 35);"></i>' },
        { threshold: 300, badge: "Contribuidor Ativo", icon: '<i class="fa-solid fa-bahai" style="color: #ffd700;"></i>' },
        { threshold: 500, badge: "Mestre da Comunidade", icon: '<i class="fa-solid fa-hand-sparkles" style="color:rgb(15, 134, 143);"></i>' },
        { threshold: 1000, badge: "Lenda", icon: '<i class="fa-solid fa-jedi" style="color:rgb(108, 5, 177);"></i>' }
    ];

    badges.forEach(level => {
        if (userProfile.points >= level.threshold && !userProfile.badges.includes(level.badge)) {
            userProfile.badges = userProfile.badges.filter(badge => 
                !badges.some(prevLevel => prevLevel.badge === badge && prevLevel.threshold < level.threshold)
            );
            userProfile.badges.push(level.badge);
            addPersistentNotification(`Parabéns! Você ganhou o emblema de ${level.icon} ${level.badge}!`, "achievement");
        }
    });

    saveData();
    updateProfileColumn();
}

function updateBadgesUI() {
    const badgeElements = document.querySelectorAll('.badge');
    const latestBadge = userProfile.badges.length > 0 ? userProfile.badges[0] : '';
    const badgeIcon = latestBadge ? getBadgeIcon(latestBadge) : '';

    badgeElements.forEach(badge => {
        if (latestBadge) {
            badge.innerHTML = `${badgeIcon} ${latestBadge}`;
        } else {
            badge.innerHTML = ''; // Remove o badge se não houver nenhum
        }
    });
}

// Função auxiliar para pegar o ícone correto com base no badge
function getBadgeIcon(badgeName) {
    const badges = [
        { badge: "Iniciante", icon: '<i class="fa-solid fa-star"></i>' },
        { badge: "Usuário Engajado", icon: '<i class="fa-solid fa-star-and-crescent"></i>' },
        { badge: "Contribuidor Ativo", icon: '<i class="fa-solid fa-bahai"></i>' },
        { badge: "Mestre da Comunidade", icon: '<i class="fa-solid fa-hand-sparkles"></i>' },
        { badge: "Lenda", icon: '<i class="fa-solid fa-jedi"></i>' }
    ];
    const badgeData = badges.find(b => b.badge === badgeName);
    return badgeData ? badgeData.icon : '';
}

function updateCommentOfTheDay() {
    const today = new Date().toDateString();
    let maxScore = -Infinity;
    let featuredComment = null;

    comments.forEach(comment => {
        if (comment.score > maxScore) {
            maxScore = comment.score;
            featuredComment = { path: comment.id, comment };
        }
    });

    comments.forEach(comment => {
        comment.featured = (featuredComment && featuredComment.path === comment.id);
    });
    saveData();
}

async function addComment() {
    console.log("Iniciando addComment...");
    // Verifica se o usuário está logado
    if (!currentUser || !currentUser.id) {
        console.log("Usuário não logado, bloqueando comentário:", currentUser);
        addLoginRequiredNotification("comment");
        return null;
    }

    const content = newCommentInput.value; // Não usar trim() para preservar quebras de linha
    const images = selectedImages.length > 0 ? [...selectedImages] : [];

    // Validação: permite postar se há texto (não vazio após remover apenas espaços) OU imagens
    const isContentEmpty = content.replace(/\s/g, '').length === 0;
    if (isContentEmpty && images.length === 0) {
        console.log("Comentário vazio, ignorando.");
        addNotification("O comentário ou as imagens não podem estar vazios!");
        return;
    }

    if (content.length > 1000) {
        console.log("Comentário excede 400 caracteres:", content.length);
        addNotification("O comentário excede o limite de 1000 caracteres.");
        return;
    }

    const urlRegex = /(https?:\/\/[^\s<>"']+)/g;
    const urls = content.match(urlRegex) || [];

    // Limitar a uma URL por comentário e buscar metadados reais
    let linkPreviews = [];
    if (urls.length > 0) {
        try {
            const response = await fetch(`https://api.linkpreview.net/?key=b669493e86cd7160ea637c7c438c4550&q=${encodeURIComponent(urls[0])}`);
            if (!response.ok) {
                throw new Error(`Erro na API: ${response.status}`);
            }
            const data = await response.json();
            // Verificar se há uma imagem válida (não vazia e com formato de imagem)
            const isValidImage = data.image && typeof data.image === 'string' && data.image.match(/\.(jpg|jpeg|png|gif|webp)$/i);
            if (isValidImage && (data.title || data.description)) {
                linkPreviews = [{
                    url: data.url || urls[0],
                    title: data.title || "Sem título",
                    description: data.description || "Sem descrição disponível",
                    image: data.image
                }];
            } else {
                console.log("Imagem inválida ou ausente, usando link clicável:", urls[0]);
            }
        } catch (error) {
            console.error("Erro ao buscar prévia do link:", error);
            addNotification("Não foi possível gerar a prévia do link. O link será exibido como clicável.");
        }
    }

    // Busca o perfil do usuário no localStorage para obter avatar e handle
    const userProfile = JSON.parse(localStorage.getItem(`userProfile_${currentUser.id}`)) || {};
    const user = users.find(u => u.id === currentUser.id) || currentUser;

    const newComment = {
        id: generateUniqueId(),
        userId: currentUser.id,
        handle: userProfile.handle || `@${user.username}`,
        username: user.username,
        avatar: userProfile.profilePic || "./default-avatar.png",
        content: content, // Preserva quebras de linha
        createdAt: new Date().toISOString(),
        score: 0,
        replies: [],
        images: images,
        linkPreviews: linkPreviews,
        history: [content],
        reported: false,
        featured: false,
        isEdited: false,
        upvoters: []
    };

    console.log("Adicionando comentário:", newComment);
    comments.push(newComment);
    newCommentInput.value = "";
    selectedImages = [];
    document.getElementById("image-upload").value = "";
    document.getElementById("image-preview").innerHTML = "";
    document.getElementById("image-preview").style.display = "none";
    awardPoints(15);
    saveData();
    renderComments();

    // Notificar seguidores sobre o novo comentário
    if (userProfile.followingList && Array.isArray(userProfile.followingList)) {
        userProfile.followingList.forEach(followerId => {
            addNotificationToUser(followerId, {
                id: Date.now(),
                avatar: userProfile.profilePic || "./default-avatar.png",
                message: `${newComment.username} postou um novo comentário: "${content.slice(0, 50).replace(/\n/g, ' ')}${content.length > 50 ? '...' : ''}"`,
                timestamp: new Date().toISOString(),
                type: "comment",
                path: newComment.id
            });
        });
    }
}

sendCommentBtn.addEventListener("click", addComment);

// Inicialização de comentários
newCommentInput.addEventListener("input", () => {
    newCommentInput.style.height = "auto";
    newCommentInput.style.height = `${newCommentInput.scrollHeight}px`;
    showAutocomplete(newCommentInput);
});
setupCharCounter(newCommentInput, "char-count-new-comment");

uploadImageBtn.addEventListener("click", uploadImage);
sendCommentBtn.addEventListener("click", () => {
    
    const content = newCommentInput.value.trim();
    if (content.length > 1000) {
        alert("O comentário excede o limite de 1000 caracteres.");
        return;
    }
    if (content) {
        const newComment = {
            id: generateUniqueId(), // ID único
            username: currentUser.username,
            avatar: currentUser.avatar,
            content,
            createdAt: new Date().toISOString(),
            score: 0,
            replies: [],
            image: null,
            history: [content],
            reported: false,
            featured: false,
            retweet: null,
            isEdited: false,
            upvoters: []
        };
        comments.push(newComment);
        awardPoints(15);
        saveData();
        renderComments();
        newCommentInput.value = "";
        newCommentInput.style.height = "auto";
    }
});

cancelCommentBtn.addEventListener("click", () => {
    newCommentInput.value = "";
    newCommentInput.style.height = "auto";
    commentPreview.style.display = "none";
});

previewToggleBtn.addEventListener("click", () => togglePreview("new-comment"));

function sendComment() {
    const commentInput = document.getElementById("new-comment");
    const content = commentInput.value.trim();

    if (!content) {
        addNotification("O comentário não pode estar vazio!");
        return;
    }

    if (!currentUser.username) {
        addLoginRequiredNotification("comment");
        return;
    }

    // Regex para detectar URLs
    const urlRegex = /(https?:\/\/[^\s<>"']+)/g;
    const urls = content.match(urlRegex) || [];

    const newComment = {
        id: `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // ID único
        username: currentUser.username,
        avatar: userProfile.profilePic || currentUser.avatar,
        content: content,
        createdAt: new Date().toISOString(),
        likes: 0,
        upvoters: [],
        replies: [],
        images: [], // Pode ser preenchido se houver upload de imagens
        links: urls, // Armazena URLs detectadas
        sensitive: false,
        reportCount: 0,
        pinned: false,
        pinnedReplies: []
    };

    comments.push(newComment);
    try {
        saveData(); // Salva os comentários no localStorage
        console.log(`Comentário salvo:`, newComment);
    } catch (e) {
        console.error("Erro ao salvar comentário:", e);
        addNotification("Erro ao salvar o comentário. Tente novamente.");
        return;
    }

    // Limpar o input e atualizar a interface
    commentInput.value = "";
    document.getElementById("char-count").textContent = "280";
    renderComments();
    addNotification("Comentário postado com sucesso!");
}

function cancelComment() {
    const newCommentInput = document.getElementById("new-comment");
    const previewContainer = document.getElementById("image-preview");
    const imageUpload = document.getElementById("image-upload");

    newCommentInput.value = "";
    newCommentInput.style.height = "auto";
    selectedImage = null;
    previewContainer.style.display = "none";
    imageUpload.value = "";
    addNotification("Postagem cancelada.");
}

document.getElementById("cancel-comment").addEventListener("click", cancelComment);
// Vincular ao botão
document.getElementById("send-comment").addEventListener("click", sendComment);
// Dados iniciais
let draft = localStorage.getItem("commentDraft") || "";
let searchQuery = "";
function updateUserInfo() {
    pointsDisplay.textContent = `Pontos: ${userProfile.points}`;
    unreadCount.textContent = notifications.filter(n => !n.read).length;
}


//FUNÇÃO EM MANUTENÇÃO "function searchComments" ----------------------------------------------------------------------------------------------
function searchComments() {
    const query = searchInput.value.trim().toLowerCase();
    const exploreResults = document.getElementById('explore-results');
    const activeTab = document.querySelector('.explore-tabs .tab-active')?.getAttribute('data-tab') || 'posts';

    if (!exploreResults) {
        // Filtragem para a página principal
        const filteredComments = comments.filter(comment => {
            const commentUserProfile = JSON.parse(localStorage.getItem(`userProfile_${comment.username}`)) || { visibility: "public" };
            const canView = commentUserProfile.visibility === "public" || 
                           comment.username === currentUser.username || 
                           userProfile.followingList.includes(comment.username);
            return canView && (comment.content.toLowerCase().includes(query) || 
                              comment.username.toLowerCase().includes(query));
        });
        commentsContainer.innerHTML = '';
        filteredComments.forEach((comment, index) => {
            const commentElement = createCommentElement(comment, id);
            commentsContainer.appendChild(commentElement);
        });
        return;
    }

    // Filtragem para a seção Explorar
    let filteredResults = [];

    // Filtrar posts (somente visíveis)
    filteredResults = filteredResults.concat(
        comments.filter(comment => {
            const commentUserProfile = JSON.parse(localStorage.getItem(`userProfile_${comment.username}`)) || { visibility: "public" };
            const canView = commentUserProfile.visibility === "public" || 
                           comment.username === currentUser.username || 
                           userProfile.followingList.includes(comment.username);
            return canView && (comment.content.toLowerCase().includes(query) || 
                              comment.username.toLowerCase().includes(query));
        }).map(comment => ({ ...comment, type: 'post' }))
    );

    // Filtrar usuários (todos aparecem, mas sem comentários se privados e não seguidos)
    filteredResults = filteredResults.concat(
        users.filter(user => 
            user.username.toLowerCase().includes(query) ||
            (user.handle && user.handle.toLowerCase().includes(query))
        ).map(user => ({ ...user, type: 'user' }))
    );

    // Filtrar hashtags (baseado em comentários visíveis)
    const hashtagCount = {};
    const hashtagRegex = /#(\w+)/g;
    comments.forEach(comment => {
        const commentUserProfile = JSON.parse(localStorage.getItem(`userProfile_${comment.username}`)) || { visibility: "public" };
        const canView = commentUserProfile.visibility === "public" || 
                       comment.username === currentUser.username || 
                       userProfile.followingList.includes(comment.username);
        if (canView) {
            let matches;
            while ((matches = hashtagRegex.exec(comment.content)) !== null) {
                const hashtag = matches[0].toLowerCase();
                if (hashtag.includes(query)) {
                    hashtagCount[hashtag] = (hashtagCount[hashtag] || 0) + 1;
                }
            }
        }
    });
    filteredResults = filteredResults.concat(
        Object.entries(hashtagCount).map(([hashtag, count]) => ({ hashtag, count, type: 'hashtag' }))
    );

    // Filtrar mídia (somente visível)
    filteredResults = filteredResults.concat(
        comments.filter(comment => {
            const commentUserProfile = JSON.parse(localStorage.getItem(`userProfile_${comment.username}`)) || { visibility: "public" };
            const canView = commentUserProfile.visibility === "public" || 
                           comment.username === currentUser.username || 
                           userProfile.followingList.includes(comment.username);
            return comment.image && canView && 
                   (comment.content.toLowerCase().includes(query) || 
                    comment.username.toLowerCase().includes(query));
        }).map(comment => ({ ...comment, type: 'media' }))
    );

    // Exibir resultados conforme a aba ativa
    const resultsContent = exploreResults.querySelector('.results-content');
    resultsContent.innerHTML = '';

    switch (activeTab) {
        case 'posts':
            const posts = filteredResults.filter(r => r.type === 'post');
            posts.forEach((post, index) => {
                const postElement = createCommentElement(post, `explore-${index}`);
                resultsContent.appendChild(postElement);
            });
            if (!posts.length) resultsContent.innerHTML = '<p>Nenhum post encontrado.</p>';
            break;
        case 'users':
            const userResults = filteredResults.filter(r => r.type === 'user');
            userResults.forEach(user => {
                const userProfileData = JSON.parse(localStorage.getItem(`userProfile_${user.username}`)) || { visibility: "public" };
                const isFollowing = userProfile.followingList.includes(user.username);
                const hasPendingRequest = userProfileData.pendingRequests?.includes(currentUser.username);
                const visibility = userProfileData.visibility || 'public';
                const handle = userProfileData.handle || `@${user.username}`;

                let followButton = '';
                if (user.username !== currentUser.username) {
                    if (visibility === 'public') {
                        followButton = `
                            <button class="follow-btn" onclick="toggleFollow('${user.username}', this)" data-username="${user.username}">
                                ${isFollowing ? 'Deixar de seguir' : 'Seguir'}
                            </button>`;
                    } else {
                        followButton = hasPendingRequest
                            ? `<button class="follow-btn disabled" disabled>Solicitação enviada</button>`
                            : (isFollowing
                                ? `<button class="follow-btn" onclick="toggleFollow('${user.username}', this)" data-username="${user.username}">Deixar de seguir</button>`
                                : `<button class="follow-btn" onclick="sendFollowRequest('${user.username}', this)" data-username="${user.username}">Enviar solicitação</button>`);
                    }
                }

                resultsContent.innerHTML += `
                    <div class="user-result">
                        <div class="user-info">
                            <span class="username" onclick="showProfilePageForUsername('${user.username}', event)">${user.username}</span>
                            <span class="handle">${handle}</span>
                        </div>
                        ${followButton}
                    </div>
                `;
            });
            if (!userResults.length) resultsContent.innerHTML = '<p>Nenhum usuário encontrado.</p>';
            break;
        case 'media':
            const media = filteredResults.filter(r => r.type === 'media');
            media.forEach((item, index) => {
                const mediaElement = createCommentElement(item, `explore-media-${index}`);
                resultsContent.appendChild(mediaElement);
            });
            if (!media.length) resultsContent.innerHTML = '<p>Nenhuma mídia encontrada.</p>';
            break;
        case 'hashtags':
            const hashtags = filteredResults.filter(r => r.type === 'hashtag');
            hashtags.forEach(hashtag => {
                resultsContent.innerHTML += `
                    <div class="hashtag-result" onclick="searchHashtag('${hashtag.hashtag}')">
                        ${hashtag.hashtag} (${hashtag.count} posts)
                    </div>
                `;
            });
            if (!hashtags.length) resultsContent.innerHTML = '<p>Nenhuma hashtag encontrada.</p>';
            break;
    }
}

// Vincular a função ao evento de entrada na barra de pesquisa
searchInput.addEventListener('input', searchComments);

function filterComments(commentsArray) {
    return commentsArray.filter(comment => {
        const profile = JSON.parse(localStorage.getItem(`userProfile_${comment.username}`)) || { visibility: "public" };
        const canView = profile.visibility === "public" || comment.username === currentUser.username || userProfile.followingList.includes(comment.username);
        if (comment.replies) comment.replies = filterComments(comment.replies);
        return canView;
    });
}
const filteredComments = filterComments(comments);

// Função para o notifications-btn (panel)
function toggleNotifications() {
    const isVisible = notificationsPanel.style.display === "block";
    notificationsPanel.style.display = isVisible ? "none" : "block";
    if (!isVisible) {
        notificationsPanel.innerHTML = notifications.length
            ? notifications.map((n, i) => `
                <div class="notification-item ${n.read ? 'read' : ''}" onclick="markNotificationRead(${i})">
                    ${n.message} - ${timeAgo(n.date || new Date().toISOString())}
                </div>
            `).join("")
            : "Nenhuma notificação.";
    }
    updateUnreadCount();
}

// Marca notificação como lida e atualiza as interfaces
function markNotificationRead(index) {
    if (index < notifications.length) {
        notifications[index].read = true;
        saveData();
        updateUnreadCount();
        updateNotificationsColumn();
        toggleNotifications();
    }
}

newCommentInput.addEventListener("input", () => {
    draft = newCommentInput.value;
    localStorage.setItem("commentDraft", draft);
});

// Função para manipular ações do menu
function handleMenuAction(label) {
    const mainContent = document.querySelector('.main-content');
    const profileContainer = document.querySelector('.profile-container');
    const savedPostsContainer = document.querySelector('.saved-posts-container');
    const controls = document.querySelector('.controls');
    const addComment = document.querySelector('.add-comment');
    const commentsSection = document.querySelector('.comments');
    const trendingSidebar = document.querySelector('.trending-sidebar');
    const exploreResults = document.getElementById('explore-results');
    const notificationsColumn = document.getElementById('notifications-column');
    const profileColumn = document.getElementById('profile-column');

    // Limpar estado anterior
    if (profileContainer) profileContainer.remove();
    if (savedPostsContainer) savedPostsContainer.remove();
    if (controls) controls.style.display = 'flex';
    if (addComment) addComment.style.display = 'flex';
    if (commentsSection) commentsSection.style.display = 'block';
    if (trendingSidebar) trendingSidebar.style.display = 'block';
    if (exploreResults) exploreResults.style.display = 'none';
    if (notificationsColumn) notificationsColumn.classList.remove('visible');
    if (profileColumn) profileColumn.classList.remove('visible');

    switch (label) {
        case 'Página Inicial':
            showHomePage();
            break;
        case 'Explorar':
            showExplorePage();
            break;
        case 'Notificações':
            toggleNotificationsColumn();
            break;
        case 'Itens Salvos':
            showSavedPosts();
            break;
        case 'Comunidades':
            showCommunities();
            break;
        case 'Perfil':
            showProfilePage();
            break;
        case 'Mais':
            toggleMoreMenu();
            break;
        default:
            console.warn(`Ação de menu desconhecida: ${label}`);
    }
}

function renderConversation(user1, user2) {
    const conversation = getConversation(user1, user2);
    if (conversation.length === 0) {
        return '<p class="p-alerta">Nenhuma mensagem ainda. Comece a conversa!</p>';
    }

    return conversation.map(msg => `
        <div class="message ${msg.sender === currentUser.username ? 'sent' : 'received'}">
            <img src="${getUserAvatar(msg.sender)}" alt="Avatar" class="avatar">
            <div class="message-content">
                <span class="message-text">${msg.content}</span>
                <span class="message-time">${formatTime(msg.timestamp)}</span>
            </div>
        </div>
    `).join('');
}

function formatTime(timestamp) {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}

function sendMessage(targetUsername) {
    const messageInput = document.getElementById('message-input');
    const content = messageInput.value.trim();
    if (!content) return;

    addMessage(currentUser.username, targetUsername, content);
    messageInput.value = '';
    const messagesBody = document.getElementById('messages-body');
    messagesBody.innerHTML = renderConversation(currentUser.username, targetUsername);
    addNotification(`Mensagem enviada para ${targetUsername}!`);
    messagesBody.scrollTop = messagesBody.scrollHeight; // Scroll automático após enviar
}

// Configuração dos eventos
document.addEventListener('DOMContentLoaded', () => {
    const messageInput = document.getElementById('message-input');
    const messagesBody = document.getElementById('messages-body');
    
    // Renderização inicial
    messagesBody.innerHTML = renderConversation(currentUser.username, targetUsername);
    
    // Enviar com Enter
    messageInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            sendMessage(targetUsername); // Use o targetUsername real do seu contexto
        }
    });
    
    // Scroll enquanto digita
    messageInput.addEventListener('input', () => {
        messagesBody.scrollTop = messagesBody.scrollHeight;
    });
});

function markMessagesAsRead(user1, user2) {
    const key = [user1, user2].sort().join("_");
    if (messages[key]) {
        messages[key].forEach(msg => {
            if (msg.receiver === currentUser.username) msg.read = true;
        });
        saveMessages();
    }
    // Atualizar notificações
    let userNotifications = JSON.parse(localStorage.getItem(`notifications_${currentUser.username}`)) || [];
    userNotifications = userNotifications.map(n => {
        if (n.type === "message" && n.sender === user2) n.read = true;
        return n;
    });
    localStorage.setItem(`notifications_${currentUser.username}`, JSON.stringify(userNotifications));
    updateUnreadCount();
}

// Alternar visibilidade do submenu "Mais"
function toggleMoreMenu(event) {
    event.preventDefault();
    const submenu = document.querySelector('.more-submenu');
    submenu.style.display = submenu.style.display === 'none' ? 'block' : 'none';
}
document.addEventListener('click', function(event) {
    const moreMenu = document.querySelector('.more-menu');
    const submenu = document.querySelector('.more-submenu');
    if (!moreMenu.contains(event.target) && submenu.style.display === 'block') {
        submenu.style.display = 'none';
    }
});

function hideExplorePage() {
    const exploreContainer = document.querySelector('.explore-container');
    const controls = document.querySelector('.controls');
    const searchInput = document.getElementById('search');
    const addComment = document.querySelector('.add-comment');
    const commentsSection = document.querySelector('.comments');

    if (exploreContainer && searchInput) {
        const placeholder = exploreContainer.querySelector('.search-bar-placeholder');
        const controlsRect = controls.getBoundingClientRect();
        const placeholderRect = placeholder.getBoundingClientRect();
        const offsetX = controlsRect.left - placeholderRect.left;
        const offsetY = controlsRect.top - placeholderRect.top;

        // Prepara a animação de volta
        searchInput.style.position = 'absolute';
        searchInput.style.left = '0px';
        searchInput.style.top = '0px';
        searchInput.style.width = `${placeholderRect.width}px`;

        // Mostra controls para calcular a posição corretamente
        controls.style.display = 'flex';

        // Inicia a animação
        requestAnimationFrame(() => {
            searchInput.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
            searchInput.style.width = `${controlsRect.width}px`;
            searchInput.classList.remove('explore-search-active');
            searchInput.placeholder = "Pesquisar comentários...";

            // Após a animação, move o elemento de volta
            setTimeout(() => {
                searchInput.style.transform = 'none';
                searchInput.style.position = 'fixed';
                controls.insertBefore(searchInput, controls.firstChild);
                exploreContainer.remove();
            }, 500); // Duração da animação (0.5s)
        });
    } else if (exploreContainer) {
        exploreContainer.remove();
    }

    // Restaura visibilidade dos elementos padrão
    if (addComment) addComment.style.display = 'flex';
    if (commentsSection) commentsSection.style.display = 'block';
}
function showExplorePage() {
    const mainContent = document.querySelector('.main-content');
    const trendingSidebar = document.querySelector('.trending-sidebar');
    const addComment = document.querySelector('.add-comment');
    const commentsSection = document.querySelector('.comments');
    const profileContainer = document.querySelector('.profile-container');
    const controls = document.querySelector('.controls');

    // Remove a página de perfil, se existir
    if (profileContainer) profileContainer.remove();

    // Esconde os elementos que não devem aparecer na página Explorar, exceto 'controls'
    if (addComment) addComment.style.display = 'none';
    if (commentsSection) commentsSection.style.display = 'none';

    // Garante que 'controls' permaneça visível
    if (controls) controls.style.display = 'flex';

    // Cria ou atualiza o contêiner da página de exploração
    let exploreContainer = document.querySelector('.explore-container');
    if (!exploreContainer) {
        exploreContainer = document.createElement('div');
        exploreContainer.classList.add('explore-container');
        mainContent.insertBefore(exploreContainer, trendingSidebar);
    }

    exploreContainer.innerHTML = `
        <div class="explore-page">
            <div class="explore-header">
                <h4>Explorar</h4>
            </div>
            <div class="search-bar-placeholder"></div>
            <div class="search-filters">
                <select id="content-type-filter" class="filter-explore">
                    <option value="all">Todos</option>
                    <option value="posts">Posts</option>
                    <option value="users">Usuários</option>
                    <option value="hashtags">Hashtags</option>
                    <option value="images">Imagens</option>
                    <option value="videos">Vídeos</option>
                </select>
                <select id="date-filter" class="filter-explore">
                    <option value="recent">Mais recentes</option>
                    <option value="oldest">Mais antigos</option>
                    <option value="custom">Período específico</option>
                </select>
                <select id="popularity-filter" class="filter-explore">
                    <option value="default">Padrão</option>
                    <option value="likes">Mais curtidos</option>
                    <option value="comments">Mais comentados</option>
                    <option value="shares">Mais compartilhados</option>
                </select>
                <div id="custom-date-range" style="display: none;">
                    <p>De: <input class="btn-explore-date" type="date" id="date-start" /></p>
                    <p>Até: <input class="btn-explore-date" type="date" id="date-end" /></p>
                </div>
            </div>
            <div class="search-suggestions" id="search-suggestions"></div>
            <div class="search-history" id="search-history"></div>
            <div class="search-results">
                <div class="tabs">
                    <button class="btn-explore" data-tab="posts">Posts</button>
                    <button data-tab="users" class="btn-explore">Usuários</button>
                    <button data-tab="media" class="btn-explore">Mídia</button>
                    <button data-tab="hashtags" class="btn-explore" >Hashtags</button>
                </div>
                <div id="explore-results-content"></div>
            </div>
        </div>
    `;

    // Calcula as posições para a animação
    const controlsRect = controls.getBoundingClientRect();
    const placeholder = exploreContainer.querySelector('.search-bar-placeholder');
    const placeholderRect = placeholder.getBoundingClientRect();
    const offsetX = placeholderRect.left - controlsRect.left;
    const offsetY = placeholderRect.top - controlsRect.top;

    // Aplica a posição inicial e ativa a animação
    searchInput.style.position = 'absolute';
    searchInput.style.left = '0px';
    searchInput.style.top = '0px';
    searchInput.style.width = `${controlsRect.width}px`;

    // Adiciona a classe para o estilo final antes da animação
    searchInput.classList.add('explore-search-active');
    searchInput.placeholder = "Pesquisar por palavras-chave, hashtags ou usuários...";

    // Inicia a animação
    requestAnimationFrame(() => {
        searchInput.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
        searchInput.style.width = `${placeholderRect.width}px`;

        // Após a animação, move o elemento para o novo contêiner
        setTimeout(() => {
            searchInput.style.transform = 'none'; // Reseta a transformação
            searchInput.style.position = 'static'; // Volta ao fluxo normal
            placeholder.appendChild(searchInput);
            // Não esconde 'controls' aqui, pois queremos que ele permaneça visível
        }, 500); // Duração da animação (0.5s)
    });

    // Configura eventos
    setupExploreSearch();
    renderSearchHistory();
    trendingSidebar.style.display = 'block';
    renderTrending();
}
let searchHistory = JSON.parse(localStorage.getItem('searchHistory')) || [];

function setupExploreSearch() {
    const searchInput = document.getElementById('search'); // Usa #search em vez de #explore-search
    const contentTypeFilter = document.getElementById('content-type-filter');
    const dateFilter = document.getElementById('date-filter');
    const popularityFilter = document.getElementById('popularity-filter');
    const dateRange = document.getElementById('custom-date-range');
    const suggestionsDiv = document.getElementById('search-suggestions');

    // Exibe o intervalo de datas personalizado quando selecionado
    dateFilter.addEventListener('change', () => {
        dateRange.style.display = dateFilter.value === 'custom' ? 'block' : 'none';
    });

    // Pesquisa em tempo real
    searchInput.addEventListener('input', () => {
        const query = searchInput.value.trim().toLowerCase();
        if (query) {
            updateSearchSuggestions(query);
            performSearch(query);
            if (!searchHistory.includes(query)) {
                searchHistory.unshift(query);
                if (searchHistory.length > 5) searchHistory.pop();
                localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
                renderSearchHistory();
            }
        } else {
            suggestionsDiv.innerHTML = '';
            document.getElementById('explore-results-content').innerHTML = '<p>Digite algo para pesquisar.</p>';
        }
    });

    // Configura abas
    document.querySelectorAll('.search-results .tabs button').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.search-results .tabs button').forEach(t => t.classList.remove('tab-active'));
            tab.classList.add('tab-active');
            performSearch(searchInput.value.trim().toLowerCase());
        });
    });

    // Filtros
    [contentTypeFilter, dateFilter, popularityFilter].forEach(filter => {
        filter.addEventListener('change', () => performSearch(searchInput.value.trim().toLowerCase()));
    });
}

function updateSearchSuggestions(query) {
    const suggestionsDiv = document.getElementById('search-suggestions');
    const suggestions = [];

    // Sugestões de hashtags
    const hashtags = getTopHashtags().map(h => h.hashtag).filter(h => h.toLowerCase().includes(query));
    suggestions.push(...hashtags.slice(0, 3));

    // Sugestões de usuários
    const usersSuggestions = users.filter(u => u.username.toLowerCase().includes(query)).map(u => u.username);
    suggestions.push(...usersSuggestions.slice(0, 3));

    suggestionsDiv.innerHTML = suggestions.length
        ? suggestions.map(s => `<div onclick="selectSuggestion('${s}')">${s}</div>`).join('')
        : '<p>Sem sugestões.</p>';
}

function selectSuggestion(suggestion) {
    document.getElementById('explore-search').value = suggestion;
    performSearch(suggestion.toLowerCase());
}

function renderSearchHistory() {
    const historyDiv = document.getElementById('search-history');
    historyDiv.innerHTML = `
        <h3>Histórico de Buscas</h3>
        ${searchHistory.length
            ? searchHistory.map(q => `
                <div class="history-item">
                    <span onclick="selectSuggestion('${q}')">${q}</span>
                    <button onclick="saveSearch('${q}')">Salvar</button>
                </div>`).join('')
            : '<p>Sem histórico.</p>'}
    `;
}

let savedSearches = JSON.parse(localStorage.getItem('savedSearches')) || [];

function saveSearch(query) {
    if (!savedSearches.includes(query)) {
        savedSearches.push(query);
        localStorage.setItem('savedSearches', JSON.stringify(savedSearches));
        addNotification(`Pesquisa "${query}" salva!`);
        renderSearchHistory(); // Atualiza para mostrar botão "salvo"
    }
}
function performSearch(query) {
    const contentType = document.getElementById('content-type-filter').value;
    const dateFilter = document.getElementById('date-filter').value;
    const popularityFilter = document.getElementById('popularity-filter').value;
    const dateStart = document.getElementById('date-start').value;
    const dateEnd = document.getElementById('date-end').value;
    const activeTab = document.querySelector('.search-results .tabs .tab-active').getAttribute('data-tab');
    const resultsContent = document.getElementById('explore-results-content');

    let filteredResults = [];

    // Filtra por tipo de conteúdo (sem alterações aqui)
    if (contentType === 'all' || contentType === 'posts') {
        filteredResults.push(...comments.filter(c => c.content.toLowerCase().includes(query)));
    }
    if (contentType === 'all' || contentType === 'users') {
        filteredResults.push(...users.filter(u => u.username.toLowerCase().includes(query)));
    }
    if (contentType === 'all' || contentType === 'hashtags') {
        filteredResults.push(...getTopHashtags().filter(h => h.hashtag.toLowerCase().includes(query)));
    }
    if (contentType === 'all' || contentType === 'images') {
        filteredResults.push(...comments.filter(c => c.image && c.content.toLowerCase().includes(query)));
    }
    if (contentType === 'all' || contentType === 'videos') {
        filteredResults.push(...comments.filter(c => c.content.toLowerCase().includes(query) && c.content.includes('video')));
    }

    // Filtra por data (sem alterações aqui)
    if (dateFilter === 'recent') {
        filteredResults.sort((a, b) => new Date(b.createdAt || b.joinDate) - new Date(a.createdAt || a.joinDate));
    } else if (dateFilter === 'oldest') {
        filteredResults.sort((a, b) => new Date(a.createdAt || a.joinDate) - new Date(b.createdAt || b.joinDate));
    } else if (dateFilter === 'custom' && dateStart && dateEnd) {
        const start = new Date(dateStart);
        const end = new Date(dateEnd);
        filteredResults = filteredResults.filter(item => {
            const date = new Date(item.createdAt || item.joinDate);
            return date >= start && date <= end;
        });
    }

    // Filtra por popularidade (sem alterações aqui)
    if (popularityFilter === 'likes') {
        filteredResults.sort((a, b) => (b.score || 0) - (a.score || 0));
    } else if (popularityFilter === 'comments') {
        filteredResults.sort((a, b) => countReplies(b.replies || []) - countReplies(a.replies || []));
    } else if (popularityFilter === 'shares') {
        filteredResults.sort((a, b) => (b.retweet ? 1 : 0) - (a.retweet ? 1 : 0));
    }

    // Exibe resultados conforme a aba ativa
    resultsContent.innerHTML = '';
    switch (activeTab) {
        case 'posts':
            const posts = filteredResults.filter(r => r.content && !r.username);
            posts.forEach((post, index) => {
                const postElement = createCommentElement(post, `explore-${index}`);
                postElement.innerHTML += `
                    <button onclick="vote('explore-${index}', 1)">Curtir (${post.score})</button>
                    <button onclick="showReplyForm('explore-${index}')">Comentar</button>
                    <button onclick="showRetweetForm('explore-${index}')">Compartilhar</button>
                `;
                resultsContent.appendChild(postElement);
            });
            if (!posts.length) resultsContent.innerHTML += `
            <div class="alert-p">
            <p>Nenhuma publicação encontrada.</p>
            </div>
            `;
            break;
        case 'users':
            const userResults = filteredResults.filter(r => r.username && !r.content);
            userResults.forEach(user => {
                const userProfileData = JSON.parse(localStorage.getItem(`userProfile_${user.username}`)) || {};
                const isFollowing = userProfile.followingList.includes(user.username);
                const handle = userProfileData.handle || `@${user.username}`; // Usa handle do perfil ou cria um padrão
                resultsContent.innerHTML += `
                    <div class="user-result">
                        <img src="${user.avatar}" alt="Avatar" class="avatar" onclick="showProfilePageForUsername('${user.username}', event)">
                        <div class="user-info">
                            <span class="username" onclick="showProfilePageForUsername('${user.username}', event)">${user.username}</span>
                            <span class="handle">${handle}</span>
                        </div>
                        <button class="follow-btn" onclick="toggleFollow('${user.username}', this)" data-username="${user.username}">
                            ${isFollowing ? 'Deixar de seguir' : 'Seguir'}
                        </button>
                    </div>
                `;
            });
            if (!userResults.length) resultsContent.innerHTML += `
            <div class="alert-p">
            <p>Nenhuma usuário encontrada.</p>
            </div>
            `;
            break;
        case 'media':
            const media = filteredResults.filter(r => r.image);
            media.forEach((item, index) => {
                const mediaElement = createCommentElement(item, `explore-media-${index}`);
                resultsContent.appendChild(mediaElement);
            });
            if (!media.length) resultsContent.innerHTML += `
            <div class="alert-p">
            <p>Nenhuma mídia encontrada.</p>
            </div>
            `;
            break;
        case 'hashtags':
            const hashtags = filteredResults.filter(r => r.hashtag);
            hashtags.forEach(hashtag => {
                resultsContent.innerHTML += `
                    <div class="hashtag-result" onclick="selectSuggestion('${hashtag.hashtag}')">
                        ${hashtag.hashtag} (${hashtag.count} posts)
                    </div>
                `;
            });
            if (!hashtags.length) resultsContent.innerHTML += `
            <div class="alert-p">
            <p>Nenhuma hashtag encontrada.</p>
            </div>
            
            `;
            break;
    }

    // Destaques (sem alterações aqui)

}
// Abrir o modal de edição
// Abrir o modal de edição
// Abrir o modal de edição
function openEditModal(type) {
    const modal = document.getElementById('edit-modal');
    const modalTitle = document.getElementById('modal-title');
    const editForm = document.getElementById('edit-form');
    let users = JSON.parse(localStorage.getItem('users')) || [];
    const user = users.find(u => u.email === currentUser.email);

    // Criar o overlay se ainda não existir
    let overlay = document.querySelector('.modal-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.classList.add('modal-overlay');
        document.body.appendChild(overlay);
    }

    // Mostrar o modal e o overlay
    modal.style.display = 'block';
    overlay.style.display = 'block';

    editForm.innerHTML = ''; // Limpar formulário anterior

    switch (type) {
        case 'profile':
            modalTitle.textContent = 'Editar Perfil';
            editForm.innerHTML = `
                <div class="form-group">
                    <label for="edit-email">Email</label>
                    <input type="email" id="edit-email" value="${user.email}" required>
                    <div class="error" id="edit-email-error"></div>
                </div>
                <div class="form-group">
                    <label for="edit-birthdate">Data de Nascimento</label>
                    <input type="date" id="edit-birthdate" value="${user.birthdate}" required>
                </div>
                <button type="submit">Salvar</button>
            `;
            break;
        case 'password':
            modalTitle.textContent = 'Alterar Senha';
            editForm.innerHTML = `
                <div class="form-group">
                    <label for="current-password">Senha Atual</label>
                    <input type="password" id="current-password" required>
                    <div class="error" id="current-password-error"></div>
                </div>
                <div class="form-group">
                    <label for="new-password">Nova Senha</label>
                    <input type="password" id="new-password" required>
                    <div class="password-strength-bar" id="password-strength-bar"></div>
                    <div class="error" id="new-password-error"></div>
                </div>
                <div class="form-group">
                    <label for="confirm-new-password">Confirmar Nova Senha</label>
                    <input type="password" id="confirm-new-password" required>
                    <div class="error" id="confirm-new-password-error"></div>
                </div>
                <button type="submit">Salvar</button>
            `;
            document.getElementById('new-password').addEventListener('input', function() {
                const password = this.value;
                calculatePasswordStrength(password);
            });
            break;
        case 'privacy':
            modalTitle.textContent = 'Privacidade do Perfil';
            editForm.innerHTML = `
                <div class="form-group">
                    <label for="profile-visibility">Visibilidade do Perfil</label>
                    <select id="profile-visibility">
                        <option value="public" ${userProfile.visibility === 'public' ? 'selected' : ''}>Público</option>
                        <option value="private" ${userProfile.visibility === 'private' ? 'selected' : ''}>Privado</option>
                    </select>
                </div>
                <button type="submit">Salvar</button>
                <p id="visibility-message" class="visibility-info">
                    ${userProfile.visibility === 'public' 
                        ? 'O perfil público permite que todo mundo possa ver e interagir com suas publicações, além de ter acesso à sua lista de seguidos, seguidores e curtidas.' 
                        : 'O perfil privado permite que apenas as pessoas que você seguir possam ver e interagir com suas publicações, além de ter acesso à sua lista de seguidos, seguidores e curtidas.'}
                </p>
            `;
            const visibilitySelect = document.getElementById('profile-visibility');
            const visibilityMessage = document.getElementById('visibility-message');
            visibilitySelect.addEventListener('change', () => {
                if (visibilitySelect.value === 'public') {
                    visibilityMessage.textContent = 'O perfil público permite que todo mundo possa ver e interagir com suas publicações, além de ter acesso à sua lista de seguidos, seguidores e curtidas.';
                } else {
                    visibilityMessage.textContent = 'O perfil privado permite que apenas as pessoas que você seguir possam ver e interagir com suas publicações, além de ter acesso à sua lista de seguidos, seguidores e curtidas.';
                }
            });
            break;
        case 'deleteAccount':
            modalTitle.textContent = 'Excluir Conta';
            editForm.innerHTML = `
                <button type="submit">Confirmar</button>
                <button type="button" onclick="closeEditModal()">Cancelar</button>
                <p class="p-moda-edit" >Tem certeza de que deseja excluir sua conta? Esta ação é irreversível e removerá todos os seus dados, incluindo posts, comentários, seguidores e notificações.</p>

            `;
            break;
    }

    // Lógica de submissão do formulário
    editForm.onsubmit = function(e) {
        e.preventDefault();
        saveEdit(type);
    };

    // Fechar o modal ao clicar no overlay
    overlay.addEventListener('click', () => {
        closeEditModal();
    });
}

// Fechar o modal
function closeEditModal() {
    const modal = document.getElementById('edit-modal');
    const overlay = document.querySelector('.modal-overlay');
    modal.style.display = 'none';
    if (overlay) overlay.style.display = 'none';
}
// Função para alternar a coluna de perfil
function toggleProfileColumn() {
    if (!currentUser.username) {
        addLoginRequiredNotification("profile");
        return;
    }
    const sidebar = document.querySelector('.sidebar');
    const profileColumn = document.getElementById('profile-column');
    const notificationsColumn = document.getElementById('notifications-column');
    const isVisible = profileColumn.classList.contains('visible');

    if (!isVisible) {
        sidebar.classList.add('collapsed');
        notificationsColumn.classList.remove('visible'); // Fecha a coluna de notificações
        updateProfileColumn();
        profileColumn.style.display = 'block';
        void profileColumn.offsetWidth;
        profileColumn.classList.add('visible');
        addNotification('Perfil aberto!');
    } else {
        profileColumn.classList.remove('visible');
    }
}

function updateProfileColumn() {
    const badgeThresholds = [50, 150, 300, 500, 1000];
    const nextThreshold = badgeThresholds.find(threshold => userProfile.points < threshold) || badgeThresholds[badgeThresholds.length - 1];
    const previousThreshold = badgeThresholds[badgeThresholds.indexOf(nextThreshold) - 1] || 0;
    const pointsToNext = nextThreshold - userProfile.points;
    const range = nextThreshold - previousThreshold;
    const progressPercentage = ((userProfile.points - previousThreshold) / range) * 100;

    currentUser.handle = currentUser.handle || `@${currentUser.username}`;

    profileColumn.innerHTML = `
        <div class="profile-content">
            <h3>Configurações do Perfil</h3>
        <div class="profile-item">
                <input type="text" id="edit-username" class="edit-username" value="${currentUser.username}" placeholder="Nome de usuário" maxlength="30">
                <input type="text" id="edit-handle" class="edit-handle" value="${currentUser.handle}" placeholder="@handle" maxlength="20">
                <button class="save-name-btn" onclick="saveUsernameAndHandle()">Salvar Nome</button>
        </div>
        </div>
            <div class="profile-item">
                <label>Foto de Perfil</label>
                <input type="file" id="profile-pic-upload" class="file-input" accept="image/*">
                <button class="custom-button" onclick="document.getElementById('profile-pic-upload').click()"><i class="fa-solid fa-image"></i></button>
                <button class="custom-save-button" onclick="uploadProfilePic(event)">Salvar</button>
                <p class="file-name" id="profile-pic-name">${userProfile.profilePic === './default-avatar.png' ? 'Selecione uma foto de perfil' : 'Foto carregada'}</p>
            </div>
            <div class="profile-item">
                <label>Foto de Capa</label>
                <input type="file" id="cover-pic-upload" class="file-input" accept="image/*">
                <button class="custom-button" onclick="document.getElementById('cover-pic-upload').click()"><i class="fa-solid fa-images"></i></button>
                <button class="custom-save-button" onclick="uploadCoverPic(event)">Salvar</button>
                <p class="file-name" id="cover-pic-name">${userProfile.coverPic === './default-cover.png' ? 'Selecione uma capa de perfil' : 'Capa carregada'}</p>
            </div>
            <div class="profile-item">
                <label>Bio</label>
                <textarea id="bio-input" placeholder="Escreva algo sobre você..." maxlength="160">${userProfile.rawBio || ""}</textarea>
                <span id="bio-char-count">${userProfile.rawBio ? userProfile.rawBio.length : 0}/160</span>
                <button class="button-theme" onclick="saveBio(event)">Salvar</button>
            </div>
            <div class="profile-item">
                <label>Site</label>
                <input type="url" id="website-input" placeholder="https://seusite.com" value="${userProfile.website || ''}" maxlength="100">
                <span id="website-char-count">${userProfile.website ? userProfile.website.length : 0}/100</span>
                <button class="button-theme" onclick="saveWebsite(event)">Salvar</button>
            </div>
            <div class="profile-item">
                <label>Localização</label>
                <input type="text" id="location-input" placeholder="Seu país" value="${userProfile.location || ''}" maxlength="50">
                <span id="location-char-count">${userProfile.location ? userProfile.location.length : 0}/50</span>
                <button class="button-theme" onclick="saveLocation(event)">Salvar</button>
            </div>
            <div class="profile-item">
                <label>Tipo de Conta</label>
                <select id="account-type-input">
                    <option value="common" ${userProfile.accountType === 'common' ? 'selected' : ''}>Pessoa Comum</option>
                    <option value="business" ${userProfile.accountType === 'business' ? 'selected' : ''}>Comercial</option>
                    <option value="authority" ${userProfile.accountType === 'authority' ? 'selected' : ''}>Autoridade Pública</option>
                </select>
                <button class="button-theme" onclick="saveAccountType(event)">Salvar</button>
            </div>
            <div class="profile-item">
                <label>Pontos: ${userProfile.points}</label>
                <div class="progress-bar">
                    <div style="width: ${progressPercentage}%; height: 10px; background: ${userProfile.themeColor};"></div>
                </div>
                <span>Próximo emblema: ${pointsToNext} pontos</span>
            </div>
            <div class="profile-item">
                <label>Emblemas:</label>
                <div class="badges-list">
                    ${userProfile.badges.length > 0 
                        ? userProfile.badges.map(badge => `<div class="badge-item">${getBadgeIcon(badge)} ${badge}</div>`).join('')
                        : '<div class="badge-item">Nenhum</div>'
                    }
                </div>
            </div>
            <div class="profile-item">
                <button class="button-theme" onclick="toggleDarkMode(event)">Alternar Modo Escuro</button>
            </div>
            <div class="profile-item">
                <button class="button-theme" id="create-community-btn">Criar Comunidade</button>
            </div>
            <div class="profile-item">
                <button class="button-theme" onclick="logout(event)">Sair</button>
            </div>
        </div>
    `;

    // Configurar contador de caracteres para bio
    const bioInput = document.getElementById('bio-input');
    const bioCharCount = document.getElementById('bio-char-count');
    if (bioInput && bioCharCount) {
        bioInput.addEventListener('input', () => {
            bioCharCount.textContent = `${bioInput.value.length}/160`;
        });
    }

    // Configurar contador de caracteres para website
    const websiteInput = document.getElementById('website-input');
    const websiteCharCount = document.getElementById('website-char-count');
    if (websiteInput && websiteCharCount) {
        websiteInput.addEventListener('input', () => {
            websiteCharCount.textContent = `${websiteInput.value.length}/100`;
        });
    }

    // Configurar contador de caracteres para localização
    const locationInput = document.getElementById('location-input');
    const locationCharCount = document.getElementById('location-char-count');
    if (locationInput && locationCharCount) {
        locationInput.addEventListener('input', () => {
            locationCharCount.textContent = `${locationInput.value.length}/50`;
        });
    }

    // Garantir que o handle comece com @
    const handleInput = document.getElementById('edit-handle');
    if (handleInput) {
        handleInput.addEventListener('input', (e) => {
            if (!e.target.value.startsWith('@')) {
                e.target.value = '@' + e.target.value.replace('@', '');
            }
        });
    }

    // Vincular evento ao botão de criar comunidade
    const createCommunityBtn = document.getElementById('create-community-btn');
    if (createCommunityBtn) {
        createCommunityBtn.addEventListener('click', openCreateCommunityModal);
    }
}

// Função para salvar o tipo de conta
function saveAccountType(event) {
    const accountTypeInput = document.getElementById('account-type-input');
    if (accountTypeInput) {
        userProfile.accountType = accountTypeInput.value;
        localStorage.setItem(`userProfile_${currentUser.id}`, JSON.stringify(userProfile));
        addNotification("Tipo de conta atualizado com sucesso!");
    }
}

// Função para salvar o website
function saveWebsite(event) {
    event.stopPropagation();
    const website = document.getElementById('website-input').value.trim();
    if (website.length > 100) {
        addNotification("O link do site não pode exceder 100 caracteres!");
        return;
    }
    // Validar URL
    const urlRegex = /^(https?:\/\/)?([\w.-]+)\.([a-z]{2,})(\/.*)?$/i;
    if (website && !urlRegex.test(website)) {
        addNotification("Por favor, insira um URL válido (ex: https://seusite.com)!");
        return;
    }
    userProfile.website = website;
    saveData();
    addNotification("Link do site atualizado!");

    const button = event.target;
    button.innerHTML = '<i class="fa-solid fa-check"></i>';
    setTimeout(() => {
        button.innerHTML = 'Salvar';
    }, 2000);
}

// Função para salvar a localização
function saveLocation(event) {
    event.stopPropagation();
    const location = document.getElementById('location-input').value.trim();
    if (location.length > 50) {
        addNotification("A localização não pode exceder 50 caracteres!");
        return;
    }
    userProfile.location = location;
    saveData();
    addNotification("Localização atualizada!");

    const button = event.target;
    button.innerHTML = '<i class="fa-solid fa-check"></i>';
    setTimeout(() => {
        button.innerHTML = 'Salvar';
    }, 2000);
}

// Função para abrir o modal de criação de comunidade
function openCreateCommunityModal() {
    if (!currentUser.id) {
        addNotification("Você precisa estar logado para criar uma comunidade.");
        return;
    }

    const modal = document.createElement("div");
    modal.classList.add("community-modal");
    modal.innerHTML = `
        <div class="community-modal-content">
            <button class="close-modal-community" onclick="this.parentElement.parentElement.remove()">×</button>
            <h2>Criar Nova Comunidade</h2>
            <form id="create-community-form">
                <div class="form-group">
                    <label for="community-name">Nome da Comunidade *</label>
                    <input type="text" id="community-name" maxlength="50" placeholder="Ex.: Fãs de Tecnologia" required>
                    <span class="char-count" id="community-name-char-count">0/50</span>
                </div>
                <div class="form-group">
                    <label for="community-description">Descrição *</label>
                    <textarea id="community-description" maxlength="200" placeholder="Descreva o propósito da comunidade" required></textarea>
                    <span class="char-count" id="community-description-char-count">0/200</span>
                </div>
                <div class="form-group">
                    <label>Visibilidade</label>
                    <div class="visibility-options">
                        <label><input type="radio" name="visibility" value="public" checked> Pública</label>
                        <label><input type="radio" name="visibility" value="private"> Privada</label>
                    </div>
                </div>
                <div class="form-group">
                    <label>Regras (opcional)</label>
                    <div id="community-rules">
                        <div class="rule-container">
                            <input type="text" class="rule-input" placeholder="Ex.: Respeite todos os membros" maxlength="100">
                            <button type="button" class="remove-rule-btn" onclick="removeRule(this)">-</button>
                        </div>
                    </div>
                    <button type="button" id="add-rule-btn" title="Adicionar Regra">Adicionar Regra<i class="fa-solid fa-plus"></i></button>
                </div>
                <div class="modal-community-actions">
                    <button type="submit">Criar Comunidade</button>
                    <button type="button" onclick="this.closest('.community-modal').remove()">Cancelar</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);

    // Configurar contadores de caracteres
    setupCharCounter(document.getElementById("community-name"), "community-name-char-count");
    setupCharCounter(document.getElementById("community-description"), "community-description-char-count");

    // Adicionar regra dinamicamente
    document.getElementById("add-rule-btn").addEventListener("click", () => {
        const rulesContainer = document.getElementById("community-rules");
        const ruleCount = rulesContainer.querySelectorAll(".rule-container").length;
        if (ruleCount >= 5) {
            addNotification("Você pode adicionar no máximo 5 regras.");
            return;
        }
        const newRule = document.createElement("div");
        newRule.className = "rule-container";
        newRule.innerHTML = `
            <input type="text" class="rule-input" placeholder="Ex.: Proibido spam" maxlength="100">
            <button type="button" class="remove-rule-btn" onclick="removeRule(this)">-</button>
        `;
        rulesContainer.appendChild(newRule);
    });

    // Enviar formulário
    document.getElementById("create-community-form").addEventListener("submit", (e) => {
        e.preventDefault();
        const name = document.getElementById("community-name").value.trim();
        const description = document.getElementById("community-description").value.trim();
        const visibility = document.querySelector('input[name="visibility"]:checked').value;
        const rules = Array.from(document.querySelectorAll(".rule-input"))
            .map(input => input.value.trim())
            .filter(rule => rule !== "");

        if (name.length < 3) {
            addNotification("O nome da comunidade deve ter pelo menos 3 caracteres.");
            return;
        }
        if (description.length < 10) {
            addNotification("A descrição deve ter pelo menos 10 caracteres.");
            return;
        }

        createCommunity(name, description, visibility, rules);
        modal.remove();
    });

    // Fechar modal ao clicar fora
    modal.addEventListener("click", (e) => {
        if (e.target === modal) modal.remove();
    });
}

// Função para remover uma regra
function removeRule(button) {
    const rulesContainer = document.getElementById("community-rules");
    if (rulesContainer.querySelectorAll(".rule-container").length > 1) {
        button.parentElement.remove();
    } else {
        addNotification("Pelo menos uma regra deve permanecer (pode estar vazia).");
    }
}

// Função para criar a comunidade
function createCommunity(name, description, visibility, rules) {
    const community = {
        id: Date.now(),
        name,
        description,
        creatorId: currentUser.id,
        visibility,
        members: [currentUser.id],
        posts: [],
        rules,
        createdAt: new Date().toISOString()
    };
    let communities = JSON.parse(localStorage.getItem("communities")) || [];
    communities.push(community);
    try {
        localStorage.setItem("communities", JSON.stringify(communities));
        addNotification(`Comunidade "${name}" criada com sucesso!`);
        // Opcional: Atualizar a UI ou redirecionar para a página da comunidade
        // showCommunityPage(community.id);
    } catch (e) {
        console.error("Erro ao salvar no localStorage:", e);
        addNotification(e.name === "QuotaExceededError"
            ? "Armazenamento cheio! Limpe alguns dados ou use outro navegador."
            : "Erro ao criar comunidade. Tente novamente.");
    }
}

// Função auxiliar para configurar contador de caracteres

// Função para exibir a lista de comunidades
function showCommunities() {
    // Marcar a aba "Comunidades" como ativa
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    document.querySelector('.nav-item[data-label="Comunidades"]').classList.add('active');

    // Recuperar comunidades do localStorage
    const communities = JSON.parse(localStorage.getItem("communities")) || [];

    // Renderizar a lista de comunidades
    const commentsContainer = document.getElementById("comments");
    commentsContainer.innerHTML = `
        <h2>Comunidades</h2>
        <div class="communities-list">
            ${communities.length > 0 ? communities.map(community => `
                <div class="community-item" onclick="showCommunityPage(${community.id})">
                    <h3>${community.name}</h3>
                    <p>${community.description}</p>
                    <span>${community.members.length} membros</span>
                    <button class="join-community-btn" onclick="toggleCommunityMembership(${community.id}, event)">
                        ${community.members.includes(currentUser.id) ? 'Sair' : 'Participar'}
                    </button>
                </div>
            `).join("") : '<p>Nenhuma comunidade disponível. Crie uma nova!</p>'}
        </div>
    `;
}

// Função para alternar participação em uma comunidade
function toggleCommunityMembership(communityId, event) {
    if (!currentUser.id) {
        addNotification("Você precisa estar logado para participar de uma comunidade.");
        return;
    }
    event.stopPropagation(); // Evitar que o clique no botão dispare o clique no community-item

    let communities = JSON.parse(localStorage.getItem("communities")) || [];
    const community = communities.find(c => c.id === communityId);
    if (!community) {
        addNotification("Comunidade não encontrada.");
        return;
    }

    if (community.members.includes(currentUser.id)) {
        // Sair da comunidade
        if (community.creatorId === currentUser.id) {
            addNotification("Você não pode sair da comunidade que criou.");
            return;
        }
        community.members = community.members.filter(id => id !== currentUser.id);
        addNotification(`Você saiu da comunidade "${community.name}".`);
    } else {
        // Entrar na comunidade
        if (community.visibility === "private") {
            addNotification("Esta comunidade é privada. Solicite entrada ao criador.");
            // Opcional: Implementar sistema de solicitação de entrada
        } else {
            community.members.push(currentUser.id);
            addNotification(`Você entrou na comunidade "${community.name}"!`);
        }
    }

    localStorage.setItem("communities", JSON.stringify(communities));
    showCommunities(); // Atualizar a lista
}

// Função para exibir a página de uma comunidade
function showCommunityPage(communityId) {
    const communities = JSON.parse(localStorage.getItem("communities")) || [];
    const community = communities.find(c => c.id === communityId);
    if (!community) {
        addNotification("Comunidade não encontrada.");
        return;
    }

    // Renderizar a página da comunidade
    const commentsContainer = document.getElementById("comments");
    commentsContainer.innerHTML = `
        <div class="community-page">
            <h2>${community.name}</h2>
            <p>${community.description}</p>
            <div class="community-meta">
                <span>${community.members.length} membros</span>
                <span>Visibilidade: ${community.visibility === "public" ? "Pública" : "Privada"}</span>
                <button class="join-community-btn" onclick="toggleCommunityMembership(${community.id}, event)">
                    ${community.members.includes(currentUser.id) ? 'Sair' : 'Participar'}
                </button>
            </div>
            <div class="community-rules">
                <h3>Regras</h3>
                <ul>
                    ${community.rules.length > 0 ? community.rules.map(rule => `<li>${rule}</li>`).join("") : '<li>Nenhuma regra definida.</li>'}
                </ul>
            </div>
            <div class="community-posts">
                <h3>Posts</h3>
                <div class="add-community-post">
                    <textarea id="new-community-post" placeholder="Escreva algo para a comunidade..." maxlength="280"></textarea>
                    <span id="community-post-char-count">0/280</span>
                    <button onclick="postToCommunity(${community.id})">Postar</button>
                </div>
                <div id="community-posts-list">
                    ${community.posts.length > 0 ? community.posts.map(post => `
                        <div class="community-post">
                            <img src="${post.avatar}" alt="Avatar" class="avatar">
                            <span>${post.username}</span>
                            <p>${post.content}</p>
                            <span class="time">${timeAgo(post.createdAt)}</span>
                        </div>
                    `).join("") : '<p>Nenhum post ainda. Seja o primeiro!</p>'}
                </div>
            </div>
        </div>
    `;

    // Configurar contador de caracteres para o novo post
    setupCharCounter(document.getElementById("new-community-post"), "community-post-char-count");
}

// Função para postar em uma comunidade
function postToCommunity(communityId) {
    if (!currentUser.id) {
        addNotification("Você precisa estar logado para postar.");
        return;
    }

    const communities = JSON.parse(localStorage.getItem("communities")) || [];
    const community = communities.find(c => c.id === communityId);
    if (!community) {
        addNotification("Comunidade não encontrada.");
        return;
    }

    if (!community.members.includes(currentUser.id)) {
        addNotification("Você precisa participar da comunidade para postar.");
        return;
    }

    const content = document.getElementById("new-community-post").value.trim();
    if (!content) {
        addNotification("O post não pode estar vazio.");
        return;
    }

    const newPost = {
        id: Date.now(),
        username: currentUser.username,
        avatar: currentUser.avatar || './default-avatar.png',
        content,
        createdAt: new Date().toISOString()
    };

    community.posts.push(newPost);
    localStorage.setItem("communities", JSON.stringify(communities));
    document.getElementById("new-community-post").value = "";
    showCommunityPage(communityId); // Atualizar a página
    addNotification("Post publicado com sucesso!");
}

// Função auxiliar para calcular o tempo decorrido (ex.: "há 5 minutos")
function timeAgo(date) {
    const now = new Date();
    const seconds = Math.floor((now - new Date(date)) / 1000);
    const intervals = [
        { label: 'ano', seconds: 31536000 },
        { label: 'mês', seconds: 2592000 },
        { label: 'dia', seconds: 86400 },
        { label: 'hora', seconds: 3600 },
        { label: 'minuto', seconds: 60 },
        { label: 'segundo', seconds: 1 }
    ];
    for (const interval of intervals) {
        const count = Math.floor(seconds / interval.seconds);
        if (count >= 1) {
            return `há ${count} ${interval.label}${count > 1 ? 's' : ''}`;
        }
    }
    return 'agora';
}
function saveThemeColor(event) {
    event.stopPropagation();
    const themeColor = document.getElementById('theme-color').value;
    userProfile.themeColor = themeColor;
    saveData();
    addNotification('Cor do tema atualizada!');

    const button = event.target;
    button.innerHTML = '<i class="fa-solid fa-check"></i>'; // Mostra o ícone

    // Volta ao texto "Salvar" e atualiza a coluna após 2 segundos
    setTimeout(() => {
        button.innerHTML = 'Salvar';
        updateProfileColumn(); // Atualiza somente após o ícone desaparecer
    }, 4000);
}

// Função para fazer upload da foto de perfil
function uploadProfilePic(event) {
    event.stopPropagation();
    const input = document.getElementById('profile-pic-upload');
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            userProfile.profilePic = event.target.result;
            currentUser.avatar = event.target.result; // Sincroniza
            saveData();
            updateUserAvatar(userProfile.profilePic);
            updateProfileColumn();
            const profileContainer = document.querySelector('.profile-container');
            if (profileContainer && profileContainer.querySelector('.profile-username').textContent === currentUser.username) {
                profileContainer.querySelector('.profile-avatar').src = userProfile.profilePic;
            }
            addNotification('Foto de perfil atualizada!');
        };
        reader.readAsDataURL(file);
    } else {
        userProfile.profilePic = "placeholder-profile-image.png"; // Fallback se não houver upload
        updateUserAvatar(userProfile.profilePic);
    }

    const button = event.target;
    button.innerHTML = '<i class="fa-solid fa-check"></i>';
    setTimeout(() => button.innerHTML = 'Salvar', 4000);
}

function uploadCoverPic(event) {
    event.stopPropagation();
    const input = document.getElementById('cover-pic-upload');
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            userProfile.coverPic = event.target.result;
            saveData();
            if (profileColumn.classList.contains('visible')) {
                updateProfileColumn();
            }
            const profileContainer = document.querySelector('.profile-container');
            if (profileContainer && profileContainer.querySelector('.profile-username').textContent === currentUser.username) {
                profileContainer.querySelector('.profile-cover').style.backgroundImage = `url('${userProfile.coverPic}')`;
            }
            addNotification('Foto de capa atualizada!');
        };
        reader.readAsDataURL(file);
    } else {
        userProfile.coverPic = "placeholder-cover-image.png"; // Fallback se não houver upload
        updateProfileColumn();
    }

    const button = event.target;
    button.innerHTML = '<i class="fa-solid fa-check"></i>';
    setTimeout(() => button.innerHTML = 'Salvar', 4000);
}


function saveBio(event) {
    event.stopPropagation();
    const bio = document.getElementById('bio-input').value.trim();
    if (bio.length > 160) {
        showGenericConfirmationModal(
            "Aviso",
            "A bio não pode exceder 160 caracteres.",
            null,
            "OK",
            null,
            false
        );
        return;
    }

    // Salva o texto bruto
    userProfile.rawBio = bio;

    // Formata os links para exibição
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const formattedBio = bio.replace(urlRegex, function(url) {
        const displayText = url.replace(/^https?:\/\//, '');
        return `<a href="${url}" target="_blank" class="bio-link">${displayText}</a>`;
    });
    userProfile.bio = formattedBio;

    const button = event.target;
    button.innerHTML = '<i class="fa-solid fa-check"></i>'; // Mostra o ícone

    saveData();
    addNotification('Bio atualizada!');

    // Volta ao texto "Salvar" e atualiza a coluna após 4 segundos
    setTimeout(() => {
        button.innerHTML = 'Salvar';
        updateProfileColumn(); // Atualiza somente após o ícone desaparecer
    }, 4000);
}

function toggleDarkMode(event) {
    event.stopPropagation(); // Impede a propagação do evento
    const isDarkMode = document.body.classList.toggle('dark-mode');
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light'); // Salva o estado
    addNotification('Modo escuro alternado!');
}

document.addEventListener('click', function(e) {
    const profileColumn = document.getElementById('profile-column');
    const notificationsColumn = document.getElementById('notifications-column');
    const sidebar = document.querySelector('.sidebar');

    if (profileColumn.classList.contains('visible') && !profileColumn.contains(e.target) && !sidebar.contains(e.target)) {
        profileColumn.classList.remove('visible');
    }
    if (notificationsColumn.classList.contains('visible') && !notificationsColumn.contains(e.target) && !sidebar.contains(e.target)) {
        notificationsColumn.classList.remove('visible');
    }
});

// Função para alternar a coluna de notificações
function toggleNotificationsColumn() {
    if (!currentUser.username) {
        addLoginRequiredNotification("notifications");
        return;
    }
    const sidebar = document.querySelector('.sidebar');
    const notificationsColumn = document.getElementById('notifications-column');
    const profileColumn = document.getElementById('profile-column');
    const isVisible = notificationsColumn.classList.contains('visible');

    if (!isVisible) {
        sidebar.classList.add('collapsed');
        profileColumn.classList.remove('visible');
        notificationsColumn.style.display = 'block';
        void notificationsColumn.offsetWidth; // Força reflow para animação
        notificationsColumn.classList.add('visible');
        renderNotifications(); // Renderiza as notificações
        addNotification('Notificações abertas!');
    } else {
        notificationsColumn.classList.remove('visible');
        sidebar.classList.remove('collapsed');
    }
}

// Função para atualizar a coluna de notificações
function updateNotificationsColumn() {
    let notificationsList = JSON.parse(localStorage.getItem(`notifications_${currentUser.username}`)) || [];
    notificationsColumn.innerHTML = notificationsList.length
        ? notificationsList.map((n, i) => `
            <div class="notification-item ${n.read ? 'read' : ''}">
                <img src="${n.avatar}" alt="Avatar" class="notification-avatar">
                <div class="notification-content">
                    ${n.message} <br><span class="time">${timeAgo(n.timestamp)}</span>
                    ${n.type === "followRequest" ? `
                        <div class="request-actions">
                            <button class="accept-btn" onclick="acceptFollowRequest('${n.requester}', ${i})">Aceitar</button>
                            <button class="decline-btn" onclick="declineFollowRequest('${n.requester}', ${i})">Recusar</button>
                        </div>
                    ` : ''}
                </div>
            </div>
        `).join("")
        : "<div class='notification-item'>Nenhuma notificação recente.</div>";
}

function setLoadingState(isLoading) {
    const mainContent = document.querySelector('.main-content');
    if (isLoading) mainContent.classList.add('loading');
    else mainContent.classList.remove('loading');
}

function addLoginRequiredNotification(action) {
    // Verifica se já existe uma notificação na tela
    const existingNotification = document.querySelector(".notificationNoLogin");
    if (existingNotification) {
        return; // Não cria nova notificação se já tiver uma
    }

    const messages = {
        like: "Você precisa estar logado para curtir.",
        comment: "Você precisa estar logado para comentar.",
        reply: "Você precisa estar logado para responder.",
        retweet: "Você precisa estar logado para repostar.",
        notifications: "Você precisa estar logado para ver notificações.",
        poll: "Limite total de 10 opções na enquete."
    };
    const message = messages[action] || "Você precisa estar logado para realizar esta ação.";
    
    const notification = document.createElement("div");
    notification.classList.add("notificationNoLogin");
    notification.innerHTML = `
        <span>${message}</span>
        ${action !== "poll" ? '<br><a href="login.html" style="color: #1DA1F2; text-decoration: underline;">Faça login ou cadastre-se</a>' : ''}
    `;
    // Adiciona a classe de animação de entrada
    notification.classList.add("fade-in");
    document.body.appendChild(notification);
    
    // Remove a notificação com animação de saída após 5 segundos
    setTimeout(() => {
        notification.classList.add("fade-out");
        setTimeout(() => notification.remove(), 300); // Espera a animação terminar
    }, 5000);
}

function generateNotifications() {
    const notificationsList = [];

    comments.forEach(comment => {
        if (comment.replies) {
            comment.replies.forEach(reply => {
                if (reply.content.includes(`@${currentUser.username}`) && reply.username !== currentUser.username) {
                    notificationsList.push({
                        avatar: users.find(u => u.username === reply.username)?.avatar || "https://via.placeholder.com/32",
                        message: `${reply.username} respondeu você: "${reply.content.slice(0, 20)}..."`,
                        date: reply.createdAt,
                        read: false
                    });
                }
            });
        }
    });

    comments.forEach(comment => {
        if (comment.retweet && comment.retweet.username === currentUser.username && comment.username !== currentUser.username) {
            notificationsList.push({
                avatar: users.find(u => u.username === comment.username)?.avatar || "https://via.placeholder.com/32",
                message: `${comment.username} repostou seu comentário: "${comment.retweet.content.slice(0, 20)}..."`,
                date: comment.createdAt,
                read: false
            });
        }
    });

    comments.forEach(comment => {
        if (!comment.upvoters) comment.upvoters = [];
        if (comment.replies) comment.replies.forEach(reply => {
            if (!reply.upvoters) reply.upvoters = [];
        });
    });
    saveData();

    notifications.forEach(n => {
        notificationsList.push({
            avatar: "https://via.placeholder.com/32",
            message: n.message,
            date: n.date || new Date().toISOString(),
            read: n.read
        });
    });

    return notificationsList
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 10);
}

// Adicionar evento de clique no avatar da sidebar para abrir a nova página de perfil
userProfileAvatar.addEventListener('click', (e) => {
    e.stopPropagation(); // Impede a propagação para outros eventos
    showProfilePage();
});

function showProfilePage(targetUser = currentUser) {
    const mainContent = document.querySelector('.main-content');
    const trendingSidebar = document.querySelector('.trending-sidebar');
    const controls = document.querySelector('.controls');
    const addComment = document.querySelector('.add-comment');
    const commentsSection = document.querySelector('.comments');
    const exploreResults = document.getElementById('explore-results');

    // Ocultar elementos da página inicial
    if (controls) controls.style.display = 'none';
    if (addComment) addComment.style.display = 'none';
    if (commentsSection) commentsSection.style.display = 'none';
    if (exploreResults) exploreResults.style.display = 'none';

    // Remover container de perfil existente, se houver
    const existingProfileContainer = document.querySelector('.profile-container');
    if (existingProfileContainer) existingProfileContainer.remove();

    // Criar novo container para o perfil
    const profileContainer = document.createElement('div');
    profileContainer.classList.add('profile-container');
    profileContainer.style.display = 'block';
    mainContent.appendChild(profileContainer);

    // Carregar perfil do usuário alvo
    let targetUserProfile = JSON.parse(localStorage.getItem(`userProfile_${targetUser.username}`)) || {
        points: 0,
        badges: [],
        bio: "Sem bio",
        profilePic: targetUser.avatar || "./default-avatar.png",
        coverPic: "./default-cover.png",
        themeColor: "#1DA1F2",
        joinDate: new Date("2021-01-01").toISOString(),
        following: 0,
        followers: 0,
        followingList: [],
        followersList: [],
        visibility: "public",
        pendingRequests: [],
        website: "",
        location: "",
        accountType: "common",
        notificationSettings: userProfile.notificationSettings || {
        likes: true,
        replies: true,
        mentions: true,
        retweets: true,
        pollUpdates: true, // Notificações sobre enquetes que você criou (expiração, etc.)
        // followRequests: true // Decidimos que solicitações de seguir não são configuráveis
        // moderation: true // Decidimos que notificações de moderação não são configuráveis
        // reports: true // Decidimos que notificações de reportes (para moderadores) não são configuráveis
        // achievement: true // Decidimos que conquistas não são configuráveis
    }
    };

    // Determinar o ícone do tipo de conta
    let accountTypeIcon = '';
    if (targetUserProfile.accountType === 'business') {
        accountTypeIcon = '<i class="fa-solid fa-certificate" style="color: yellow;"></i> ';
    } else if (targetUserProfile.accountType === 'authority') {
        accountTypeIcon = '<i class="fa-solid fa-certificate" style="color: blue;"></i> ';
    }

    const isCurrentUser = targetUser.username === currentUser.username;
    const canViewProfile = isCurrentUser || targetUserProfile.visibility === "public" || 
                          (targetUserProfile.visibility === "private" && userProfile.followingList.includes(targetUser.username));

    const editButton = isCurrentUser ? `<span class="edit-profile-btn" onclick="toggleProfileColumn()">Editar perfil</span>` : '';

    // Obter handle de forma simplificada
    const userData = users.find(u => u.username === targetUser.username) || targetUser;
    const fullHandle = userData.handle || targetUser.handle || `@${targetUser.username}`;
    const truncatedHandle = fullHandle.length > 10 ? fullHandle.substring(0, 10) + "..." : fullHandle;

    const isFollowing = userProfile.followingList.includes(targetUser.username);
    const hasPendingRequest = targetUserProfile.pendingRequests.includes(currentUser.username);
    let followButton = '';

    const isMuted = userProfile.muted?.includes(targetUser.username) || false;
    const isBlocked = userProfile.blocked?.includes(targetUser.username) || false;

    const menuButton = !isCurrentUser ? `
        <button class="profile-menu-btn" onclick="toggleProfileMenu('${targetUser.username}', this)">⋮</button>
        <div class="profile-menu" id="profile-menu-${targetUser.username}" style="display: none;">
            <ul>
                <li onclick="toggleListMembership('${targetUser.username}')">Adicionar/remover das listas<i class="fa-solid fa-list-check"></i></li>
                <li onclick="viewLists('${targetUser.username}')">Visualizar listas<i class="fa-solid fa-list-ol"></i></li>
                <li onclick="shareHandle('${targetUser.username}')">Compartilhar ${truncatedHandle}<i class="fa-solid fa-arrow-up-from-bracket"></i></li>
                <li onclick="muteUser('${targetUser.username}', this)" id="mute-${targetUser.username}">
                    ${isMuted ? 'Desativar Silêncio' : 'Silenciar'} ${truncatedHandle}<i class="fa-solid fa-microphone-slash"></i>
                </li>
                <li onclick="blockUser('${targetUser.username}', this)" id="block-${targetUser.username}">
                    ${isBlocked ? 'Desbloquear' : 'Bloquear'} ${truncatedHandle}<i class="fa-solid fa-triangle-exclamation"></i>
                </li>
                <li onclick="reportUser('${targetUser.username}')">Denunciar ${truncatedHandle}<i class="fa-solid fa-flag"></i></li>
            </ul>
        </div>
    ` : '';

    // Configurar botão de seguir/solicitação
    if (!isCurrentUser) {
        if (targetUserProfile.visibility === "public") {
            followButton = `
                <button class="follow-btn" onclick="toggleFollow('${targetUser.username}', this)" data-username="${targetUser.username}">
                    ${isFollowing ? 'Deixar de seguir' : 'Seguir'}
                </button>`;
        } else if (targetUserProfile.visibility === "private") {
            followButton = hasPendingRequest 
                ? `<button class="follow-btn disabled" disabled>Solicitação enviada</button>`
                : (isFollowing 
                    ? `<button class="follow-btn" onclick="toggleFollow('${targetUser.username}', this)" data-username="${targetUser.username}">Deixar de seguir</button>`
                    : `<button class="follow-btn" onclick="sendFollowRequest('${targetUser.username}', this)" data-username="${targetUser.username}">Enviar solicitação</button>`);
        }
    }

    // Caso o perfil seja privado e o usuário não tenha permissão
    if (!canViewProfile) {
        profileContainer.innerHTML = `
            <div class="profile-page">
                <div class="profile-header">
                    <button class="back-btn" onclick="handleMenuAction('Página Inicial')"><i class="fa-solid fa-arrow-left"></i></button>
                    <h2 class="profile-username">${targetUser.username}${accountTypeIcon}</h2>
                    ${editButton}
                    ${menuButton}
                </div>
                <div class="profile-cover" style="background-image: url('${targetUserProfile.coverPic}');">
                    <img src="${targetUserProfile.profilePic}" alt="Avatar" class="profile-avatar" onclick="openImageModal('${targetUserProfile.profilePic}')">
                </div>
                <div class="profile-info">
                    <h1 class="profile-name">${targetUser.username}${accountTypeIcon}</h1>
                    <span class="profile-handle">${fullHandle}</span>
                    ${followButton}
                    <p class="profile-bio">Este perfil é privado. Envie uma solicitação para ver suas publicações e informações.</p>
                </div>
                <div class="image-modal" id="image-modal" style="display: none;">
                    <div class="image-modal-content">
                        <img id="modal-image" src="" alt="Profile Image">
                    </div>
                </div>
            </div>
        `;
        if (trendingSidebar) trendingSidebar.style.display = 'block';
        setupModalEvents();
        return;
    }

    // Calcular estatísticas do usuário
    const userPosts = comments.filter(c => c.username === targetUser.username).length;
    const userReplies = comments.reduce((acc, c) => acc + (c.replies || []).filter(r => r.username === targetUser.username).length, 0);
    const userLikes = comments.reduce((acc, c) => acc + (c.username === targetUser.username ? c.score : 0), 0);
    const joinDate = new Date(targetUserProfile.joinDate).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

    // Renderizar a página de perfil completa
    profileContainer.innerHTML = `
        <div class="profile-page">
            <div class="profile-header">
                <button class="back-btn" onclick="handleMenuAction('Página Inicial')"><i class="fa-solid fa-arrow-left"></i></button>
                <h2 class="profile-username">${accountTypeIcon}${targetUser.username}</h2>
                ${editButton}
                ${menuButton}
            </div>
            <div class="profile-cover" style="background-image: url('${targetUserProfile.coverPic}');">
                <img src="${targetUserProfile.profilePic}" alt="Avatar" class="profile-avatar" onclick="openImageModal('${targetUserProfile.profilePic}')">
            </div>
            <div class="profile-info">
                <h1 class="profile-name">${accountTypeIcon}${targetUser.username}</h1>
                <span class="profile-handle">${fullHandle}</span>
                ${followButton}
                <p class="profile-bio">${targetUserProfile.bio}</p>
                <div class="profile-bio-links">
                ${targetUserProfile.location ? `<p class="profile-location"><i class="fa-solid fa-location-dot"></i> ${targetUserProfile.location}</p>` : ''}
                ${targetUserProfile.website ? `<p class="profile-website"><i class="fa-solid fa-link"></i> <a href="${targetUserProfile.website}" target="_blank" rel="noopener">${targetUserProfile.website}</a></p>` : ''}
                </div>
                <p class="profile-join-date"><i class="fa-solid fa-calendar-days"></i> Ingressou em ${joinDate}</p>
                <div class="profile-stats">
                    <span class="clickable" onclick="showFollowList('${targetUser.username}', 'following')" data-type="following"><strong>${targetUserProfile.following}</strong><p class="p-prof">Seguindo</p></span>
                    <span class="clickable" onclick="showFollowList('${targetUser.username}', 'followers')" data-type="followers"><strong>${targetUserProfile.followers}</strong><p class="p-prof">Seguidores</p></span>
                </div>
            </div>
            <div class="profile-tabs">
                <button class="tab-active" data-tab="posts">Posts</button>
                <button data-tab="replies">Respostas</button>
                <button data-tab="highlights">Destaques</button>
                <button data-tab="media">Mídia</button>
                <button data-tab="likes">Curtidas</button>
            </div>
            <div class="profile-posts" id="profile-posts-content"></div>
            <div class="image-modal-profile" id="image-modal-profile" style="display: none;">
                <div class="image-modal-content">
                    <img id="modal-image-profile" src="" alt="Profile Image">
                </div>
            </div>
        </div>
    `;

    // Mostrar trending sidebar
    if (trendingSidebar) {
        trendingSidebar.style.display = 'block';
        renderTrending();
    }

    // Configurar abas interativas
    document.querySelectorAll('.profile-tabs button').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.profile-tabs button').forEach(t => t.classList.remove('tab-active'));
            tab.classList.add('tab-active');
            updateProfileContent(tab.getAttribute('data-tab'), targetUser);
        });
    });

    // Carregar conteúdo inicial (posts)
    updateProfileContent('posts', targetUser);

    // Função para abrir o modal
    window.openImageModal = function(imageSrc) {
        const modal = document.getElementById('image-modal-profile');
        const modalImage = document.getElementById('modal-image-profile');
        modalImage.src = imageSrc;
        modal.style.display = 'flex';
    }

    // Configurar eventos do modal
    function setupModalEvents() {
        const modal = document.getElementById('image-modal-profile');
        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
    }

    // Inicializar eventos do modal
    setupModalEvents();
}

// Ajuste o evento de clique para incluir a nova opção
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
        this.classList.add('active');
        const label = this.getAttribute('data-label');
        handleMenuAction(label);
    });
});

// Visualizar tópicos
function viewTopics(username) {
    const userComments = comments.filter(c => c.username === username);
    const hashtagCount = {};
    userComments.forEach(comment => {
        const matches = comment.content.match(/#(\w+)/g);
        if (matches) matches.forEach(tag => hashtagCount[tag] = (hashtagCount[tag] || 0) + 1);
    });
    const topHashtags = Object.entries(hashtagCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([tag, count]) => `<li>${tag} (${count})</li>`)
        .join('') || '<li>Nenhum tópico encontrado</li>';

    const modal = document.createElement('div');
    modal.classList.add('modal');
    modal.innerHTML = `
        <div class="modal-content">
            <h3>Tópicos de ${username}</h3>
            <ul>${topHashtags}</ul>
            <button onclick="this.parentElement.parentElement.remove()">Fechar</button>
        </div>
    `;
    document.body.appendChild(modal);
}

// Adicionar/remover das listas
function toggleListMembership(username) {
    let userProfile = JSON.parse(localStorage.getItem(`userProfile_${currentUser.username}`)) || {};
    userProfile.lists = userProfile.lists || { "Favoritos": [], "Amigos": [] };

    const modal = document.createElement('div');
    modal.classList.add('modal');
    const listOptions = Object.keys(userProfile.lists).map(list => `
        <label>
            <input type="checkbox" ${userProfile.lists[list].includes(username) ? 'checked' : ''} 
                   onchange="updateList('${username}', '${list}', this.checked)">
            ${list}
        </label>
    `).join('');
    modal.innerHTML = `
        <div class="modal-content">
            <h3>Gerenciar Listas para ${username}</h3>
            ${listOptions}
            <button onclick="this.parentElement.parentElement.remove()">Fechar</button>
        </div>
    `;
    document.body.appendChild(modal);
}

function updateList(username, listName, add) {
    let userProfile = JSON.parse(localStorage.getItem(`userProfile_${currentUser.username}`));
    if (add) {
        if (!userProfile.lists[listName].includes(username)) {
            userProfile.lists[listName].push(username);
            addNotification(`${username} adicionado a ${listName}.`);
        }
    } else {
        userProfile.lists[listName] = userProfile.lists[listName].filter(u => u !== username);
        addNotification(`${username} removido de ${listName}.`);
    }
    localStorage.setItem(`userProfile_${currentUser.username}`, JSON.stringify(userProfile));
}

// Visualizar listas
function viewLists(username) {
    const userProfile = JSON.parse(localStorage.getItem(`userProfile_${currentUser.username}`)) || {};
    userProfile.lists = userProfile.lists || { "Favoritos": [] };
    const listsContainingUser = Object.entries(userProfile.lists)
        .filter(([_, members]) => members.includes(username))
        .map(([name]) => `<li>${name}</li>`)
        .join('') || '<li>Nenhuma lista</li>';

    const modal = document.createElement('div');
    modal.classList.add('modal');
    modal.innerHTML = `
        <div class="modal-content">
            <h3>Listas com ${username}</h3>
            <ul>${listsContainingUser}</ul>
            <button onclick="this.parentElement.parentElement.remove()">Fechar</button>
        </div>
    `;
    document.body.appendChild(modal);
}

// Compartilhar handle
function shareHandle(username) {
    const fullHandle = JSON.parse(localStorage.getItem(`userProfile_${username}`))?.handle || `@${username}`;
    const modal = document.createElement('div');
    modal.classList.add('modal');
    modal.innerHTML = `
        <div class="modal-content">
            <h3>Compartilhar ${fullHandle}</h3>
            <button onclick="navigator.clipboard.writeText('${fullHandle}'); addNotification('Handle copiado!');">Copiar</button>
            <button onclick="this.parentElement.parentElement.remove()">Fechar</button>
        </div>
    `;
    document.body.appendChild(modal);
}

// Silenciar usuário
function muteUser(username, element) {
    let userProfile = JSON.parse(localStorage.getItem(`userProfile_${currentUser.username}`)) || {};
    userProfile.muted = userProfile.muted || [];

    if (!userProfile.muted.includes(username)) {
        // Silenciar
        userProfile.muted.push(username);
        localStorage.setItem(`userProfile_${currentUser.username}`, JSON.stringify(userProfile));
        addNotification(`${username} silenciado.`);
        element.innerHTML = `Desativar Silêncio<i class="fa-solid fa-microphone-slash"></i>`;
    } else {
        // Desativar silêncio
        userProfile.muted = userProfile.muted.filter(u => u !== username);
        localStorage.setItem(`userProfile_${currentUser.username}`, JSON.stringify(userProfile));
        addNotification(`Silêncio de ${username} desativado.`);
        element.innerHTML = `Silenciar<i class="fa-solid fa-microphone-slash"></i>`;
    }

    renderComments(); // Atualiza os comentários para refletir o estado
    // Não recarrega a página inteira para evitar fechar o menu
}

// Bloquear usuário
function blockUser(username, element) {
    let userProfile = JSON.parse(localStorage.getItem(`userProfile_${currentUser.username}`)) || {};
    userProfile.blocked = userProfile.blocked || [];
    const truncatedHandle = (userProfile.handle || `@${username}`).length > 10 ? (userProfile.handle || `@${username}`).substring(0, 10) + "..." : (userProfile.handle || `@${username}`);

    if (!userProfile.blocked.includes(username)) {
        // Bloquear
        userProfile.blocked.push(username);
        userProfile.followingList = userProfile.followingList.filter(u => u !== username);
        userProfile.following = userProfile.followingList.length;
        let targetProfile = JSON.parse(localStorage.getItem(`userProfile_${username}`)) || {};
        targetProfile.followersList = targetProfile.followersList.filter(u => u !== currentUser.username);
        targetProfile.followers = targetProfile.followersList.length;

        localStorage.setItem(`userProfile_${currentUser.username}`, JSON.stringify(userProfile));
        localStorage.setItem(`userProfile_${username}`, JSON.stringify(targetProfile));
        addNotification(`${username} bloqueado.`);
        element.innerHTML = `Desbloquear ${truncatedHandle}<i class="fa-solid fa-triangle-exclamation"></i>`;
    } else {
        // Desbloquear
        userProfile.blocked = userProfile.blocked.filter(u => u !== username);
        localStorage.setItem(`userProfile_${currentUser.username}`, JSON.stringify(userProfile));
        addNotification(`${username} desbloqueado.`);
        element.innerHTML = `Bloquear ${truncatedHandle}<i class="fa-solid fa-triangle-exclamation"></i>`;
    }

    renderComments(); // Atualiza os comentários para refletir o estado
    showProfilePage(username); // Atualiza a página para refletir mudanças no botão de seguir
}

// Denunciar usuário
function reportUser(username) {
    const modal = document.createElement('div');
    modal.classList.add('modal');
    modal.innerHTML = `
        <div class="modal-content">
            <h3>Denunciar ${username}</h3>
            <select id="report-reason">
                <option value="spam">Spam</option>
                <option value="harassment">Assédio</option>
                <option value="inappropriate">Conteúdo impróprio</option>
                <option value="other">Outro</option>
            </select>
            <textarea id="report-details" placeholder="Descreva mais detalhes sobre a denúncia (opcional)" rows="4" style="width: 100%; margin-top: 10px;"></textarea>
            <div style="margin-top: 10px;">
                <button onclick="submitReport('${username}', this)">Enviar</button>
                <button onclick="this.parentElement.parentElement.parentElement.remove()">Cancelar</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function submitReport(username, button) {
    const reason = document.getElementById('report-reason').value;
    let reports = JSON.parse(localStorage.getItem("reports")) || [];
    reports.push({
        reportedUser: username,
        reporter: currentUser.username,
        reason: reason,
        date: new Date().toISOString()
    });
    localStorage.setItem("reports", JSON.stringify(reports));
    addNotification(`Denúncia contra ${username} enviada.`);
    button.parentElement.parentElement.remove();
}

// Função auxiliar para togglear o menu flutuante (mantida como estava)
function toggleProfileMenu(username, button) {
    const menu = document.getElementById(`profile-menu-${username}`);
    const isVisible = menu.style.display === 'block';
    menu.style.display = isVisible ? 'none' : 'block';

    if (!isVisible) {
        document.addEventListener('click', function closeMenu(e) {
            if (!menu.contains(e.target) && e.target !== button) {
                menu.style.display = 'none';
                document.removeEventListener('click', closeMenu);
            }
        });
    }
}

function sendFollowRequest(targetUsername, button) {
    const targetUserId = getUserIdByUsername(targetUsername);
    if (!targetUserId || !isValidUser(targetUserId)) {
        addNotification("Usuário inválido!");
        return;
    }

    let targetUserProfile = JSON.parse(localStorage.getItem(`userProfile_${targetUserId}`)) || { pendingRequests: [] };
    targetUserProfile.pendingRequests = Array.isArray(targetUserProfile.pendingRequests) ? targetUserProfile.pendingRequests : [];

    if (!targetUserProfile.pendingRequests.includes(currentUser.userId)) {
        targetUserProfile.pendingRequests.push(currentUser.userId);
        try {
            localStorage.setItem(`userProfile_${targetUserId}`, JSON.stringify(targetUserProfile));
            button.textContent = "Solicitação enviada";
            button.classList.add("disabled");
            button.disabled = true;
            addNotification(`Solicitação de seguir enviada para ${targetUsername}`);
        } catch (e) {
            console.error("Erro ao salvar no localStorage:", e);
            addNotification(e.name === "QuotaExceededError"
                ? "Armazenamento cheio! Limpe alguns dados ou use outro navegador."
                : "Erro ao enviar solicitação. Tente novamente.");
        }
    }
}

function addNotificationToUser(username, notification) {
    let notifications = JSON.parse(localStorage.getItem(`notifications_${username}`)) || [];
    notifications.unshift(notification);
    localStorage.setItem(`notifications_${username}`, JSON.stringify(notifications));
    if (username === currentUser.username) {
        renderNotifications();
    }
}

function renderNotifications() {
    if (!currentUser.username) {
        return; // Não renderiza nada se não estiver logado
    }
    const notificationsContainer = document.querySelector('.notifications-column');
    let notifications = JSON.parse(localStorage.getItem(`notifications_${currentUser.username}`)) || [];

    if (!notificationsContainer) return;

    notificationsContainer.innerHTML = `
        <h2>Notificações</h2>
        ${notifications.length === 0 ? '<p class="p-alerta">Sem notificações no momento.</p>' : ''}
    `;

    notifications.forEach((notification, index) => {
        const notificationElement = document.createElement('div');
        notificationElement.classList.add('notification-item');
        notificationElement.classList.toggle('read', notification.read);
        notificationElement.classList.toggle('urgent', notification.type === "report" && notification.priority === "high");

        let actionsHtml = '';
        if (notification.type === "report" && (currentUser.role === "moderator" || currentUser.role === "admin")) {
            actionsHtml = `
                <div class="report-actions">
                    ${notification.actions.map(action => `
                        <button onclick="${action.action}('${action.path || action.username}', '${action.reportId}')">${action.label}</button>
                    `).join('')}
                </div>
            `;
        }

        notificationElement.innerHTML = `
            <img src="${notification.avatar}" alt="Avatar" class="avatar">
            <div class="notification-content">
                <p>${notification.message}</p>
                <span class="time">${timeAgo(notification.timestamp)}</span>
                ${actionsHtml}
            </div>
        `;
        notificationsContainer.appendChild(notificationElement);

        if (notification.type !== "report") {
            notificationElement.addEventListener('click', () => {
                notification.read = !notification.read;
                localStorage.setItem(`notifications_${currentUser.username}`, JSON.stringify(notifications));
                renderNotifications();
            });
        }
    });

    const unreadCountElement = document.getElementById("unread-count");
    if (unreadCountElement) {
        const unread = notifications.filter(n => !n.read).length;
        unreadCountElement.textContent = unread > 0 ? unread : "";
    }
}

function acceptFollowRequest(requesterUsername, notificationIndex) {
    let targetUserProfile = JSON.parse(localStorage.getItem(`userProfile_${currentUser.username}`)) || { followersList: [], pendingRequests: [] };
    let requesterProfile = JSON.parse(localStorage.getItem(`userProfile_${requesterUsername}`)) || { followingList: [] };

    // Adicionar o requester à lista de seguidores do alvo
    if (!targetUserProfile.followersList.includes(requesterUsername)) {
        targetUserProfile.followersList.push(requesterUsername);
        targetUserProfile.followers = targetUserProfile.followersList.length;
    }
    // Adicionar o alvo à lista de seguindo do requester
    if (!requesterProfile.followingList.includes(currentUser.username)) {
        requesterProfile.followingList.push(currentUser.username);
        requesterProfile.following = requesterProfile.followingList.length;
    }
    if (!isFollowing) {
        if (!currentUserProfile.followingList.includes(targetUsername)) {
            currentUserProfile.followingList.push(targetUsername);
            currentUserProfile.following = currentUserProfile.followingList.length;
        }
        if (!targetUserProfile.followersList.includes(currentUser.username)) {
            targetUserProfile.followersList.push(currentUser.username);
            targetUserProfile.followers = targetUserProfile.followersList.length;
        }
    }
    // Remover a solicitação pendente
    targetUserProfile.pendingRequests = targetUserProfile.pendingRequests.filter(req => req !== requesterUsername);

    // Salvar as alterações
    localStorage.setItem(`userProfile_${currentUser.username}`, JSON.stringify(targetUserProfile));
    localStorage.setItem(`userProfile_${requesterUsername}`, JSON.stringify(requesterProfile));

    // Remover a notificação
    let notifications = JSON.parse(localStorage.getItem(`notifications_${currentUser.username}`)) || [];
    notifications.splice(notificationIndex, 1);
    localStorage.setItem(`notifications_${currentUser.username}`, JSON.stringify(notifications));

    // Atualizar UI
    renderNotifications();
    showProfilePage(currentUser); // Atualiza a página do perfil atual
}

function declineFollowRequest(requesterUsername, notificationIndex) {
    let targetUserProfile = JSON.parse(localStorage.getItem(`userProfile_${currentUser.username}`)) || { pendingRequests: [] };

    // Remover a solicitação pendente
    targetUserProfile.pendingRequests = targetUserProfile.pendingRequests.filter(req => req !== requesterUsername);
    localStorage.setItem(`userProfile_${currentUser.username}`, JSON.stringify(targetUserProfile));

    // Remover a notificação
    let notifications = JSON.parse(localStorage.getItem(`notifications_${currentUser.username}`)) || [];
    notifications.splice(notificationIndex, 1);
    localStorage.setItem(`notifications_${currentUser.username}`, JSON.stringify(notifications));

    // Atualizar UI
    renderNotifications();
}

function showFollowList(username, type) {
    const existingModal = document.querySelector('.follow-modal');
    if (existingModal) existingModal.remove();

    const targetUserProfile = JSON.parse(localStorage.getItem(`userProfile_${username}`)) || {
        followingList: [],
        followersList: [],
        visibility: "public"
    };
    const isCurrentUser = username === currentUser.username;
    const canViewProfile = isCurrentUser || targetUserProfile.visibility === "public" || 
                          (targetUserProfile.visibility === "private" && userProfile.followingList.includes(username));

    if (!canViewProfile) {
        const modal = document.createElement('div');
        modal.classList.add('follow-modal');
        modal.innerHTML = `
            <div class="modal-contentt">
                <button class="close-modal" onclick="this.parentElement.parentElement.remove()">×</button>
                <h3>${type === 'following' ? 'Seguindo' : 'Seguidores'}</h3>
                <p>Este perfil é privado. Você precisa seguir ${username} para ver esta lista.</p>
            </div>
        `;
        document.body.appendChild(modal);
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
        return;
    }

    const list = type === 'following' ? targetUserProfile.followingList : targetUserProfile.followersList;
    const title = type === 'following' ? 'Seguindo' : 'Seguidores';

    const modal = document.createElement('div');
    modal.classList.add('follow-modal');
    modal.innerHTML = `
        <div class="modal-contentt">
            <button class="close-modal" onclick="this.parentElement.parentElement.remove()">×</button>
            <h3>${title}</h3>
            <div class="follow-list">
                ${list.length > 0 
                    ? list.map(user => `
                        <div class="follow-item" onclick="showProfilePageForUsername('${user}', event)">
                            <img src="${getUserAvatar(user)}" alt="Avatar" class="avatar">
                            <span class="username">${user}</span>
                        </div>
                    `).join('')
                    : '<p>Nenhum usuário encontrado.</p>'
                }
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
}
// Ao inicializar os usuários, crie perfis básicos se necessário
users.forEach(user => {
    if (!localStorage.getItem(`userProfile_${user.username}`)) {
        const defaultProfile = {
            points: 0,
            badges: [],
            bio: " ",
            profilePic: user.avatar || "./default-avatar.png",
            coverPic: "./default-cover.png",
            themeColor: "#1DA1F2",
            joinDate: new Date("2021-01-01").toISOString(),
            following: 0,
            followers: 0,
            followingList: [],
            followersList: []
        };
        localStorage.setItem(`userProfile_${user.username}`, JSON.stringify(defaultProfile));
    }
});

// Função auxiliar para obter o avatar do usuário
function getUserAvatar(username) {
    const user = users.find(u => u.username === username);
    const userProfile = JSON.parse(localStorage.getItem(`userProfile_${username}`));
    return userProfile?.profilePic || user?.avatar || './default-avatar.png';
}

function toggleFollow(targetUsername, button) {
    let currentUserProfile = JSON.parse(localStorage.getItem(`userProfile_${currentUser.username}`)) || userProfile;
    let targetUserProfile = JSON.parse(localStorage.getItem(`userProfile_${targetUsername}`)) || {};

    const isFollowing = currentUserProfile.followingList.includes(targetUsername);
    if (isFollowing) {
        currentUserProfile.followingList = currentUserProfile.followingList.filter(u => u !== targetUsername);
        targetUserProfile.followersList = targetUserProfile.followersList.filter(u => u !== currentUser.username);
    } else {
        if (!currentUserProfile.followingList.includes(targetUsername)) currentUserProfile.followingList.push(targetUsername);
        if (!targetUserProfile.followersList.includes(currentUser.username)) targetUserProfile.followersList.push(currentUser.username);
    }
    currentUserProfile.following = currentUserProfile.followingList.length;
    targetUserProfile.followers = targetUserProfile.followersList.length;

    localStorage.setItem(`userProfile_${currentUser.username}`, JSON.stringify(currentUserProfile));
    localStorage.setItem(`userProfile_${targetUsername}`, JSON.stringify(targetUserProfile));
    button.textContent = isFollowing ? "Seguir" : "Deixar de seguir";
    showProfilePage({ username: targetUsername });
}


function showHomePage() {
    const mainContent = document.querySelector('.main-content');
    const profileContainer = document.querySelector('.profile-container');
    const controls = document.querySelector('.controls');
    const addComment = document.querySelector('.add-comment');
    const commentsSection = document.querySelector('.comments');
    const trendingSidebar = document.querySelector('.trending-sidebar');
    const exploreResults = document.getElementById('explore-results');

    // Remover qualquer página de perfil
    if (profileContainer) profileContainer.remove();

    // Restaurar elementos da página inicial
    if (controls) controls.style.display = 'flex';
    if (addComment) addComment.style.display = 'flex';
    if (commentsSection) commentsSection.style.display = 'block';
    if (trendingSidebar) {
        trendingSidebar.style.display = 'block';
        renderTrending(); // Atualiza os trends
    }
    if (exploreResults) exploreResults.style.display = 'none'; // Restaura estado padrão

    // Recarregar conteúdo da home
    renderComments();
}

// Função para renderizar os posts do usuário
function renderUserPosts() {
    return comments.filter(c => c.username === currentUser.username && c.image).slice(0, 6); // Limita a 6 posts para simulação
}

// Função para exibir os itens salvos
function showSavedPosts() {
    if (!currentUser.username) {
        addLoginRequiredNotification("saved-posts");
        return;
    }

    const mainContent = document.querySelector('.main-content');
    const profileContainer = document.querySelector('.profile-container');
    const controls = document.querySelector('.controls');
    const addComment = document.querySelector('.add-comment');
    const commentsSection = document.querySelector('.comments');
    const trendingSidebar = document.querySelector('.trending-sidebar');
    const exploreResults = document.getElementById('explore-results');

    // Ocultar elementos da página inicial
    if (profileContainer) profileContainer.remove();
    if (controls) controls.style.display = 'none';
    if (addComment) addComment.style.display = 'none';
    if (commentsSection) commentsSection.style.display = 'none';
    if (exploreResults) exploreResults.style.display = 'none';

    // Criar ou atualizar container para itens salvos
    let savedPostsContainer = document.querySelector('.saved-posts-container');
    if (!savedPostsContainer) {
        savedPostsContainer = document.createElement('div');
        savedPostsContainer.classList.add('saved-posts-container');
        mainContent.appendChild(savedPostsContainer);
    }

    savedPostsContainer.innerHTML = `
        <div class="saved-posts-header">
            <button class="back-btn" onclick="handleMenuAction('Página Inicial')"><i class="fa-solid fa-arrow-left"></i></button>
            <h2>Itens Salvos</h2>
        </div>
        <div class="saved-posts-content" id="saved-posts-content"></div>
    `;

    // Carregar userProfile do localStorage para garantir dados atualizados
    userProfile = JSON.parse(localStorage.getItem(`userProfile_${currentUser.username}`)) || userProfile;
    userProfile.savedPosts = Array.isArray(userProfile.savedPosts) ? userProfile.savedPosts : [];
    
    // Filtrar comentários salvos e verificar se ainda existem
    const savedComments = comments.filter(c => userProfile.savedPosts.includes(c.id));

    // Atualizar savedPosts para remover IDs de comentários que não existem mais
    userProfile.savedPosts = savedComments.map(c => c.id);
    try {
        localStorage.setItem(`userProfile_${currentUser.username}`, JSON.stringify(userProfile));
        console.log(`userProfile atualizado após limpar savedPosts inválidos:`, userProfile);
    } catch (e) {
        console.error("Erro ao salvar no localStorage:", e);
        if (e.name === "QuotaExceededError") {
            addNotification("Armazenamento cheio! Limpe alguns dados ou use outro navegador.");
        } else {
            addNotification("Erro ao atualizar posts salvos.");
        }
    }

    // Renderizar posts salvos
    const savedPostsContent = document.getElementById('saved-posts-content');
    if (savedComments.length === 0) {
        savedPostsContent.innerHTML = '<p class="p-alerta">Você ainda não salvou nenhum post.</p>';
    } else {
        savedComments.forEach(comment => {
            const commentElement = createCommentElement(comment, comment.id);
            savedPostsContent.appendChild(commentElement);
        });
    }

    // Mostrar trending sidebar
    if (trendingSidebar) {
        trendingSidebar.style.display = 'block';
        renderTrending();
    }

    addNotification('Exibindo itens salvos.');
    console.log(`Exibindo ${savedComments.length} posts salvos.`);
}

// Função para atualizar o conteúdo do perfil
function updateProfileContent(tab, targetUser) {
    const profilePosts = document.getElementById('profile-posts-content');
    const targetUserProfile = JSON.parse(localStorage.getItem(`userProfile_${targetUser.username}`)) || { visibility: "public" };
    const isCurrentUser = targetUser.username === currentUser.username;
    const canViewProfile = isCurrentUser || targetUserProfile.visibility === "public" || 
                          (targetUserProfile.visibility === "private" && userProfile.followingList.includes(targetUser.username));

    profilePosts.innerHTML = '';

    if (!canViewProfile) {
        profilePosts.innerHTML = '<p>Este perfil é privado. Você precisa seguir este usuário para ver o conteúdo.</p>';
        return;
    }

    switch (tab) {
        case 'posts':
            const userComments = comments.filter(c => c.username === targetUser.username)
                .sort((a, b) => {
                    // Ordena comentários fixados primeiro
                    if (a.pinned && !b.pinned) return -1;
                    if (!a.pinned && b.pinned) return 1;
                    return new Date(b.createdAt) - new Date(a.createdAt); // Mais recentes depois
                });
            userComments.forEach(comment => {
                const commentElement = createCommentElement(comment, comment.id);
                profilePosts.appendChild(commentElement);
            });
            if (userComments.length === 0) {
                profilePosts.innerHTML = '<p class="p-alerta">Este usuário ainda não publicou nenhum post.</p>';
            }
            break;
        case 'replies':
            const userReplies = comments
                .flatMap(c => c.replies || [])
                .filter(r => r.username === targetUser.username);
            userReplies.forEach((reply, index) => {
                const replyElement = createCommentElement(reply, `${reply.id}-reply-${index}`);
                profilePosts.appendChild(replyElement);
            });
            if (userReplies.length === 0) {
                profilePosts.innerHTML = '<p class="p-alerta">Este usuário ainda não respondeu a nenhum comentário.</p>';
            }
            break;
        case 'highlights':
            const highlightedComments = comments
                .filter(c => c.username === targetUser.username && c.featured);
            highlightedComments.forEach(comment => {
                const commentElement = createCommentElement(comment, comment.id);
                profilePosts.appendChild(commentElement);
            });
            if (highlightedComments.length === 0) {
                profilePosts.innerHTML = '<p class="p-alerta">Nenhum destaque disponível para este usuário.</p>';
            }
            break;
        case 'media':
            const mediaComments = comments
                .filter(c => c.username === targetUser.username && c.image);
            mediaComments.forEach(comment => {
                const commentElement = createCommentElement(comment, comment.id);
                profilePosts.appendChild(commentElement);
            });
            if (mediaComments.length === 0) {
                profilePosts.innerHTML = '<p class="p-alerta">Este usuário ainda não publicou mídia.</p>';
            }
            break;
        case 'likes':
            const likedComments = comments.filter(c => c.upvoters && c.upvoters.includes(targetUser.username));
            likedComments.forEach(comment => {
                const commentElement = createCommentElement(comment, comment.id);
                profilePosts.appendChild(commentElement);
            });
            if (likedComments.length === 0) {
                profilePosts.innerHTML = '<p class="p-alerta">Este usuário ainda não curtiu nenhum post.</p>';
            }
            break;
    }
}

// Adiciona os estilos ao documento
const styleSheet = document.createElement('style');
styleSheet.textContent = pinnedStyles;
document.head.appendChild(styleSheet);

// Criar elemento de post para perfil
function createProfilePostElement(post) {
    return `
        <div class="post-item">
            ${post.image ? `<img src="${post.image}" alt="Post" class="post-image">` : ''}
            <div class="post-content">
                <div class="comment-header">
                    <img src="${post.avatar}" alt="Avatar" class="avatar">
                    <span class="username">${post.username}</span>
                    <span class="time">${timeAgo(post.createdAt)}</span>
                </div>
                <div class="comment-body">${post.content}</div>
            </div>
        </div>
    `;
}

// Atualiza a logo na sidebar com a foto de perfil do usuário
document.querySelector('.sidebar-logo .logo').src = currentUser.avatar;
// Atualiza o contador de notificações não lidas
function updateUnreadCount() {
    const totalUnread = notifications.filter(n => !n.read).length;
    unreadCount.textContent = totalUnread;
}

document.addEventListener("DOMContentLoaded", () => {
    userProfileAvatar.src = currentUser.avatar;
    document.querySelector('.sidebar-logo .logo').src = currentUser.avatar;
    renderComments();
    renderTrending();
    updateUserInfo();
    updateUnreadCount();

    // Vincular eventos
    document.getElementById("upload-image").addEventListener("click", uploadImage);
    document.getElementById("send-comment").addEventListener("click", sendComment);
    document.getElementById("cancel-comment").addEventListener("click", cancelComment);

    // Configurar contador de caracteres
    setupCharCounter(document.getElementById("new-comment"), "char-count");
});
// Inicialização
document.addEventListener("DOMContentLoaded", () => {
    userProfileAvatar.src = currentUser.avatar;
    document.querySelector('.sidebar-logo .logo').src = currentUser.avatar;
    renderComments();
    renderTrending();
    updateUserInfo();
    updateUnreadCount();
});

userProfileAvatar.addEventListener('click', (e) => {
    e.stopPropagation();
    showProfilePage();
    document.querySelector('.nav-item[data-label="Perfil"]').classList.add('active');
    document.querySelectorAll('.nav-item:not([data-label="Perfil"])').forEach(nav => nav.classList.remove('active'));
});

// Verificar se estamos na página de comunidades
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('communities.html')) {
        // Inicializar dados do usuário
        updateUserProfile();
        // Renderizar comunidades
        renderCommunities();
    }
});