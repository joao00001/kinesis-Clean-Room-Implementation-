<?php
$dsn = "pgsql:host=db.jkddrenwrriuyesfuzgc;port=5432;dbname=postgres";
$user = "postgres";
$password = "uHCCAGDMD1@";
$supabase_url = "https://jkddrenwrriuyesfuzgc.supabase.co";
$supabase_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImprZGRyZW53cnJpdXllc2Z1emdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMyNzQwMzYsImV4cCI6MjA1ODg1MDAzNn0.FsgntJgmM6JIe8oe00q2G0pTKbbpAFyIjmHVA0WkoT8";

try {
    $conn = new PDO($dsn, $user, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    session_start();
    if (!isset($_SESSION['user_id'])) {
        echo json_encode(['success' => false, 'error' => 'Usuário não autenticado']);
        exit;
    }

    $content = $_POST['content'];
    $user_id = $_SESSION['user_id'];
    $stmt = $conn->prepare("SELECT * FROM users WHERE id = :id");
    $stmt->execute(['id' => $user_id]);
    $currentUser = $stmt->fetch(PDO::FETCH_ASSOC);

    $image_url = null;
    if (isset($_FILES['image']) && $_FILES['image']['tmp_name']) {
        $image_name = "comment_" . time() . ".jpg";
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, "$supabase_url/comments/$image_name");
        curl_setopt($ch, CURLOPT_POST, 1);
        curl_setopt($ch, CURLOPT_POSTFIELDS, file_get_contents($_FILES['image']['tmp_name']));
        curl_setopt($ch, CURLOPT_HTTPHEADER, ["Authorization: Bearer $supabase_key", "Content-Type: image/jpeg"]);
        curl_exec($ch);
        curl_close($ch);
        $image_url = "$supabase_url/public/comments/$image_name";
    }

    $stmt = $conn->prepare("
        INSERT INTO comments (username, avatar, content, created_at, likes, image, upvoters)
        VALUES (:username, :avatar, :content, NOW(), 0, :image, :upvoters)
        RETURNING *
    ");
    $stmt->execute([
        'username' => $currentUser['username'],
        'avatar' => $currentUser['avatar'],
        'content' => $content,
        'image' => $image_url,
        'upvoters' => json_encode([])
    ]);
    $comment = $stmt->fetch(PDO::FETCH_ASSOC);

    echo json_encode(['success' => true, 'comment' => $comment]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>