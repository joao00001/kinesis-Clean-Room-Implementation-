<?php
$dsn = "pgsql:host=db.seu-id.supabase.co;port=5432;dbname=postgres";
$user = "postgres";
$password = "uHCCAGDMD1@";

try {
    $conn = new PDO($dsn, $user, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $email = strtolower(trim($_POST['email']));
    $password_input = $_POST['password'];

    $stmt = $conn->prepare("SELECT * FROM users WHERE email = :email");
    $stmt->execute(['email' => $email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        echo json_encode(['error' => 'Email não encontrado']);
        exit;
    }

    // Verificar senha (assumindo texto simples por enquanto; use password_verify com hash no futuro)
    if ($user['password'] !== $password_input) {
        echo json_encode(['error' => 'Senha incorreta']);
        exit;
    }

    $currentUser = [
        'email' => $user['email'],
        'username' => $user['username'],
        'avatar' => $user['avatar'],
        'handle' => $user['handle']
    ];
    echo json_encode(['success' => true, 'user' => $currentUser]);
} catch (PDOException $e) {
    echo json_encode(['error' => 'Erro ao fazer login: ' . $e->getMessage()]);
}
?>