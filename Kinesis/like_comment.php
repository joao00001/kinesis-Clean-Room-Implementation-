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

    $input = json_decode(file_get_contents('php://input'), true);
    $comment_id = $input['commentId'];
    $user_id = $_SESSION['user_id'];

    $stmt = $conn->prepare("SELECT * FROM users WHERE id = :id");
    $stmt->execute(['id' => $user_id]);
    $currentUser = $stmt->fetch(PDO::FETCH_ASSOC);

    $stmt = $conn->prepare("SELECT * FROM comments WHERE id = :id");
    $stmt->execute(['id' => $comment_id]);
    $comment = $stmt->fetch(PDO::FETCH_ASSOC);

    $upvoters = json_decode($comment['upvoters'], true);
    if (in_array($currentUser['username'], $upvoters)) {
        $upvoters = array_filter($upvoters, fn($u) => $u !== $currentUser['username']);
        $likes = $comment['likes'] - 1;
    } else {
        $upvoters[] = $currentUser['username'];
        $likes = $comment['likes'] + 1;
    }

    $stmt = $conn->prepare("UPDATE comments SET likes = :likes, upvoters = :upvoters WHERE id = :id");
    $stmt->execute([
        'likes' => $likes,
        'upvoters' => json_encode($upvoters),
        'id' => $comment_id
    ]);

    echo json_encode(['success' => true, 'likes' => $likes, 'upvoters' => $upvoters]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>