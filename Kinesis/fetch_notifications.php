<?php
$dsn = "pgsql:host=db.seu-id.supabase.co;port=5432;dbname=postgres";
$user = "postgres";
$password = "sua-senha-do-supabase";

try {
    $conn = new PDO($dsn, $user, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    session_start();
    if (!isset($_SESSION['user_id'])) {
        echo json_encode(['success' => false, 'error' => 'Usuário não autenticado']);
        exit;
    }

    $stmt = $conn->prepare("SELECT * FROM notifications WHERE user_id = :user_id ORDER BY timestamp DESC");
    $stmt->execute(['user_id' => $_SESSION['user_id']]);
    $notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['success' => true, 'notifications' => $notifications]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>