<?php
$dsn = "pgsql:host=db.jkddrenwrriuyesfuzgc;port=5432;dbname=postgres";
$user = "postgres";
$password = "uHCCAGDMD1@";

try {
    $conn = new PDO($dsn, $user, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    session_start();
    if (!isset($_SESSION['user_id'])) {
        echo json_encode(['success' => false, 'error' => 'Usuário não autenticado']);
        exit;
    }

    $parent_id = $_POST['parentId'];
    $content = $_POST['content'];
    $user_id = $_SESSION['user_id'];

    $stmt = $conn->prepare("SELECT * FROM users WHERE id = :id");
    $stmt->execute(['id' => $user_id]);
    $currentUser = $stmt->fetch(PDO::FETCH_ASSOC);

    $stmt = $conn->prepare("
        INSERT INTO comments (username, avatar, content, created_at, likes, parent_id, upvoters)
        VALUES (:username, :avatar, :content, NOW(), 0, :parent_id, :upvoters)
        RETURNING *
    ");
    $stmt->execute([
        'username' => $currentUser['username'],
        'avatar' => $currentUser['avatar'],
        'content' => $content,
        'parent_id' => $parent_id,
        'upvoters' => json_encode([])
    ]);
    $reply = $stmt->fetch(PDO::FETCH_ASSOC);

    echo json_encode(['success' => true, 'reply' => $reply]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>